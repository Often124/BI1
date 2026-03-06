"use client";

interface ScrollingTextProps {
  text: string;
  speed?: number; // durée en secondes
}

export default function ScrollingText({ text, speed = 20 }: ScrollingTextProps) {
  if (!text) return null;

  return (
    <div className="overflow-hidden whitespace-nowrap flex-1 mx-4">
      <span
        className="inline-block animate-scroll-left text-white/90 text-2xl"
        style={{ "--scroll-duration": `${speed}s` } as React.CSSProperties}
      >
        {text}
      </span>
    </div>
  );
}
