import { useEffect, useRef } from 'react';

/** Animated point-cloud mesh overlay that pulses with "depth" waves over the hero face. */
export default function HeroHologram({ locked }: { locked: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // Parametric face-ish ellipsoid point cloud
    type P = { u: number; v: number; seed: number };
    const pts: P[] = [];
    for (let i = 0; i < 520; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      pts.push({ u, v, seed: Math.random() });
    }

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.47;
      const rx = Math.min(w * 0.17, 260);
      const ry = rx * 1.32;
      const rot = Math.sin(t * 0.25) * 0.35;
      const pulse = (t * 0.55) % 1;
      const projected: { x: number; y: number; z: number }[] = [];

      for (const p of pts) {
        const sx = Math.sin(p.v) * Math.cos(p.u + rot);
        const sy = Math.cos(p.v);
        const sz = Math.sin(p.v) * Math.sin(p.u + rot);
        if (sz < -0.15) continue;
        const x = cx + sx * rx;
        const y = cy - sy * ry;
        projected.push({ x, y, z: sz });
        const depthWave = Math.exp(-Math.pow((1 - (sy + 1) / 2 - pulse) * 9, 2));
        const a = 0.12 + sz * 0.35 + depthWave * 0.55;
        const size = 0.6 + sz * 1.1 + depthWave * 1.4;
        ctx.fillStyle = lockedRef.current ? `rgba(0,240,255,${a})` : `rgba(16,185,129,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sparse links between near points
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i += 3) {
        const a = projected[i];
        for (let j = i + 1; j < Math.min(projected.length, i + 18); j++) {
          const b = projected[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < rx * 0.22) {
            ctx.strokeStyle = `rgba(34,211,238,${0.08 * (1 - d / (rx * 0.22)) * (0.5 + a.z)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Depth pulse ring
      const ringR = rx * (0.9 + pulse * 0.9);
      ctx.strokeStyle = `rgba(0,240,255,${0.18 * (1 - pulse)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, ringR, ringR * 1.28, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Targeting brackets
      const bw = rx * 1.45;
      const bh = ry * 1.35;
      const L = 26;
      ctx.strokeStyle = lockedRef.current ? 'rgba(0,240,255,0.7)' : 'rgba(0,240,255,0.35)';
      ctx.lineWidth = 1.5;
      const corners: [number, number, number, number][] = [
        [cx - bw, cy - bh, 1, 1],
        [cx + bw, cy - bh, -1, 1],
        [cx - bw, cy + bh, 1, -1],
        [cx + bw, cy + bh, -1, -1],
      ];
      for (const [x, y, dx, dy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + dx * L, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * L);
        ctx.stroke();
      }
      // scan line within bracket
      const sy = cy - bh + ((t * 0.35) % 1) * bh * 2;
      const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
      g.addColorStop(0, 'rgba(0,240,255,0)');
      g.addColorStop(0.5, 'rgba(0,240,255,0.45)');
      g.addColorStop(1, 'rgba(0,240,255,0)');
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - bw, sy);
      ctx.lineTo(cx + bw, sy);
      ctx.stroke();

      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(0,240,255,0.6)';
      ctx.fillText(`FACE_0 · 468 pts · z=${(0.42 + Math.sin(t) * 0.04).toFixed(3)}`, cx - bw, cy - bh - 8);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
