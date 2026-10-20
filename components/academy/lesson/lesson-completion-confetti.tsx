"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Z } from "@/lib/ui/layers";

const CONFETTI_LIGHT_MS = 800;
const CONFETTI_BURST_MS = 3200;
const CONFETTI_COLORS = [
  "#FFB822",
  "#031F82",
  "#2BB3C0",
  "#FF7A9A",
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

function createParticles(
  width: number,
  height: number,
  count: number,
  burst: boolean,
): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const fromCenter = burst && Math.random() > 0.45;
    const fromLeft = !burst && index % 2 === 0;
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 12;
    return {
      x: fromCenter
        ? width * (0.2 + Math.random() * 0.6)
        : burst
          ? Math.random() * width
          : fromLeft
            ? Math.random() * width * 0.14
            : width * (0.86 + Math.random() * 0.14),
      y: fromCenter
        ? height * (0.2 + Math.random() * 0.35)
        : burst
          ? -20 - Math.random() * height * 0.15
          : Math.random() * height,
      vx: fromCenter
        ? Math.cos(angle) * speed
        : burst
          ? (Math.random() - 0.5) * 16
          : (fromLeft ? 1 : -1) * (0.6 + Math.random() * 1.4),
      vy: fromCenter
        ? Math.sin(angle) * speed
        : burst
          ? Math.random() * 8 + 2
          : (Math.random() - 0.35) * 1.6,
      size: Math.random() * (burst ? 14 : 10) + 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
      shape: Math.random() > 0.45 ? "rect" : "circle",
    };
  });
}

/** Full-viewport confetti for lesson Cash in. `light` is the smaller resolution burst. */
export function LessonCompletionConfetti({ light = false }: { light?: boolean }) {
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
    const durationMs = light ? CONFETTI_LIGHT_MS : CONFETTI_BURST_MS;
    const particles = createParticles(
      canvas.width,
      canvas.height,
      light ? 18 : 110,
      !light,
    );
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = elapsed / durationMs;
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

      if (elapsed < durationMs) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [light, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      style={{ zIndex: Z.overlay }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>,
    document.body,
  );
}

export { CONFETTI_BURST_MS as CONFETTI_DURATION_MS };
