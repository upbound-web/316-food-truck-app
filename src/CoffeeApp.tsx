import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { SimpleSquarePayment } from "./SimpleSquarePayment";
import { StaffView } from "./StaffView";
import { AdminPanel } from "./AdminPanel";
import { InstallPrompt } from "./InstallPrompt";
import { InstallInstructions } from "./InstallInstructions";
import { NotificationPermissionPrompt, useNotificationService } from "./NotificationService";
import { useOrderNotifications } from "./useOrderNotifications";
import { NotificationDebug } from "./NotificationDebug";

interface CartItem {
  menuItemId: Id<"menuItems">;
  name: string;
  quantity: number;
  size: string;
  customizations: string[];
  itemPrice: number;
}

export function CoffeeApp() {
  const [activeTab, setActiveTab] = useState<"menu" | "cart" | "orders" | "staff" | "admin">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastOrder, setLastOrder] = useState<CartItem[] | null>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [showNotificationDebug, setShowNotificationDebug] = useState(false);
  const [showAddedToCartPopup, setShowAddedToCartPopup] = useState(false);
  const [addedItem, setAddedItem] = useState<{name: string, size: string} | null>(null);
  const [customizeIndex, setCustomizeIndex] = useState<number | null>(null);
  const [customizeSize, setCustomizeSize] = useState<string>("");
  const [customizeCustomizations, setCustomizeCustomizations] = useState<string[]>([]);

  const allMenuItems = useQuery(api.menu.getMenuItems, 
    selectedCategory === "all" ? {} : { category: selectedCategory }
  );
  const categories = useQuery(api.menu.getCategories);

  // Filter menu items based on search query
  const menuItems = allMenuItems?.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }) || [];
  const userOrders = useQuery(api.orders.getUserOrders);
  const isStaff = useQuery(api.staff.isCurrentUserStaff);
  const userRoles = useQuery(api.staff.getCurrentUserRoles);
  const anyAdminsExist = useQuery(api.staff.anyAdminsExist);
  const processSquarePayment = useAction(api.payments.processSquarePayment);
  const seedMenu = useMutation(api.menu.seedMenu);
  const refreshMenu = useMutation(api.menu.refreshMenu);
  const loadRealMenu = useMutation(api.menu.loadRealMenu);

  // Initialize order notifications
  useOrderNotifications();
  
  // Get notification service for testing
  const { sendTestNotification, permission } = useNotificationService();

  // Listen for notification-triggered navigation
  useEffect(() => {
    const handleSwitchToOrders = () => {
      setActiveTab('orders');
    };

    window.addEventListener('switchToOrders', handleSwitchToOrders);
    
    // Check URL params on load (for notification clicks)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'orders') {
      setActiveTab('orders');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    return () => window.removeEventListener('switchToOrders', handleSwitchToOrders);
  }, []);

  // Load last order from localStorage on component mount
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('coffeeApp_lastOrder');
      const savedCustomerName = localStorage.getItem('coffeeApp_customerName');
      
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setLastOrder(parsedOrder);
      }
      
      if (savedCustomerName) {
        setCustomerName(savedCustomerName);
      }
    } catch (error) {
      console.error('Error loading saved order:', error);
    }
  }, []);

  // Save customer name to localStorage when it changes
  useEffect(() => {
    if (customerName.trim()) {
      localStorage.setItem('coffeeApp_customerName', customerName);
    }
  }, [customerName]);

  // Seed menu if empty
  const handleSeedMenu = async () => {
    try {
      await seedMenu({});
      toast.success("Menu loaded!");
    } catch (error) {
      toast.error("Failed to load menu");
    }
  };

  // Refresh menu with latest items (including sugar options)
  const handleRefreshMenu = async () => {
    try {
      await refreshMenu({});
      toast.success("Menu refreshed with sugar options!");
    } catch (error) {
      toast.error("Failed to refresh menu");
    }
  };

  // Load real 316 Food Truck menu
  const handleLoadRealMenu = async () => {
    try {
      await loadRealMenu({});
      toast.success("316 Food Truck menu loaded!");
    } catch (error) {
      toast.error("Failed to load real menu");
    }
  };

  const addToCart = (item: any, size: string, customizations: string[]) => {
    const sizePrice = item.sizes.find((s: any) => s.name === size)?.priceModifier || 0;
    const customizationPrice = customizations.reduce((total, customization) => {
      const custom = item.customizations.find((c: any) => c.name === customization);
      return total + (custom?.price || 0);
    }, 0);
    
    const itemPrice = item.basePrice + sizePrice + customizationPrice;

    const existingItemIndex = cart.findIndex(
      cartItem => 
        cartItem.menuItemId === item._id &&
        cartItem.size === size &&
        JSON.stringify(cartItem.customizations.sort()) === JSON.stringify(customizations.sort())
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        menuItemId: item._id,
        name: item.name,
        quantity: 1,
        size,
        customizations,
        itemPrice,
      }]);
    }

    // Show micro-interaction popup instead of toast
    setAddedItem({ name: item.name, size });
    setShowAddedToCartPopup(true);
    
    // Auto-hide after 3 seconds if user doesn't interact
    setTimeout(() => {
      setShowAddedToCartPopup(false);
    }, 3000);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
  };

  const startCustomizeItem = (index: number) => {
    const item = cart[index];
    setCustomizeIndex(index);
    setCustomizeSize(item.size);
    setCustomizeCustomizations([...item.customizations]);
  };

  const cancelCustomize = () => {
    setCustomizeIndex(null);
    setCustomizeSize("");
    setCustomizeCustomizations([]);
  };

  const saveCustomization = () => {
    if (customizeIndex === null) return;
    
    const cartItem = cart[customizeIndex];
    const menuItem = menuItems?.find(item => item._id === cartItem.menuItemId);
    if (!menuItem) return;

    // Calculate new price based on updated selections
    const basePriceForSize = customizeSize === 'Large' ? menuItem.pricePerSize.large : menuItem.pricePerSize.medium;
    const customizationPrice = customizeCustomizations.reduce((total, customName) => {
      const customization = menuItem.customizations.find((c: any) => c.name === customName);
      return total + (customization?.price || 0);
    }, 0);
    const newPrice = basePriceForSize + customizationPrice;

    // Update cart item
    const newCart = [...cart];
    newCart[customizeIndex] = {
      ...cartItem,
      size: customizeSize,
      customizations: [...customizeCustomizations],
      itemPrice: newPrice
    };
    setCart(newCart);
    
    // Close customize modal
    cancelCustomize();
    toast.success("Item updated!");
  };

  const toggleCustomizeCustomization = (customizationName: string) => {
    setCustomizeCustomizations(prev => 
      prev.includes(customizationName)
        ? prev.filter(name => name !== customizationName)
        : [...prev, customizationName]
    );
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setShowCheckout(true);
  };

  const handlePaymentSuccess = async (paymentToken: string) => {
    try {
      // SECURITY: Send only essential data, prices calculated server-side
      const result = await processSquarePayment({
        sourceId: paymentToken,
        customerName: customerName.trim(),
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          size: item.size,
          customizations: item.customizations,
          // Removed: itemPrice and amount - calculated server-side for security
        })),
      });

      if (result.success) {
        // Save this successful order to localStorage for quick reorder
        try {
          localStorage.setItem('coffeeApp_lastOrder', JSON.stringify(cart));
          setLastOrder([...cart]);
        } catch (error) {
          console.error('Error saving order to localStorage:', error);
        }

        toast.success(`Order #${result.orderNumber} placed successfully!`);
        setCart([]);
        setShowCheckout(false);
        setActiveTab("orders");
      } else {
        toast.error("Payment processing failed");
      }
    } catch (error) {
      toast.error("Payment processing failed. Please try again.");
      console.error("Payment error:", error);
    }
  };

  // Quick reorder function
  const handleReorder = () => {
    if (lastOrder && lastOrder.length > 0) {
      setCart([...lastOrder]);
      setActiveTab("cart");
      toast.success("Last order added to cart!");
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
  };

  if (allMenuItems === undefined || categories === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-secondary mb-4">Loading menu...</p>
      </div>
    );
  }

  if (allMenuItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Welcome to 316 The Food Truck!</h2>
        <p className="text-secondary mb-6">Get started by loading our menu</p>
        <div className="flex gap-4">
          <button
            onClick={handleLoadRealMenu}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold"
          >
            Load 316 Food Truck Menu
          </button>
          <button
            onClick={handleSeedMenu}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Load Sample Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto p-3 sm:p-4">
        {/* Navigation */}
        <div className="w-full">
          <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("menu")}
          className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === "menu"
              ? "border-primary text-primary"
              : "border-transparent text-accent hover:text-primary"
          }`}
        >
          Menu
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === "cart"
              ? "border-primary text-primary"
              : "border-transparent text-accent hover:text-primary"
          }`}
        >
          Cart ({cart.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-accent hover:text-primary"
          }`}
        >
          My Orders
        </button>
        {isStaff && (
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "staff"
                ? "border-secondary text-secondary"
                : "border-transparent text-accent hover:text-secondary"
            }`}
          >
            🏪 Staff
          </button>
        )}
        {(userRoles?.some(role => role.role === "admin") || (anyAdminsExist !== undefined && anyAdminsExist === false)) && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "admin"
                ? "border-primary text-primary"
                : "border-transparent text-accent hover:text-primary"
            }`}
          >
            ⚙️ Admin
          </button>
        )}
          </div>
        </div>

      {/* Menu Tab */}
      {activeTab === "menu" && (
        <div className="w-full min-w-0">
          {/* Search Bar & Quick Reorder */}
          <div className="mb-4 sm:mb-6 space-y-3">
            {/* Search Bar */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Quick Reorder Button */}
            {lastOrder && lastOrder.length > 0 && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0 bg-gradient-to-r from-secondary/10 to-secondary/20 border border-secondary/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-secondary">Previous Order</span>
                    <span className="text-xs text-secondary/80">{lastOrder.length} item{lastOrder.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {lastOrder.map(item => `${item.quantity}x ${item.name} (${item.size})`).join(', ')}
                  </div>
                  <button
                    onClick={handleReorder}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reorder Last Order</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('coffeeApp_lastOrder');
                    setLastOrder(null);
                    toast.success("Last order cleared");
                  }}
                  className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors border border-gray-300 rounded-lg flex-shrink-0"
                  title="Clear saved order"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start mb-4 sm:mb-6">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 sm:px-4 py-2 rounded-full transition-colors text-sm sm:text-base ${
                selectedCategory === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 py-2 rounded-full transition-colors capitalize text-sm sm:text-base ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-4 text-sm text-gray-600">
              {menuItems.length > 0 
                ? `Found ${menuItems.length} item${menuItems.length === 1 ? '' : 's'} for "${searchQuery}"`
                : `No items found for "${searchQuery}"`
              }
            </div>
          )}

          {/* Menu Items */}
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No menu items match "${searchQuery}"`
                  : "No items in this category"
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {menuItems.map((item) => (
                <MenuItemCard key={item._id} item={item} onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart Tab */}
      {activeTab === "cart" && (
        <div className="max-w-2xl mx-auto w-full min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Cart</h2>
          
          {showCheckout ? (
            <SimpleSquarePayment
              amount={getTotalPrice()}
              customerName={customerName}
              cart={cart}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handleCancelCheckout}
            />
          ) : (
          <>
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary mb-4">Your cart is empty</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-secondary mb-2">
                      Size: {item.size}
                      {item.customizations.length > 0 && (
                        <span> • {item.customizations.join(", ")}</span>
                      )}
                    </p>
                    <div className="flex justify-between items-center mb-3">
                      <button
                        onClick={() => {
                          console.log('Customize button clicked for item:', index, item.name);
                          startCustomizeItem(index);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Customise
                      </button>
                      <span className="font-semibold">
                        AUD ${(item.itemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        ${item.itemPrice.toFixed(2)} each
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Form */}
              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Name for Order
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    AUD ${getTotalPrice().toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold"
                >
                  Place Order
                </button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="max-w-4xl mx-auto w-full min-w-0">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">My Orders</h2>
            <div className="flex gap-2 flex-wrap">
              {permission === 'granted' && (
                <>
                  <button
                    onClick={() => {
                      console.log('🔔 Testing notification...');
                      sendTestNotification();
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    🔔 Test Notification
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔔 Current orders state:', userOrders?.map(o => ({
                        id: o._id,
                        number: o.orderNumber,
                        status: o.status,
                        customer: o.customerName
                      })));
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    📊 Debug Orders
                  </button>
                </>
              )}
              <button
                onClick={() => setShowNotificationDebug(true)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
              >
                🔍 Debug Notifications
              </button>
            </div>
          </div>
          
          {!userOrders || userOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary mb-4">No orders yet</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
              >
                Start Ordering
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map((order) => (
                <div key={order._id} className="bg-white p-4 sm:p-6 rounded-lg shadow border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-secondary">
                        {new Date(order._creationTime).toLocaleString()}
                      </p>
                      <p className="text-sm">Customer: {order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        order.status === "preparing" ? "bg-blue-100 text-blue-800" :
                        order.status === "ready" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-lg font-bold mt-2">AUD ${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menuItem?.name} ({item.size})
                          {item.customizations.length > 0 && (
                            <span className="text-secondary"> • {item.customizations.join(", ")}</span>
                          )}
                        </span>
                        <span>AUD ${(item.itemPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff View Tab */}
      {activeTab === "staff" && isStaff && (
        <StaffView />
      )}
      
      {activeTab === "staff" && !isStaff && (
        <div className="text-center py-12">
          <p className="text-xl text-red-500 mb-4">Access Denied</p>
          <p className="text-gray-600">You need staff privileges to access this view.</p>
        </div>
      )}

      {/* Admin Panel Tab */}
      {activeTab === "admin" && (userRoles?.some(role => role.role === "admin") || (anyAdminsExist !== undefined && anyAdminsExist === false)) && (
        <AdminPanel />
      )}
      
      {activeTab === "admin" && anyAdminsExist === true && !userRoles?.some(role => role.role === "admin") && (
        <div className="text-center py-12">
          <p className="text-xl text-red-500 mb-4">Access Denied</p>
          <p className="text-gray-600">You need administrator privileges to access this view.</p>
        </div>
      )}
      </div>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
      
      {/* Install Instructions Modal */}
      {showInstallInstructions && (
        <InstallInstructions onClose={() => setShowInstallInstructions(false)} />
      )}
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt 
        onPermissionGranted={() => {
          console.log('Notification permission granted!');
        }}
      />
      
      {/* Notification Debug Modal */}
      {showNotificationDebug && (
        <NotificationDebug onClose={() => setShowNotificationDebug(false)} />
      )}
      
      {/* Added to Cart Popup */}
      {showAddedToCartPopup && addedItem && (
        <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Added to Cart!</span>
              </div>
              <button
                onClick={() => setShowAddedToCartPopup(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-white/90 mb-3">
              {addedItem.name} ({addedItem.size})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab("cart");
                  setShowAddedToCartPopup(false);
                }}
                className="flex-1 bg-white text-green-600 font-medium py-2 px-3 rounded-md hover:bg-gray-100 transition-colors text-sm"
              >
                Go to Cart ({cart.length})
              </button>
              <button
                onClick={() => setShowAddedToCartPopup(false)}
                className="px-3 py-2 text-white/80 hover:text-white transition-colors text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Item Modal */}
      {customizeIndex !== null && customizeIndex < cart.length && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Customise {cart[customizeIndex].name}
              </h2>
              <button
                onClick={cancelCustomize}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {(() => {
              const cartItem = cart[customizeIndex];
              const menuItem = menuItems?.find(item => item._id === cartItem.menuItemId);
              if (!menuItem) return null;

              const milkOptions = menuItem.customizations.filter((c: any) => 
                c.name.includes("Milk") || c.name.includes("Oat") || c.name.includes("Almond") || c.name.includes("Soy")
              );
              const syrupOptions = menuItem.customizations.filter((c: any) => 
                c.name.includes("Syrup") || c.name.includes("Vanilla") || c.name.includes("Caramel")
              );

              return (
                <div className="space-y-6">
                  {/* Size Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">☕ Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Medium", "Large"].map((size) => (
                        <label key={size} className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:border-primary/50 transition-all bg-white/70">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="customize-size"
                              value={size}
                              checked={customizeSize === size}
                              onChange={(e) => setCustomizeSize(e.target.value)}
                              className="w-4 h-4 text-primary focus:ring-primary"
                            />
                            <span className="font-medium">{size}</span>
                          </div>
                          <span className="text-accent font-bold">
                            ${size === 'Large' ? menuItem.pricePerSize.large.toFixed(2) : menuItem.pricePerSize.medium.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Milk Options */}
                  {milkOptions.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">🥛 Milk Options</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {milkOptions.map((milk: any) => (
                          <label key={milk.name} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg border border-gray-200 hover:border-primary/30 transition-all bg-white/50">
                            <input
                              type="checkbox"
                              checked={customizeCustomizations.includes(milk.name)}
                              onChange={() => toggleCustomizeCustomization(milk.name)}
                              className="w-4 h-4 rounded text-accent focus:ring-accent focus:ring-2"
                            />
                            <span className="flex-1 font-medium">
                              {milk.name}
                              {milk.price > 0 && (
                                <span className="text-accent font-bold ml-2 text-xs">
                                  +${milk.price.toFixed(2)}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Syrup Options */}
                  {syrupOptions.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">🍯 Syrup Options</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {syrupOptions.map((syrup: any) => (
                          <label key={syrup.name} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg border border-gray-200 hover:border-primary/30 transition-all bg-white/50">
                            <input
                              type="checkbox"
                              checked={customizeCustomizations.includes(syrup.name)}
                              onChange={() => toggleCustomizeCustomization(syrup.name)}
                              className="w-4 h-4 rounded text-accent focus:ring-accent focus:ring-2"
                            />
                            <span className="flex-1 font-medium">
                              {syrup.name}
                              {syrup.price > 0 && (
                                <span className="text-accent font-bold ml-2 text-xs">
                                  +${syrup.price.toFixed(2)}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={cancelCustomize}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCustomization}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, onAddToCart }: { item: any; onAddToCart: (item: any, size: string, customizations: string[]) => void }) {
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]?.name || "");
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSugar, setSelectedSugar] = useState<string>("No Sugar");

  const calculatePrice = () => {
    const sizePrice = item.sizes.find((s: any) => s.name === selectedSize)?.priceModifier || 0;
    
    // Include sugar selection in customizations for price calculation
    const allCustomizations = [...selectedCustomizations];
    if (selectedSugar && selectedSugar !== "No Sugar") {
      allCustomizations.push(selectedSugar);
    }
    
    const customizationPrice = allCustomizations.reduce((total, customization) => {
      const custom = item.customizations.find((c: any) => c.name === customization);
      return total + (custom?.price || 0);
    }, 0);
    
    return item.basePrice + sizePrice + customizationPrice;
  };

  const toggleCustomization = (customization: string) => {
    // Skip sugar options - they're handled separately
    if (customization.includes("Sugar")) return;
    
    setSelectedCustomizations(prev =>
      prev.includes(customization)
        ? prev.filter(c => c !== customization)
        : [...prev, customization]
    );
  };

  // Organize customizations by category
  const sugarOptions = item.customizations.filter((c: any) => c.name.includes("Sugar"));
  const milkOptions = item.customizations.filter((c: any) => 
    c.name.includes("Milk") || c.name.includes("Oat") || c.name.includes("Almond") || c.name.includes("Soy")
  );
  const syrupOptions = item.customizations.filter((c: any) => 
    c.name.includes("Syrup") || c.name.includes("Vanilla") || c.name.includes("Caramel")
  );
  const extraOptions = item.customizations.filter((c: any) => 
    c.name.includes("Shot") || c.name.includes("Decaf") || c.name.includes("Whipped") || 
    c.name.includes("Chocolate") || c.name.includes("Cinnamon") || c.name.includes("Honey") ||
    c.name.includes("Lemon") || c.name.includes("Butter") || c.name.includes("Jam") || 
    c.name.includes("Heated") || c.name.includes("Warmed")
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 w-full min-w-0">
      {/* Enhanced Card Layout */}
      <div className="p-4 sm:p-6">
        {/* Product Image */}
        <div className="mb-4 sm:mb-5">
          <div className="w-full h-48 sm:h-56 rounded-lg overflow-hidden bg-gray-100 mb-4">
            <img
              src={item.image ? `/${item.image}` : '/latte.png'}
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = '/latte.png';
              }}
            />
          </div>
        </div>

        {/* Product Header - Improved Layout */}
        <div className="mb-4 sm:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight">{item.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                {item.description}
              </p>
            </div>
            <div className="flex-shrink-0 text-center sm:text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</div>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                ${item.basePrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">AUD</div>
            </div>
          </div>
        </div>

        {/* Quick Order Section - Enhanced Design */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Quick Order</h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-medium px-3 py-1 rounded-full hover:bg-primary/10 transition-all"
            >
              <span>Customize</span>
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Enhanced Size Buttons */}
          <div className={`grid gap-2 sm:gap-3 w-full ${item.sizes.length === 2 ? 'grid-cols-2' : item.sizes.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {item.sizes.map((size: any) => {
              const sizePrice = item.basePrice + (size.priceModifier || 0);
              return (
                <button
                  key={size.name}
                  onClick={() => {
                    // Quick order: use current customizations including sugar selection
                    const allCustomizations = [...selectedCustomizations];
                    if (selectedSugar && selectedSugar !== "No Sugar") {
                      allCustomizations.push(selectedSugar);
                    }
                    onAddToCart(item, size.name, allCustomizations);
                    
                    // Reset customizations after adding to cart
                    setSelectedCustomizations([]);
                    setSelectedSugar("No Sugar");
                  }}
                  className="group bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg py-3 sm:py-4 px-2 sm:px-3 text-center hover:from-primary-hover hover:to-primary transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md min-w-0 w-full"
                >
                  <div className="font-bold text-xs sm:text-sm mb-1">{size.name}</div>
                  <div className="text-base sm:text-lg font-bold">
                    ${sizePrice.toFixed(2)}
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    Add to Cart
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Expandable Customization Section */}
      {isExpanded && (
        <div className="border-t bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-6">
          <div className="space-y-6">
            {/* Size Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Size</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {item.sizes.map((size: any) => (
                  <button
                    key={size.name}
                    onClick={() => setSelectedSize(size.name)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      selectedSize === size.name
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-bold">{size.name}</div>
                    {size.priceModifier > 0 && (
                      <div className="text-xs mt-1">+${size.priceModifier.toFixed(2)}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Selection */}
            {sugarOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">🍯 Sugar Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sugarOptions.map((sugar: any) => (
                    <button
                      key={sugar.name}
                      onClick={() => setSelectedSugar(sugar.name)}
                      className={`px-3 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedSugar === sugar.name
                          ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/25"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {sugar.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Milk Options */}
            {milkOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">🥛 Milk Options</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {milkOptions.map((milk: any) => (
                    <label key={milk.name} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg border border-gray-200 hover:border-primary/30 transition-all bg-white/50">
                      <input
                        type="checkbox"
                        checked={selectedCustomizations.includes(milk.name)}
                        onChange={() => toggleCustomization(milk.name)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-2"
                      />
                      <span className="flex-1 font-medium">
                        {milk.name}
                        {milk.price > 0 && (
                          <span className="text-primary font-bold ml-2 text-xs">
                            +${milk.price.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Syrup & Flavors */}
            {syrupOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">🍯 Syrups & Flavors</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {syrupOptions.map((syrup: any) => (
                    <label key={syrup.name} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg border border-gray-200 hover:border-secondary/30 transition-all bg-white/50">
                      <input
                        type="checkbox"
                        checked={selectedCustomizations.includes(syrup.name)}
                        onChange={() => toggleCustomization(syrup.name)}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary focus:ring-2"
                      />
                      <span className="flex-1 font-medium">
                        {syrup.name}
                        {syrup.price > 0 && (
                          <span className="text-secondary font-bold ml-2 text-xs">
                            +${syrup.price.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Options */}
            {extraOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">✨ Extra Options</label>
                <div className="grid grid-cols-1 gap-3">
                  {extraOptions.map((extra: any) => (
                    <label key={extra.name} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg border border-gray-200 hover:border-accent/30 transition-all bg-white/50">
                      <input
                        type="checkbox"
                        checked={selectedCustomizations.includes(extra.name)}
                        onChange={() => toggleCustomization(extra.name)}
                        className="w-4 h-4 rounded text-accent focus:ring-accent focus:ring-2"
                      />
                      <span className="flex-1 font-medium">
                        {extra.name}
                        {extra.price > 0 && (
                          <span className="text-accent font-bold ml-2 text-xs">
                            +${extra.price.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Custom Add to Cart Button */}
            <div className="pt-6 border-t border-gray-300">
              <button
                onClick={() => {
                  const allCustomizations = [...selectedCustomizations];
                  if (selectedSugar && selectedSugar !== "No Sugar") {
                    allCustomizations.push(selectedSugar);
                  }
                  onAddToCart(item, selectedSize, allCustomizations);
                  
                  // Reset customizations after adding to cart
                  setSelectedCustomizations([]);
                  setSelectedSugar("No Sugar");
                  setIsExpanded(false); // Collapse after adding
                }}
                className="w-full bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl py-4 px-6 font-bold text-lg hover:from-primary-hover hover:to-primary transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Add Custom {item.name}</span>
                  <span className="bg-white/20 rounded-full px-3 py-1 text-sm">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
