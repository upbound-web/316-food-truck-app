import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { useStaffOrderNotifications } from "./useStaffOrderNotifications";
import { usePrinter } from "./printing/usePrinter";
import { printerService } from "./printing/printerService";

declare const __BUILD_TIME__: string;
const hasWebUSB = typeof navigator !== "undefined" && !!navigator.usb;

export function StaffView() {
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const { printerStatus, isConnected, pair, disconnect, printOrder } = usePrinter();

  // Auto-print new orders when printer is connected
  const handleNewOrders = useCallback((orders: any[]) => {
    const status = printerService.getStatus();
    console.log(`Auto-print triggered: ${orders.length} order(s), printer status: ${status}`);
    if (status !== "connected") return;
    for (const order of orders) {
      console.log(`Printing order #${order.orderNumber}...`);
      printOrder(order).then((ok) => {
        if (ok) {
          toast.success(`Receipt auto-printed for order #${order.orderNumber}`);
        } else {
          toast.error(`Failed to print receipt for order #${order.orderNumber}`);
        }
      });
    }
  }, [printOrder]);

  // Enable audio notifications + auto-printing for new orders
  useStaffOrderNotifications(handleNewOrders);
  
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

  // For "ready" and "all" filters, only show orders from the last 24 hours
  const displayOrders = allOrders && (statusFilter === "ready" || statusFilter === "all")
    ? allOrders.filter(order => Date.now() - order._creationTime < 24 * 60 * 60 * 1000)
    : allOrders;

  if (!displayOrders) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-center text-xs text-gray-400 mt-8">Build: {__BUILD_TIME__} | Location: {import.meta.env.VITE_SQUARE_LOCATION_ID}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Staff Dashboard</h2>
        <div className="flex items-center gap-4">
          {hasWebUSB && (
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-700">Printer Connected</span>
                  <button
                    onClick={disconnect}
                    className="text-xs text-gray-500 underline hover:text-gray-700"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  {printerStatus === "connecting" && (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-sm text-yellow-700">Connecting...</span>
                    </>
                  )}
                  {printerStatus === "error" && (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm text-red-700">Printer Error</span>
                    </>
                  )}
                  <button
                    onClick={pair}
                    className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                  >
                    Connect Printer
                  </button>
                </>
              )}
            </div>
          )}
          <div className="text-sm text-gray-600">
            {displayOrders.length} orders
          </div>
        </div>
      </div>

      {/* Business Hours Card */}
      <BusinessHoursCard />

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
      {displayOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No orders found</p>
          <p className="text-gray-400">
            {statusFilter === "active" ? "No orders need attention right now" :
             statusFilter === "all" ? "No orders yet today" : `No ${statusFilter} orders`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayOrders.map((order) => (
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
              <div className="px-4 py-3 bg-gray-50 border-t space-y-2">
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

                {hasWebUSB && isConnected && (
                  <button
                    onClick={() => {
                      printOrder(order as any).then((ok) => {
                        if (ok) {
                          toast.success(`Receipt printed for order #${order.orderNumber}`);
                        } else {
                          toast.error(`Failed to print receipt for order #${order.orderNumber}`);
                        }
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium border"
                  >
                    Reprint Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-gray-400 mt-8 pb-4">Build: {__BUILD_TIME__} | Location: {import.meta.env.VITE_SQUARE_LOCATION_ID}</p>
    </div>
  );
}

interface DaySchedule {
  day: number;
  label: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

function BusinessHoursCard() {
  const openStatus = useQuery(api.settings.isCurrentlyOpen);
  const businessHours = useQuery(api.settings.getBusinessHours);
  const updateWeeklySchedule = useMutation(api.settings.updateWeeklySchedule);
  const setOverride = useMutation(api.settings.setManualOverride);

  const [editOpen, setEditOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<DaySchedule[] | null>(null);

  if (!openStatus || !businessHours) return null;

  const weeklySchedule: DaySchedule[] = businessHours.weeklySchedule;

  const handleEditStart = () => {
    setEditSchedule(weeklySchedule.map((d) => ({ ...d })));
    setEditOpen(true);
  };

  const handleEditCancel = () => {
    setEditSchedule(null);
    setEditOpen(false);
  };

  const handleDayChange = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    if (!editSchedule) return;
    setEditSchedule(editSchedule.map((d) =>
      d.day === dayIndex ? { ...d, [field]: value } : d
    ));
  };

  const handleCopyToAll = (sourceDayIndex: number) => {
    if (!editSchedule) return;
    const source = editSchedule.find((d) => d.day === sourceDayIndex);
    if (!source) return;
    setEditSchedule(editSchedule.map((d) => ({
      ...d,
      isOpen: source.isOpen,
      openTime: source.openTime,
      closeTime: source.closeTime,
    })));
  };

  const handleSaveSchedule = async () => {
    if (!editSchedule) return;
    try {
      await updateWeeklySchedule({ schedule: JSON.stringify(editSchedule) });
      toast.success("Weekly schedule updated");
      setEditSchedule(null);
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update schedule");
    }
  };

  const handleOverride = async (override: "none" | "forceOpen" | "forceClosed") => {
    try {
      await setOverride({ override });
      toast.success(
        override === "none" ? "Using scheduled hours" :
        override === "forceOpen" ? "Forced open" : "Forced closed"
      );
    } catch {
      toast.error("Failed to update override");
    }
  };

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  // Group consecutive days with same hours for summary display
  const buildScheduleSummary = () => {
    // Reorder to Mon-Sun for display
    const ordered = [1, 2, 3, 4, 5, 6, 0].map((i) => weeklySchedule[i]);
    const groups: { days: string[]; text: string }[] = [];
    for (const day of ordered) {
      const text = day.isOpen
        ? `${formatTime12(day.openTime)} - ${formatTime12(day.closeTime)}`
        : "Closed";
      const last = groups[groups.length - 1];
      if (last && last.text === text) {
        last.days.push(day.label.slice(0, 3));
      } else {
        groups.push({ days: [day.label.slice(0, 3)], text });
      }
    }
    return groups.map((g) => {
      const dayRange = g.days.length > 2
        ? `${g.days[0]}-${g.days[g.days.length - 1]}`
        : g.days.join(", ");
      return { dayRange, text: g.text };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">Business Hours</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            openStatus.isOpen
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}>
            {openStatus.isOpen ? "OPEN" : "CLOSED"}
          </span>
        </div>
        <button
          onClick={() => editOpen ? handleEditCancel() : handleEditStart()}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {editOpen ? "Cancel" : "Edit Hours"}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-2">{openStatus.reason}</p>

      {/* Schedule Summary (non-edit mode) */}
      {!editOpen && (
        <div className="mb-3 space-y-0.5">
          {buildScheduleSummary().map((row) => (
            <div key={row.dayRange} className="flex gap-2 text-sm">
              <span className="text-gray-500 w-20 font-medium">{row.dayRange}</span>
              <span className={row.text === "Closed" ? "text-gray-400" : "text-gray-700"}>
                {row.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Manual Override */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={() => void handleOverride("none")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            businessHours.manualOverride === "none"
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Auto (Use Hours)
        </button>
        <button
          onClick={() => void handleOverride("forceOpen")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            businessHours.manualOverride === "forceOpen"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Force Open
        </button>
        <button
          onClick={() => void handleOverride("forceClosed")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            businessHours.manualOverride === "forceClosed"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Force Closed
        </button>
      </div>

      {/* Edit Weekly Schedule */}
      {editOpen && editSchedule && (
        <div className="border-t pt-3 mt-3">
          <div className="space-y-2">
            {/* Reorder Mon-Sun for editing */}
            {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
              const day = editSchedule[dayIdx];
              return (
                <div key={day.day} className="flex items-center gap-2 flex-wrap">
                  <span className="w-10 text-sm font-medium text-gray-700 shrink-0">
                    {day.label.slice(0, 3)}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => handleDayChange(dayIdx, "isOpen", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className={`text-xs w-12 ${day.isOpen ? "text-green-700 font-medium" : "text-gray-400"}`}>
                      {day.isOpen ? "Open" : "Closed"}
                    </span>
                  </label>
                  {day.isOpen && (
                    <>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleDayChange(dayIdx, "openTime", e.target.value)}
                        className="px-1.5 py-1 border border-gray-300 rounded text-sm w-28"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleDayChange(dayIdx, "closeTime", e.target.value)}
                        className="px-1.5 py-1 border border-gray-300 rounded text-sm w-28"
                      />
                      <button
                        onClick={() => handleCopyToAll(dayIdx)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline shrink-0"
                      >
                        copy to all
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => void handleSaveSchedule()}
              className="px-4 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleEditCancel}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}