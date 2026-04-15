import { useEffect } from "react";
import { toast } from "sonner";
import {
  DeferredInstallPromptEvent,
  getInstallLabel,
  isRunningStandalone,
} from "@/lib/pwa";

const INSTALL_NUDGE_KEY = "viciss_install_nudged";

export default function PwaInstallManager() {
  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as DeferredInstallPromptEvent;
      promptEvent.preventDefault();
      window.__vicissInstallPromptEvent = promptEvent;

      if (isRunningStandalone() || localStorage.getItem(INSTALL_NUDGE_KEY) === "true") {
        return;
      }

      const actionLabel = getInstallLabel();
      toast("Install Vicissometer for a better mobile experience.", {
        duration: 12000,
        action: {
          label: actionLabel,
          onClick: async () => {
            try {
              await promptEvent.prompt();
              const choice = await promptEvent.userChoice;
              if (choice.outcome === "accepted") {
                localStorage.setItem(INSTALL_NUDGE_KEY, "true");
                toast.success("Installation started");
              }
            } catch {
              toast.error("Install prompt is not available right now");
            }
          },
        },
      });
      localStorage.setItem(INSTALL_NUDGE_KEY, "true");
    };

    const onInstalled = () => {
      window.__vicissInstallPromptEvent = undefined;
      toast.success("Vicissometer installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
