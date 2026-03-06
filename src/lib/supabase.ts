import { createClient } from "@supabase/supabase-js";

const resolvedSupabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	process.env.SUPABASE_URL ||
	"";

const resolvedSupabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.SUPABASE_ANON_KEY ||
	process.env.CLIENT_KEY ||
	"";

const supabaseUrl = resolvedSupabaseUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = resolvedSupabaseAnonKey || "placeholder-anon-key";

if (!resolvedSupabaseUrl || !resolvedSupabaseAnonKey) {
	console.warn(
		"Supabase env vars manquantes: utilisez NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (ou SUPABASE_URL + CLIENT_KEY)"
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
