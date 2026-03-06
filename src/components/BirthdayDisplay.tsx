"use client";

import { useState, useEffect } from "react";
import { Birthday } from "@/types";

const MONTH_NAMES = [
  "", "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

interface UpcomingInfo {
  birthday: Birthday;
  daysUntil: number;
  isToday: boolean;
}

function getDaysUntil(b: Birthday): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();
  let nextDate = new Date(thisYear, b.month - 1, b.day);
  nextDate.setHours(0, 0, 0, 0);

  // Si la date est passée cette année, prendre l'année prochaine
  if (nextDate.getTime() < today.getTime()) {
    nextDate = new Date(thisYear + 1, b.month - 1, b.day);
    nextDate.setHours(0, 0, 0, 0);
  }

  return Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getNextBirthday(birthdays: Birthday[]): UpcomingInfo | null {
  if (birthdays.length === 0) return null;

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1; // 1-based

  let best: UpcomingInfo | null = null;

  for (const b of birthdays) {
    const daysUntil = getDaysUntil(b);
    const isToday = b.day === todayDay && b.month === todayMonth;

    if (!best || daysUntil < best.daysUntil) {
      best = { birthday: b, daysUntil, isToday };
    }
  }

  return best;
}

export default function BirthdayDisplay() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingInfo | null>(null);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const res = await fetch("/api/birthdays");
        if (res.ok) {
          const data: Birthday[] = await res.json();
          setBirthdays(data);
        }
      } catch (error) {
        console.error("Erreur anniversaires:", error);
      }
    };

    fetchBirthdays();
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchBirthdays, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUpcoming(getNextBirthday(birthdays));
  }, [birthdays]);

  // Recalculer à minuit
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setUpcoming(getNextBirthday(birthdays));
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [birthdays]);

  if (!upcoming) return null;

  const { birthday, daysUntil, isToday } = upcoming;

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xl ${isToday ? "animate-bounce" : ""}`}>🎂</span>
      <div className="flex flex-col">
        {isToday ? (
          <>
            <span className="text-sm font-semibold text-yellow-300 leading-tight">
              Joyeux anniversaire {birthday.name} !
            </span>
          </>
        ) : daysUntil === 1 ? (
          <>
            <span className="text-sm font-semibold text-white leading-tight">
              {birthday.name}
            </span>
            <span className="text-xs text-white/60 leading-tight">
              Demain !
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-white leading-tight">
              {birthday.name}
            </span>
            <span className="text-xs text-white/60 leading-tight">
              {birthday.day} {MONTH_NAMES[birthday.month]} — dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
