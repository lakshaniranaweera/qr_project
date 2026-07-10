"use client";

import { useEffect, useRef } from "react";
import { OVERLAY_IMAGE_SRC, OVERLAY_SPAWNS_PER_SECOND } from "@/lib/constants";

// Celebration overlay: a single 2D canvas above the video. One compositor
// layer, a fixed particle pool (zero allocation per frame), and batched
// drawImage calls — no style/layout work, so the video decode pipeline is
// never blocked.
//
// Each particle spawns at a random spot, then travels toward the screen center
// (which equals the full-screen video's center) while shrinking, and fades out
// as it arrives — a "bubbles converging into the video" effect.

interface Particle {
  alive: boolean;
  sx: number; // start x (random spawn point)
  sy: number; // start y
  size: number;
  age: number;
  life: number;
}

const POOL_SIZE = 160;
// The horizontal center line the images converge onto is not full-width: it
// leaves this many CSS px clear on the left and right, so only a centered
// segment remains. Images land within [SIDE_GAP_PX, width - SIDE_GAP_PX].
const SIDE_GAP_PX = 250;
// Fraction of a particle's life spent travelling to the line; the rest is spent
// fading out in place. Nothing fades before arriving.
const TRAVEL_END = 0.65;

export default function LogoOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Sizing lives in the render loop: the window can report 0×0 at mount
    // (hidden/minimized), and a canvas sized then would stay blank forever.
    const syncSize = () => {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
      return canvas.width > 0 && canvas.height > 0;
    };
    syncSize();

    const img = new Image();
    img.src = OVERLAY_IMAGE_SRC;

    const pool: Particle[] = Array.from({ length: POOL_SIZE }, () => ({
      alive: false,
      sx: 0,
      sy: 0,
      size: 0,
      age: 0,
      life: 1,
    }));

    const spawn = () => {
      const p = pool.find((q) => !q.alive);
      if (!p) return; // pool exhausted — skip, never allocate
      p.alive = true;
      p.size = (80 + Math.random() * 150) * dpr;

      // Spawn anywhere around the screen, including off-screen on every side,
      // so images fly in from outside the video boundaries.
      const marginX = canvas.width * 0.2;
      const marginY = canvas.height * 0.2;
      p.sx = -marginX + Math.random() * (canvas.width + 2 * marginX);
      p.sy = -marginY + Math.random() * (canvas.height + 2 * marginY);

      p.age = 0;
      p.life = 1.2 + Math.random() * 1.5;
    };

    let last = performance.now();
    let acc = 0;
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!syncSize()) return; // window has no size yet — try next frame

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (img.naturalWidth === 0) return; // image not decoded yet

      // frame-rate-independent spawner
      acc += dt * OVERLAY_SPAWNS_PER_SECOND;
      while (acc >= 1) {
        spawn();
        acc -= 1;
      }

      const aspect = img.naturalHeight / img.naturalWidth;
      const cy = canvas.height / 2;
      // The center line is a centered horizontal segment: images land on y = cy
      // with x clamped into [minX, maxX] so the line leaves a gap on both sides.
      const sideGap = SIDE_GAP_PX * dpr;
      let minX = sideGap;
      let maxX = canvas.width - sideGap;
      if (maxX < minX) minX = maxX = canvas.width / 2; // too narrow — collapse
      for (const p of pool) {
        if (!p.alive) continue;
        p.age += dt;
        if (p.age >= p.life) {
          p.alive = false;
          continue;
        }

        const t = p.age / p.life;
        // Travel phase: ease from the spawn point to the line, arriving at
        // t = TRAVEL_END; the rest of the life is spent fading out in place.
        const tp = Math.min(t / TRAVEL_END, 1);
        const e = tp * tp * (3 - 2 * tp); // smooth ease-in-out

        // Target: the horizontal center line, x pulled into the centered segment.
        const targetX = Math.min(Math.max(p.sx, minX), maxX);
        const x = p.sx + e * (targetX - p.sx);
        const y = p.sy + e * (cy - p.sy);
        // Scale down gradually (linearly) across the whole animation, to ~15%.
        const w = p.size * (1 - t * 0.85);
        const h = w * aspect;
        // Solid until it reaches the line, then fade out in place.
        ctx.globalAlpha =
          t <= TRAVEL_END ? 1 : 1 - (t - TRAVEL_END) / (1 - TRAVEL_END);
        ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
