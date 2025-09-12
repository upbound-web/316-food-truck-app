import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

export function StaffView() {
  const [statusFilter, setStatusFilter] = useState<string>("active");
  
  const allOrders = useQuery(
    statusFilter === "active" 
      ? api.orders.getActiveStaffOrders 
      : api.orders.getStaffOrders, 
    statusFilter === "active" 
      ? { limit: 50 }
      : { status: statusFilter === "all" ? undefined : statusFilter, limit: 50 }
  );
  
  const markOrderPreparing = useMutation(api.orders.markOrderPreparing);
  const markOrderReady = useMutation(api.orders.markOrderReady);

  const handleStatusUpdate = async (orderId: Id<"orders">, newStatus: string, orderNumber: number) => {
    try {
      if (newStatus === "preparing") {
        await markOrderPreparing({ orderId });
        toast.success(`Order #${orderNumber} marked as preparing`);
      } else if (newStatus === "ready") {
        await markOrderReady({ orderId });
        toast.success(`Order #${orderNumber} is ready for pickup!`);
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const formatTimeSince = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!allOrders) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Staff Dashboard</h2>
        <div className="text-sm text-gray-600">
          {allOrders.length} orders
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-4 py-2 rounded-full transition-colors ${
            statusFilter === "active"
              ? "bg-secondary text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          🔥 Active Orders
        </button>
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-full transition-colors ${
            statusFilter === "all"
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 rounded-full transition-colors ${
            statusFilter === "pending"
              ? "bg-yellow-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("preparing")}
          className={`px-4 py-2 rounded-full transition-colors ${
            statusFilter === "preparing"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Preparing
        </button>
        <button
          onClick={() => setStatusFilter("ready")}
          className={`px-4 py-2 rounded-full transition-colors ${
            statusFilter === "ready"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Ready
        </button>
      </div>

      {/* Orders Grid */}
      {allOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No orders found</p>
          <p className="text-gray-400">
            {statusFilter === "active" ? "No orders need attention right now" :
             statusFilter === "all" ? "No orders yet today" : `No ${statusFilter} orders`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md border overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Order #{order.orderNumber}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeSince(order.timeSinceOrder)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-4 py-3">
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.quantity}x {item.menuItem?.name}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Size: {item.size}
                          {item.customizations.length > 0 && (
                            <span className="block">+ {item.customizations.join(", ")}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-gray-700 font-medium ml-2">
                        AUD ${(item.itemPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span className="text-primary">AUD ${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 bg-gray-50 border-t">
                {order.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, "preparing", order.orderNumber)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Preparing
                  </button>
                )}
                
                {order.status === "preparing" && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, "ready", order.orderNumber)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Mark Ready
                  </button>
                )}
                
                {order.status === "ready" && (
                  <div className="text-center">
                    <p className="text-green-700 font-medium text-sm">✅ Ready for Pickup</p>
                    <p className="text-xs text-gray-600 mt-1">Waiting for customer...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}