import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

interface Order {
  _id: string;
  orderNumber: number;
  customerName: string;
  status: string;
  _creationTime: number;
}

function normalizeOrder(order: any): Order {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    _creationTime: order._creationTime,
  };
}

export function useStaffOrderNotifications(onNewOrders?: (orders: any[]) => void) {
  const orders = useQuery(api.orders.getActiveStaffOrders, { limit: 50 });
  const previousOrdersRef = useRef<Order[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on mount
  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio();
    // Using a simple beep sound (data URL for a short beep)
    audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeBC2Q2PLYbCEAKoDO9+NWQA0VYrPq7phNEgtOhOj0wl8QAEAG';
    audioRef.current.volume = 0.3; // Set to 30% volume
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  };

  useEffect(() => {
    if (!orders?.length) {
      if (orders) {
        previousOrdersRef.current = orders.map(normalizeOrder);
      }
      return;
    }

    const normalizedCurrentOrders = orders.map(normalizeOrder);
    const previousOrders = previousOrdersRef.current;

    // If this is the first load, just store the orders without notifications
    if (previousOrders.length === 0) {
      previousOrdersRef.current = normalizedCurrentOrders;
      return;
    }

    // Check for new orders (orders that weren't in the previous list)
    const newOrders = normalizedCurrentOrders.filter(currentOrder =>
      !previousOrders.some(prevOrder => prevOrder._id === currentOrder._id)
    );

    // Play sound and notify for new orders
    if (newOrders.length > 0) {
      console.log(`🔔 Staff: ${newOrders.length} new order(s) detected:`,
        newOrders.map(o => `#${o.orderNumber} (${o.customerName})`).join(', ')
      );
      playNotificationSound();

      // Call the callback with the full order objects (not the normalized subset)
      if (onNewOrders) {
        const fullNewOrders = orders!.filter(order =>
          newOrders.some(n => n._id === order._id)
        );
        onNewOrders(fullNewOrders);
      }
    }

    // Update the reference for next comparison
    previousOrdersRef.current = normalizedCurrentOrders;
  }, [orders]);

  return {
    hasNewOrdersSupport: true,
  };
}