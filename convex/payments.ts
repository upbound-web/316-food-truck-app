import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Fix BigInt serialization issue
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as any).toJSON = function() { 
    return this.toString(); 
  };
}

// Security: Helper function to calculate item price server-side
function calculateItemPrice(menuItem: any, size: string, customizations: string[]): number {
  let price = menuItem.basePrice;
  
  // Add size modifier
  const sizeOption = menuItem.sizes.find((s: any) => s.name === size);
  if (sizeOption) {
    price += sizeOption.priceModifier;
  }
  
  // Add customization prices
  customizations.forEach(customization => {
    const customOption = menuItem.customizations.find((c: any) => c.name === customization);
    if (customOption) {
      price += customOption.price;
    }
  });
  
  return price;
}

// SECURE: Action to process Square payment with server-side validation
export const processSquarePayment = action({
  args: {
    sourceId: v.string(), // Square payment token
    customerName: v.string(),
    items: v.array(v.object({
      menuItemId: v.id("menuItems"),
      quantity: v.number(),
      size: v.string(),
      customizations: v.array(v.string()),
      // Removed: itemPrice - calculated server-side for security
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    orderId: string;
    orderNumber: number;
    paymentId: string;
  }> => {
    // SECURITY: Check authentication first
    const user = await ctx.runQuery("auth:loggedInUser" as any);
    if (!user) {
      throw new Error("Authentication required to process payment");
    }

    // BUSINESS HOURS: Reject orders when closed
    const openStatus: any = await ctx.runQuery("settings:isCurrentlyOpen" as any);
    if (!openStatus.isOpen) {
      throw new Error("Sorry, we're currently closed. " + openStatus.reason);
    }

    // SECURITY: Input validation
    if (!args.customerName || args.customerName.trim().length === 0) {
      throw new Error("Customer name is required");
    }
    if (!args.items || args.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }
    if (args.items.length > 50) { // Prevent DoS attacks
      throw new Error("Too many items in order");
    }

    try {
      // SECURITY: Calculate total amount server-side using actual menu prices
      let totalAmount = 0;
      const validatedItems = [];
      
      for (const item of args.items) {
        // Validate quantity
        if (item.quantity < 1 || item.quantity > 99) {
          throw new Error("Invalid quantity");
        }
        
        // Get menu item from database to validate and get real price
        const menuItem = await ctx.runQuery("menu:getMenuItem" as any, { id: item.menuItemId });
        
        // Calculate actual price server-side
        const actualItemPrice = calculateItemPrice(menuItem, item.size, item.customizations);
        totalAmount += actualItemPrice * item.quantity;
        
        validatedItems.push({
          ...item,
          name: menuItem.name,
          itemPrice: actualItemPrice,
        });
      }

      // Convert to cents for Square API
      const amountInCents = Math.round(totalAmount * 100);

      let paymentResult: {
        success: boolean;
        paymentId?: string;
        error?: string;
      };
      
      // Handle demo/mock payments (remove in production)
      if (args.sourceId.startsWith("mock_token_")) {
        paymentResult = {
          success: true,
          paymentId: `demo_payment_${Date.now()}`
        };
      } else {
        // Process real payment with Square API using server-calculated amount
        // FIXED: Keep idempotency key under 45 characters for Square API
        const timestamp = Date.now().toString(36); // Shorter timestamp
        const random = Math.random().toString(36).substring(2, 8); // 6 chars
        const userIdShort = user._id.substring(0, 8); // First 8 chars of user ID
        const idempotencyKey = `${userIdShort}-${timestamp}-${random}`; // ~30 chars

        // Build item summary for Square payment note
        const itemSummary = validatedItems
          .map(i => `${i.quantity}x ${i.name} (${i.size})`)
          .join(", ");

        paymentResult = await processSquarePaymentAPI({
          sourceId: args.sourceId,
          amount: amountInCents,
          idempotencyKey,
          note: `App Sale - ${args.customerName.trim()}: ${itemSummary}`.slice(0, 500),
          referenceId: `app-order-${timestamp}-${random}`,
        });
      }

      if (!paymentResult.success) {
        // SECURITY: Don't expose internal payment errors to client
        console.error("Payment processing failed:", paymentResult.error);
        throw new Error("Payment processing failed. Please try again.");
      }

      // Create the order after successful payment
      const orderResult: {
        orderId: string;
        orderNumber: number;
      } = await ctx.runMutation("payments:createOrderAfterPayment" as any, {
        customerName: args.customerName.trim(),
        totalAmount: totalAmount,
        paymentId: paymentResult.paymentId!,
        items: validatedItems,
      });

      return { 
        success: true, 
        orderId: orderResult.orderId, 
        orderNumber: orderResult.orderNumber,
        paymentId: paymentResult.paymentId! 
      };
    } catch (error) {
      console.error("Payment processing failed:", error);
      // SECURITY: Generic error message to prevent information leakage
      throw new Error("Payment processing failed. Please try again.");
    }
  },
});

// Internal mutation to create order after payment succeeds
export const createOrderAfterPayment = mutation({
  args: {
    customerName: v.string(),
    totalAmount: v.number(),
    paymentId: v.string(),
    items: v.array(v.object({
      menuItemId: v.id("menuItems"),
      name: v.string(),
      quantity: v.number(),
      size: v.string(),
      customizations: v.array(v.string()),
      itemPrice: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // SECURITY: Get the authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create order");
    }

    // SECURITY: Input validation
    if (!args.customerName || args.customerName.trim().length === 0) {
      throw new Error("Customer name is required");
    }
    if (args.customerName.length > 100) {
      throw new Error("Customer name too long");
    }
    if (args.totalAmount <= 0 || args.totalAmount > 10000) {
      throw new Error("Invalid order total");
    }
    if (!args.paymentId || args.paymentId.length === 0) {
      throw new Error("Payment ID required");
    }

    // Generate order number (atomic operation to prevent duplicates)
    const existingOrders = await ctx.db.query("orders").collect();
    const orderNumber = existingOrders.length + 1;

    // Create the order after successful payment
    const orderId = await ctx.db.insert("orders", {
      userId,
      customerName: args.customerName.trim(),
      status: "pending",
      totalAmount: args.totalAmount,
      orderNumber,
      paymentId: args.paymentId,
    });

    // Create order items with validation
    for (const item of args.items) {
      if (item.quantity < 1 || item.quantity > 99) {
        throw new Error("Invalid item quantity");
      }
      if (!item.name || item.name.trim().length === 0) {
        throw new Error("Item name required");
      }
      if (item.itemPrice <= 0 || item.itemPrice > 1000) {
        throw new Error("Invalid item price");
      }
      
      await ctx.db.insert("orderItems", {
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        size: item.size.trim(),
        customizations: item.customizations,
        itemPrice: item.itemPrice,
      });
    }

    return { orderId, orderNumber };
  },
});

// Square API integration using fetch (since Convex doesn't support dynamic imports)
async function processSquarePaymentAPI(params: {
  sourceId: string;
  amount: number;
  idempotencyKey: string;
  note?: string;
  referenceId?: string;
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Square access token not configured");
  }

  const url = process.env.SQUARE_ENVIRONMENT === "production" 
    ? "https://connect.squareup.com/v2/payments"
    : "https://connect.squareupsandbox.com/v2/payments";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-18"
      },
      body: JSON.stringify({
        source_id: params.sourceId,
        amount_money: {
          amount: params.amount,
          currency: "AUD"
        },
        idempotency_key: params.idempotencyKey,
        ...(params.note && { note: params.note }),
        ...(params.referenceId && { reference_id: params.referenceId }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square API error:', data);
      return {
        success: false,
        error: data.errors?.[0]?.detail || `Payment processing failed (${response.status})`
      };
    }

    return {
      success: true,
      paymentId: data.payment?.id || 'unknown'
    };
  } catch (error: any) {
    console.error('Square payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error during payment processing"
    };
  }
}