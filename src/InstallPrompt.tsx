import { useState, useEffect } from 'react';
import { InstallInstructions } from './InstallInstructions';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    console.log('InstallPrompt: Component mounted');
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    console.log('InstallPrompt: Install status check', {
      isStandalone,
      isInWebAppiOS,
      isInWebAppChrome,
      userAgent: navigator.userAgent
    });
    
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
      console.log('InstallPrompt: App already installed, not showing prompt');
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('InstallPrompt: beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after user has interacted with the app
      console.log('InstallPrompt: Setting timer to show prompt in 5 seconds');
      setTimeout(() => {
        console.log('InstallPrompt: Timer expired, showing prompt');
        setShowInstallPrompt(true);
      }, 5000); // Reduced to 5 seconds for testing
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('InstallPrompt: App installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Check if beforeinstallprompt has already fired
    console.log('InstallPrompt: Adding event listeners');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For testing: show a debug prompt if PWA criteria aren't met
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('InstallPrompt: No beforeinstallprompt event after 3 seconds.');
        console.log('InstallPrompt: This is NORMAL! Browser install criteria:');
        console.log('✅ HTTPS: ' + (location.protocol === 'https:' ? 'YES' : 'NO'));
        console.log('✅ Service Worker: ' + (navigator.serviceWorker ? 'YES' : 'NO'));
        console.log('✅ Manifest: Check Network tab for manifest.webmanifest');
        console.log('');
        console.log('🏆 PWA may still work! Try:');
        console.log('1. Chrome menu → "Install app" or "Add to Home screen"');
        console.log('2. Mobile: Browser menu → "Add to Home screen"');
        console.log('3. Visit app multiple times over several days');
        console.log('4. Use app for longer periods');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Debug: Show current state
  console.log('InstallPrompt: Render check', {
    isInstalled,
    showInstallPrompt,
    hasDeferredPrompt: !!deferredPrompt,
    dismissed: !!sessionStorage.getItem('installPromptDismissed')
  });

  // For debugging: show a test prompt even if PWA conditions aren't met
  const showDebugPrompt = !isInstalled && !sessionStorage.getItem('installPromptDismissed');

  // Don't show if already installed or dismissed this session
  if (isInstalled) {
    return null;
  }

  // Check if user dismissed in this session
  if (sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  // Show either real prompt or debug prompt
  if (!showInstallPrompt && !showDebugPrompt) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {deferredPrompt ? 'Install Coffee App' : '☕ Add to Home Screen'}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                {deferredPrompt 
                  ? 'Get faster access and order coffee with one tap from your home screen!'
                  : 'Install this app for quick access to order coffee anytime! Works like a regular app on your phone.'
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={deferredPrompt ? handleInstallClick : () => setShowInstructions(true)}
                  className="flex-1 bg-primary text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-primary-hover transition-colors"
                >
                  {deferredPrompt ? 'Install' : 'How to Install'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install Instructions Modal */}
      {showInstructions && (
        <InstallInstructions onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
}

// Hook to trigger install prompt at optimal times
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const showInstallPrompt = () => {
    // Trigger install prompt - this would be called when user adds to cart or similar
    const event = new CustomEvent('showInstallPrompt');
    window.dispatchEvent(event);
  };

  return { canInstall, showInstallPrompt };
}