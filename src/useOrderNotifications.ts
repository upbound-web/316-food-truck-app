import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useNotificationService } from './NotificationService';

interface Order {
  _id: string;
  orderNumber: number;
  customerName: string;
  status: string;
  _creationTime: number;
}

// Normalize order data for comparison
function normalizeOrder(order: any): Order {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    _creationTime: order._creationTime,
  };
}

export function useOrderNotifications() {
  const { sendOrderNotification, permission } = useNotificationService();
  const orders = useQuery(api.orders.getUserOrders);
  const previousOrdersRef = useRef<Order[]>([]);

  useEffect(() => {
    console.log('🔔 Order notifications hook - checking orders:', {
      permission,
      ordersCount: orders?.length || 0,
      orders: orders?.map(o => ({ id: o._id, status: o.status, orderNumber: o.orderNumber }))
    });

    // Only process notifications if permission is granted and we have orders
    if (permission !== 'granted' || !orders?.length) {
      if (orders) {
        previousOrdersRef.current = orders.map(normalizeOrder);
      }
      return;
    }

    const normalizedCurrentOrders = orders.map(normalizeOrder);
    const previousOrders = previousOrdersRef.current;
    
    console.log('🔔 Comparing orders:', {
      previousCount: previousOrders.length,
      currentCount: normalizedCurrentOrders.length
    });
    
    // If this is the first load, just store the orders without notifications
    if (previousOrders.length === 0) {
      console.log('🔔 First load - storing orders without notifications');
      previousOrdersRef.current = normalizedCurrentOrders;
      return;
    }

    // Check for status changes in existing orders
    let hasChanges = false;
    
    normalizedCurrentOrders.forEach((currentOrder) => {
      const previousOrder = previousOrders.find(
        (prev) => prev._id === currentOrder._id
      );

      console.log('🔔 Checking order:', {
        orderNumber: currentOrder.orderNumber,
        currentStatus: currentOrder.status,
        previousStatus: previousOrder?.status,
        hasChanged: previousOrder && previousOrder.status !== currentOrder.status,
        orderId: currentOrder._id
      });

      if (previousOrder && previousOrder.status !== currentOrder.status) {
        hasChanges = true;
        console.log(`🔔 *** ORDER STATUS CHANGED *** ${previousOrder.status} → ${currentOrder.status} for order #${currentOrder.orderNumber}`);
        
        // Status changed - send notification for preparing or ready status
        if (currentOrder.status === 'preparing' || currentOrder.status === 'ready') {
          console.log('🔔 *** SENDING NOTIFICATION *** for order:', currentOrder.orderNumber);
          
          sendOrderNotification(
            currentOrder.orderNumber,
            currentOrder.status,
            currentOrder.customerName
          ).then(result => {
            console.log('🔔 Notification sent result:', result);
          }).catch(error => {
            console.error('🔔 Notification send error:', error);
          });
        } else {
          console.log('🔔 Status changed but not to preparing/ready:', currentOrder.status);
        }
      }
    });
    
    if (!hasChanges && previousOrders.length > 0) {
      console.log('🔔 No status changes detected in any orders');
    }

    // Update the reference for next comparison
    previousOrdersRef.current = normalizedCurrentOrders;
  }, [orders, permission, sendOrderNotification]);

  // Return notification-related state for UI
  return {
    hasNotificationPermission: permission === 'granted',
    canReceiveNotifications: permission === 'granted' && orders?.length > 0,
  };
}