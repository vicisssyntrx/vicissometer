export default function LightLeakBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Top-left warm red leak */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, hsl(0, 72%, 51%) 0%, transparent 70%)" }}
      />
      {/* Bottom-right subtle leak */}
      <div
        className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, hsl(0, 72%, 51%) 0%, transparent 70%)" }}
      />
      {/* Center-top warm glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(ellipse, hsl(0, 50%, 40%) 0%, transparent 70%)" }}
      />
    </div>
  );
}
