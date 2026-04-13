'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPromptFixed() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('pwa-prompt-dismissed') === 'true';
  });

  useEffect(() => {
    // Only show once per session - check immediately
    if (dismissed) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Respect the dismiss flag - check sessionStorage directly
      if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') return;
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  }, []);

  // Don't render if already installed or dismissed
  if (dismissed || installed) return null;

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 left-3 right-3 z-30 max-w-md mx-auto"
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-[#e6edf3]">
                  Install Elite Striker
                </h3>
                <p className="text-[11px] text-[#8b949e] mt-0.5">
                  Add to home screen for offline support.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium rounded-md transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-2.5 py-1 text-[#8b949e] hover:text-[#c9d1d9] text-[11px] font-medium rounded-md hover:bg-[#21262d] transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-[#484f58] hover:text-[#8b949e] transition-colors mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
