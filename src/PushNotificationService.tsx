import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = 'BJv1nAEKV5vpVMzwmJOeAwMI4Pn88c_Ghibx6VBCLLnPGHn9sp9e2owTR2_O1W8AhuJDBkmEr3bkpo-UFcRVEu8';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  // Convex mutations and queries
  const subscribeToPushMutation = useMutation(api.pushNotifications.subscribeToPush);
  const unsubscribeFromPushMutation = useMutation(api.pushNotifications.unsubscribeFromPush);
  const userPushSubscription = useQuery(api.pushNotifications.getUserPushSubscription);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      // Check if user is already subscribed
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.getSubscription();
      }).then(subscription => {
        if (subscription) {
          setPushSubscription({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
            }
          });
        }
      });
    }
  }, []);

  // Update local state when Convex subscription data changes
  useEffect(() => {
    if (userPushSubscription && !pushSubscription) {
      setPushSubscription({
        endpoint: userPushSubscription.endpoint,
        keys: {
          p256dh: userPushSubscription.p256dh,
          auth: userPushSubscription.auth
        }
      });
    }
  }, [userPushSubscription, pushSubscription]);

  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      console.log('🔔 Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID key to Uint8Array
      const vapidKeyUint8Array = new Uint8Array(
        atob(VAPID_PUBLIC_KEY)
          .split('')
          .map(c => c.charCodeAt(0))
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyUint8Array
      });

      const pushSub = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        }
      };

      setPushSubscription(pushSub);
      
      // Save subscription to Convex backend
      try {
        await subscribeToPushMutation({
          endpoint: pushSub.endpoint,
          p256dh: pushSub.keys.p256dh,
          auth: pushSub.keys.auth,
        });
        console.log('🔔 Push subscription saved to Convex');
      } catch (error) {
        console.error('🔔 Failed to save subscription to Convex:', error);
      }
      
      return pushSub;
    } catch (error) {
      console.error('🔔 Failed to subscribe to push notifications:', error);
      return null;
    }
  }, [isSupported, subscribeToPushMutation]);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!pushSubscription) return true;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setPushSubscription(null);
        
        // Remove subscription from Convex backend
        try {
          await unsubscribeFromPushMutation();
          console.log('🔔 Unsubscribed from push notifications');
        } catch (error) {
          console.error('🔔 Failed to remove subscription from Convex:', error);
        }
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('🔔 Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, [pushSubscription, unsubscribeFromPushMutation]);

  return {
    isSupported,
    pushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribed: !!pushSubscription
  };
}

// Component for managing push notification subscription
export function PushNotificationManager() {
  const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
          <span className="text-yellow-800 text-sm">
            Push notifications not supported on this device
          </span>
        </div>
      </div>
    );
  }

  const handleToggleSubscription = async () => {
    setIsLoading(true);
    
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
      } else {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Failed to toggle push subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">Background Notifications</h4>
          <p className="text-sm text-blue-700">
            Get notified even when the app is closed
          </p>
        </div>
        <button
          onClick={handleToggleSubscription}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isSubscribed
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {isLoading ? '...' : isSubscribed ? 'Disable' : 'Enable'}
        </button>
      </div>
      
      {isSubscribed && (
        <div className="mt-3 text-xs text-blue-600">
          ✅ You'll receive notifications even when the app is closed
        </div>
      )}
    </div>
  );
}