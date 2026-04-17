import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    let expandPhase = 0; // slow breathing/expansion

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Free-drifting background stars (independent of galaxy rings)
    type Star = { x: number; y: number; vx: number; vy: number; r: number; o: number };
    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.5 + 0.4,
      });
    }

    // Dust particles scattered in ring bands
    type DustParticle = { ring: number; theta: number; r: number; o: number; size: number };
    const dust: DustParticle[] = [];

    // Ring definitions: [radiusFraction, peakOpacity, glowWidth]
    const ringDefs: [number, number, number][] = [
      [0.10, 0.95, 18],  // innermost bright ring (accretion disc)
      [0.22, 0.45, 8],   // second ring
      [0.36, 0.22, 5],   // third ring
      [0.50, 0.10, 3],   // outermost faint ring
    ];

    // Seed dust particles along each ring
    for (let ri = 0; ri < ringDefs.length; ri++) {
      const [frac, peakOp] = ringDefs[ri];
      const particleCount = Math.floor(130 - ri * 30); // fewer on outer rings
      for (let i = 0; i < particleCount; i++) {
        const spread = 0.025 + ri * 0.008; // ring thickness
        dust.push({
          ring: ri,
          theta: Math.random() * Math.PI * 2,
          r: frac + (Math.random() - 0.5) * spread * 2,
          o: (Math.random() * 0.5 + 0.4) * peakOp,
          size: Math.random() * 1.4 + 0.6,
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Galaxy fits larger on desktop, compact on mobile
      const baseR = canvas.width > 768
        ? Math.min(canvas.width, canvas.height) * 0.72
        : Math.min(canvas.width, canvas.height) * 0.42;

      // Very slow rotation + very slow breath
      angle += 0.00055;
      expandPhase += 0.003;
      const breathe = 1 + Math.sin(expandPhase) * 0.012; // ±1.2% pulse

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Y-scale for tilt perspective (disc viewed at ~30° angle)
      const tiltY = 0.48;

      // ── Draw each ring as a soft blur strip ──
      for (const [frac, peakOp, glowW] of ringDefs) {
        const r = baseR * frac * breathe;

        ctx.save();
        ctx.scale(1, tiltY);

        // Outer soft glow around ring
        const gradW = glowW * 2.5;
        for (let pass = gradW; pass > 0; pass -= 1.5) {
          const falloff = (pass / gradW);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 210, 255, ${peakOp * (1 - falloff) * 0.4})`;
          ctx.lineWidth = pass;
          ctx.stroke();
        }
        // Hard bright ring line
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(235, 238, 255, ${peakOp * 0.85})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      }

      // ── Dust particles on rings ──
      for (const p of dust) {
        const r = baseR * p.r * breathe;
        const a = p.theta + angle * (0.3 + p.ring * 0.15); // inner rings rotate slightly faster
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * tiltY;

        // Flicker subtly
        const flicker = 0.75 + Math.sin(expandPhase * 3 + p.theta * 7) * 0.25;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 242, 255, ${p.o * flicker})`;
        ctx.fill();
      }

      // ── Central bright core glow ──
      const coreR = baseR * 0.065 * breathe;
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 3.5);
      coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");
      coreGrad.addColorStop(0.06, "rgba(240, 240, 255, 0.95)");
      coreGrad.addColorStop(0.18, "rgba(200, 210, 255, 0.55)");
      coreGrad.addColorStop(0.40, "rgba(160, 170, 255, 0.18)");
      coreGrad.addColorStop(0.70, "rgba(100, 110, 200, 0.06)");
      coreGrad.addColorStop(1.00, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // ── Soft black hole centre — wide feathered fade, not hard circle ──
      const voidGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 1.2);
      voidGrad.addColorStop(0.0, "rgba(2, 2, 8, 0.92)");
      voidGrad.addColorStop(0.35, "rgba(2, 2, 8, 0.55)");
      voidGrad.addColorStop(0.65, "rgba(2, 2, 8, 0.18)");
      voidGrad.addColorStop(1.0, "rgba(2, 2, 8, 0.0)");
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = voidGrad;
      ctx.fill();

      ctx.restore();

      // ── Free-drifting stars drawn on top of everything ──
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.o})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
