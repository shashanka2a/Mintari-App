import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check if running in fullscreen mode (iOS PWA)
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Check if app was previously installed
      const wasInstalled = localStorage.getItem('mintari-pwa-installed');
      if (wasInstalled === 'true') {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay (don't be too pushy)
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('mintari-pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        setShowInstallPrompt(false);
        localStorage.setItem('mintari-pwa-installed', 'true');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('mintari-pwa-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  // Check if user dismissed in this session
  if (sessionStorage.getItem('mintari-pwa-dismissed') === 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="bg-white/95 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink/30 to-lavender/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-mintari-ink" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-mintari-ink mb-1">
                Install Mintari
              </h3>
              <p className="text-sm text-mintari-ink/70 mb-3">
                Get the full app experience with offline access to your collections.
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 text-xs text-mintari-ink/60">
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-mintari-ink/60">
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1 bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
