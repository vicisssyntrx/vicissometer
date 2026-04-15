import type { DeferredInstallPromptEvent } from "@/lib/pwa";

declare global {
  interface Window {
    __vicissInstallPromptEvent?: DeferredInstallPromptEvent;
  }
}

export {};
