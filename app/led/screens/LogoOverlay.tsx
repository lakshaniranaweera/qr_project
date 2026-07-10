"use client";

import { useEffect, useRef } from "react";
import { OVERLAY_IMAGE_SRC, OVERLAY_SPAWNS_PER_SECOND } from "@/lib/constants";

// Celebration overlay: a single 2D canvas above the video. One compositor
// layer, a fixed particle pool (zero allocation per frame), and batched
// drawImage calls — no style/layout work, so the video decode pipeline is
// never blocked.
//
// Each particle stays in place (no rotation, no drift): it fades in,
// holds at peak opacity briefly, then fades out.

interface Particle {
  alive: boolean;
  x: number;
  y: number;
  size: number;
  age: number;
  life: number;
  peakAlpha: number;
}

const POOL_SIZE = 160;
// Fractions of a particle's life spent fading in / fading out; the
// remainder is the fully-visible hold.
const FADE_IN = 0.25;
const FADE_OUT = 0.3;

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
      x: 0,
      y: 0,
      size: 0,
      age: 0,
      life: 1,
      peakAlpha: 1,
    }));

    // Keep every button's full bounding box at least this far from all four
    // screen edges (CSS px → canvas px via dpr).
    const EDGE_CLEARANCE = 50 * dpr;

    const spawn = () => {
      const p = pool.find((q) => !q.alive);
      if (!p) return; // pool exhausted — skip, never allocate
      p.alive = true;
      // small buttons scattered across the whole page.
      p.size = (50 + Math.random() * 90) * dpr;

      const halfW = p.size / 2;
      const halfH = (p.size * (img.naturalHeight / img.naturalWidth)) / 2;

      // Random anywhere on the full page (just clear of every edge) — no
      // central protected box, so images cover the entire screen.
      const xMin = EDGE_CLEARANCE + halfW;
      const xMax = Math.max(xMin, canvas.width - EDGE_CLEARANCE - halfW);
      const yMin = EDGE_CLEARANCE + halfH;
      const yMax = Math.max(yMin, canvas.height - EDGE_CLEARANCE - halfH);
      p.x = xMin + Math.random() * (xMax - xMin);
      p.y = yMin + Math.random() * (yMax - yMin);

      p.age = 0;
      p.life = 1.2 + Math.random() * 1.5;
      p.peakAlpha = 0.35 + Math.random() * 0.5;
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
      for (const p of pool) {
        if (!p.alive) continue;
        p.age += dt;
        if (p.age >= p.life) {
          p.alive = false;
          continue;
        }

        // fade in → hold at peak → fade out
        const t = p.age / p.life;
        let envelope = 1;
        if (t < FADE_IN) envelope = t / FADE_IN;
        else if (t > 1 - FADE_OUT) envelope = (1 - t) / FADE_OUT;
        const alpha = p.peakAlpha * envelope;

        const w = p.size;
        const h = p.size * aspect;
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, p.x - w / 2, p.y - h / 2, w, h);
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
