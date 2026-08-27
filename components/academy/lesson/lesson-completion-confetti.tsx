"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Z } from "@/lib/ui/layers";

const CONFETTI_DURATION_MS = 2000;
const CONFETTI_COLORS = [
  "#031F82",
  "#0CC1E0",
  "#FFA503",
  "#22C55E",
  "#BDE9FB",
  "#E11D48",
  "#FFF1A8",
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  shape: "rect" | "circle";
};

function createParticles(width: number, height: number): Particle[] {
  return Array.from({ length: 160 }, () => {
    const fromTop = Math.random() > 0.35;
    return {
      x: Math.random() * width,
      y: fromTop ? -20 - Math.random() * 80 : height * 0.28 + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 11,
      vy: fromTop ? Math.random() * 4 + 2 : -(Math.random() * 8 + 4),
      size: Math.random() * 10 + 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
      shape: Math.random() > 0.45 ? "rect" : "circle",
    };
  });
}

/** Full-viewport confetti for lesson Cash in. Portals to document.body. */
export function LessonCompletionConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    const startedAt = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    let particles = createParticles(canvas.width, canvas.height);
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = elapsed / CONFETTI_DURATION_MS;
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.vy += 0.22;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.spin;
        particle.vx *= 0.995;

        context.save();
        context.globalAlpha = Math.max(0, 1 - progress * 1.05);
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        if (particle.shape === "circle") {
          context.beginPath();
          context.arc(0, 0, particle.size * 0.45, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(
            -particle.size * 0.5,
            -particle.size * 0.28,
            particle.size,
            particle.size * 0.56,
          );
        }
        context.restore();
      }

      if (elapsed < CONFETTI_DURATION_MS) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      style={{ zIndex: Z.dev }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>,
    document.body,
  );
}

export { CONFETTI_DURATION_MS };
