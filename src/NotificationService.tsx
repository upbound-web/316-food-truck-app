import { useState, useEffect, useCallback } from 'react';

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isPWAInstalled: boolean;
  canRequestPermission: boolean;
}

export function useNotificationService() {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isPWAInstalled: false,
    canRequestPermission: false,
  });

  // Detect if PWA is installed
  const detectPWAInstallation = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    return isStandalone || isInWebAppiOS || isInWebAppChrome;
  }, []);

  // Check notification support and PWA status
  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    const isPWAInstalled = detectPWAInstallation();
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    
    setPermissionState({
      permission: isSupported ? Notification.permission : 'denied',
      isSupported,
      isPWAInstalled,
      canRequestPermission: isSupported && isPWAInstalled && Notification.permission === 'default',
    });

    console.log('🔔 Notification Service Debug:', {
      isSupported,
      isPWAInstalled,
      isAndroid,
      permission: isSupported ? Notification.permission : 'denied',
      canRequestPermission: isSupported && isPWAInstalled && Notification.permission === 'default',
      userAgent: userAgent.substring(0, 100),
      hasServiceWorker: 'serviceWorker' in navigator,
      swReady: navigator.serviceWorker?.ready
    });

    // Add notification click handling
    if (isSupported && isPWAInstalled) {
      const handleNotificationClick = (event: any) => {
        console.log('Notification clicked in app:', event);
        
        // Navigate to orders tab if notification was clicked
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'orders') {
          // Trigger a custom event to switch to orders tab
          window.dispatchEvent(new CustomEvent('switchToOrders'));
        }
      };

      // Listen for notification clicks through service worker messages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', handleNotificationClick);
        
        return () => {
          navigator.serviceWorker.removeEventListener('message', handleNotificationClick);
        };
      }
    }
  }, [detectPWAInstallation]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!permissionState.isSupported || !permissionState.isPWAInstalled) {
      console.log('🔔 Cannot request permission: not supported or PWA not installed');
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');

    console.log('🔔 Requesting notification permission...', {
      isAndroid,
      currentPermission: Notification.permission,
      isSupported: permissionState.isSupported,
      isPWAInstalled: permissionState.isPWAInstalled
    });

    try {
      // On Android, the permission request might not show a dialog
      // due to Chrome policy changes in Android 13+
      const permission = await Notification.requestPermission();
      
      console.log('🔔 Permission request result:', permission);
      
      setPermissionState(prev => ({
        ...prev,
        permission,
        canRequestPermission: permission === 'default',
      }));

      if (permission === 'denied' && isAndroid) {
        console.log('🔔 Android permission denied - user needs to enable manually in site settings');
        // On Android, if denied, user needs to manually enable in Chrome settings
        return false;
      }

      return permission === 'granted';
    } catch (error) {
      console.error('🔔 Error requesting notification permission:', error);
      return false;
    }
  }, [permissionState.isSupported, permissionState.isPWAInstalled]);

  // Send a notification using the appropriate method for the platform
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (permissionState.permission !== 'granted' || !permissionState.isSupported) {
      console.log('🔔 Cannot send notification: permission not granted or not supported');
      return null;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;

    try {
      // Android-compatible notification options
      const notificationOptions: NotificationOptions = {
        icon: '/icons/pwa-192x192.png', // Use PNG for better Android compatibility
        badge: '/icons/pwa-192x192.png',
        tag: options?.tag || 'coffee-order',
        requireInteraction: false, // Set to false for Android compatibility
        silent: false,
        ...options,
      };

      // Remove actions for Android compatibility if they're causing issues
      if (isAndroid && notificationOptions.actions) {
        console.log('🔔 Android detected - removing notification actions for compatibility');
        delete notificationOptions.actions;
      }

      console.log('🔔 Creating notification with options:', notificationOptions);
      console.log('🔔 Platform detection:', { isAndroid, isPWA, hasServiceWorker: 'serviceWorker' in navigator });

      // For Android PWAs, use ServiceWorkerRegistration.showNotification
      if (isAndroid && isPWA && 'serviceWorker' in navigator) {
        console.log('🔔 Using ServiceWorkerRegistration.showNotification for Android PWA');
        
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, notificationOptions);
          console.log('🔔 ServiceWorker notification sent successfully');
          return { type: 'serviceWorker', success: true };
        } catch (swError) {
          console.error('🔔 ServiceWorker notification failed, falling back to basic:', swError);
          // Fall through to basic notification
        }
      }

      // Fallback to basic Notification constructor for other platforms
      console.log('🔔 Using basic Notification constructor');
      const notification = new Notification(title, notificationOptions);

      // Auto-close after 10 seconds
      setTimeout(() => {
        try {
          notification.close();
        } catch (e) {
          console.log('Notification already closed');
        }
      }, 10000);

      return notification;
    } catch (error) {
      console.error('🔔 Error sending notification:', error);
      return null;
    }
  }, [permissionState.permission, permissionState.isSupported]);

  // Send order status notification
  const sendOrderNotification = useCallback(async (orderNumber: number, status: string, customerName: string) => {
    console.log('🔔 sendOrderNotification called:', { orderNumber, status, customerName, permission: permissionState.permission });
    
    const statusMessages = {
      preparing: `Your order #${orderNumber} is now being prepared ☕`,
      ready: `Your order #${orderNumber} is ready for pickup! 🎉`,
    };

    const message = statusMessages[status as keyof typeof statusMessages];
    if (!message) {
      console.log('🔔 No message for status:', status);
      return null;
    }

    console.log('🔔 Sending notification with message:', message);
    
    try {
      const result = await sendNotification(`Hi ${customerName}!`, {
        body: message,
        tag: `order-${orderNumber}`,
        data: {
          orderNumber,
          status,
          url: '/?tab=orders', // Navigate to orders page
        },
        // Actions might cause issues on some Android versions, let's keep it simple
        actions: [
          {
            action: 'view',
            title: 'View Order',
          }
        ],
      });
      
      console.log('🔔 Notification result:', result);
      return result;
    } catch (error) {
      console.error('🔔 sendOrderNotification error:', error);
      return null;
    }
  }, [sendNotification, permissionState.permission]);

  // Test notification function
  const sendTestNotification = useCallback(() => {
    return sendOrderNotification(123, 'ready', 'Test User');
  }, [sendOrderNotification]);

  return {
    ...permissionState,
    requestPermission,
    sendNotification,
    sendOrderNotification,
    sendTestNotification,
  };
}

// Component to show notification permission request
export function NotificationPermissionPrompt({ onPermissionGranted }: { onPermissionGranted?: () => void }) {
  const { canRequestPermission, isPWAInstalled, requestPermission, permission } = useNotificationService();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = userAgent.includes('android');

  useEffect(() => {
    // Show prompt only if we can request permission and user hasn't dismissed it
    const dismissed = localStorage.getItem('notificationPromptDismissed');
    setIsDismissed(!!dismissed);
    
    if (canRequestPermission && !dismissed) {
      // Show after a short delay to not be intrusive
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canRequestPermission]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsVisible(false);
      onPermissionGranted?.();
    } else if (isAndroid) {
      // Show manual instructions for Android
      setShowManualInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  // Show manual instructions for Android if permission was denied
  if (showManualInstructions && isAndroid) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md">
        <div className="bg-orange-50 rounded-lg shadow-lg border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-orange-900 mb-1">
                Enable Notifications Manually
              </h3>
              <div className="text-xs text-orange-800 mb-3 space-y-1">
                <p>• Tap the <strong>⋮</strong> menu in Chrome</p>
                <p>• Select <strong>"Site settings"</strong></p>
                <p>• Tap <strong>"Notifications"</strong></p>
                <p>• Turn on <strong>"Show notifications"</strong></p>
              </div>
              <button
                onClick={() => setShowManualInstructions(false)}
                className="w-full bg-orange-500 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-orange-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isPWAInstalled || !canRequestPermission || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Get Order Updates
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Stay notified when your coffee is ready for pickup!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRequestPermission}
                className="flex-1 bg-primary text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-primary-hover transition-colors"
              >
                Enable Notifications
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
  );
}