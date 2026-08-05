"use client";

import { useEffect, useRef } from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";

const CONFETTI_DURATION_MS = 1800;
const CONFETTI_COLORS = ["#031F82", "#0CC1E0", "#FFA503", "#22C55E", "#BDE9FB", "#E11D48"];

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
  const originX = width * 0.5;
  const originY = height * 0.38;

  return Array.from({ length: 72 }, () => ({
    x: originX + (Math.random() - 0.5) * width * 0.35,
    y: originY + (Math.random() - 0.5) * 40,
    vx: (Math.random() - 0.5) * 7,
    vy: -(Math.random() * 6 + 3),
    size: Math.random() * 6 + 4,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.25,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

/** One-shot celebratory confetti burst (~1.8s) on lesson completion. */
export function LessonCompletionConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let particles: Particle[] = [];
    const startedAt = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    particles = createParticles(canvas.width, canvas.height);
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = elapsed / CONFETTI_DURATION_MS;

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.vy += 0.18;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.spin;
        particle.vx *= 0.99;

        context.save();
        context.globalAlpha = Math.max(0, 1 - progress * 1.15);
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
            -particle.size * 0.25,
            particle.size,
            particle.size * 0.5,
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
  }, []);

  return (
    <OverlayPortal className="z-[var(--z-index-overlay)] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />
    </OverlayPortal>
  );
}
