export interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

export function getInstallLabel() {
  return isMobileDevice() ? "Download for mobile" : "Download for desktop";
}

export function isRunningStandalone() {
  if (typeof window === "undefined") return false;
  const isIosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || isIosStandalone;
}
