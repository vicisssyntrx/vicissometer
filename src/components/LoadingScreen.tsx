export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="relative flex flex-col items-center justify-center w-28 h-28 glass rounded-3xl shadow-2xl">
        {/* Outer spinning ring around the logo */}
        <div className="absolute inset-0 rounded-3xl border-2 border-primary/30 border-t-primary animate-spin" />
        
        {/* App Logo */}
        <img 
          src="/icon-192.png" 
          alt="Vicissometer Loading..." 
          className="w-14 h-14 rounded-2xl animate-pulse" 
        />
      </div>
    </div>
  );
}
