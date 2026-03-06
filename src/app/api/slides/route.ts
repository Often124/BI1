import { NextRequest, NextResponse } from "next/server";
import { getAllSlides, getSlides, addSlide, updateSlide, deleteSlide, reorderSlides } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// GET /api/slides - Récupérer les slides (publics = actifs, admin = tous)
export async function GET(request: NextRequest) {
  const isAdmin = isAuthenticated(request);
  const slides = isAdmin ? await getAllSlides() : await getSlides();
  return NextResponse.json(slides);
}

// POST /api/slides - Créer un slide (admin uniquement)
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, originalName, duration = 5 } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename requis" }, { status: 400 });
    }

    const allSlides = await getAllSlides();
    const slide = await addSlide({
      id: uuidv4(),
      filename,
      originalName: originalName || filename,
      duration: Number(duration),
      order: allSlides.length,
      active: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    console.error("Create slide error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/slides - Mettre à jour ou réordonner
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Réordonner les slides
    if (body.orderedIds && Array.isArray(body.orderedIds)) {
      const slides = await reorderSlides(body.orderedIds);
      return NextResponse.json(slides);
    }

    // Mettre à jour un slide
    if (body.id) {
      const { id, ...updates } = body;
      const slide = await updateSlide(id, updates);
      if (!slide) {
        return NextResponse.json({ error: "Slide non trouvé" }, { status: 404 });
      }
      return NextResponse.json(slide);
    }

    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  } catch (error) {
    console.error("Update slide error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/slides - Supprimer un slide
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const deleted = await deleteSlide(id);
    if (!deleted) {
      return NextResponse.json({ error: "Slide non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete slide error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
