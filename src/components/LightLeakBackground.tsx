export default function LightLeakBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Subtle cool leaks (avoid red glow) */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, hsla(210, 90%, 60%, 0.9) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, hsla(190, 80%, 55%, 0.85) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(ellipse, hsla(220, 50%, 60%, 0.6) 0%, transparent 70%)" }}
      />
    </div>
  );
}
