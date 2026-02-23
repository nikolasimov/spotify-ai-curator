"use client";

import { useEffect, useRef } from "react";

export default function CursorTrail() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onMouseMove = (e: MouseEvent) => {
      overlay.style.setProperty("--cx", `${e.clientX}px`);
      overlay.style.setProperty("--cy", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundColor: "#08080c",
        WebkitMaskImage:
          "radial-gradient(circle 340px at var(--cx, -9999px) var(--cy, -9999px), transparent 0%, black 70%)",
        maskImage:
          "radial-gradient(circle 340px at var(--cx, -9999px) var(--cy, -9999px), transparent 0%, black 70%)",
      }}
      aria-hidden="true"
    />
  );
}
