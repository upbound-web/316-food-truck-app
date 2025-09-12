import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SimpleSquarePaymentProps {
  amount: number;
  customerName: string;
  cart: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    size: string;
    customizations: string[];
    itemPrice: number;
  }>;
  onPaymentSuccess: (paymentToken: string) => Promise<void>;
  onCancel: () => void;
}

export function SimpleSquarePayment({ 
  amount, 
  customerName, 
  onPaymentSuccess, 
  onCancel 
}: SimpleSquarePaymentProps) {
  const [squareComponents, setSquareComponents] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

  useEffect(() => {
    // Try to load Square components
    const loadSquareComponents = async () => {
      try {
        const squareModule = await import("react-square-web-payments-sdk");
        setSquareComponents(squareModule);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Square components:", err);
        setError("Square payment components failed to load");
        setIsLoading(false);
      }
    };

    loadSquareComponents();
  }, []);

  const handleCardTokenizeResponse = async (token: any, verifiedBuyer: any) => {
    setIsProcessing(true);
    try {
      console.log('Payment token received:', token);
      console.log('Verified buyer:', verifiedBuyer);
      
      await onPaymentSuccess(token.token);
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errors: any) => {
    console.error("Square payment error:", errors);
    toast.error("Payment error occurred. Please check your payment details and try again.");
  };

  if (!applicationId || !locationId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-red-800 mb-4">
          Square payment configuration is missing. Please configure your Square application ID and location ID.
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border max-w-md mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error || !squareComponents) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-red-800 mb-4">
          {error || "Square payment components are not available. Please refresh the page and try again."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { PaymentForm, CreditCard, ApplePay, GooglePay } = squareComponents;

  return (
    <div className="bg-white p-6 rounded-lg shadow border max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
        <p className="text-sm text-gray-600 mb-2">Customer: {customerName}</p>
        <p className="text-lg font-bold text-primary">Total: AUD ${amount.toFixed(2)}</p>
      </div>

      <PaymentForm
        applicationId={applicationId}
        locationId={locationId}
        cardTokenizeResponseReceived={handleCardTokenizeResponse}
        createPaymentRequest={() => ({
          countryCode: "AU",
          currencyCode: "AUD",
          total: {
            amount: amount.toFixed(2),
            label: "Coffee Order",
          },
        })}
      >
        <div className="space-y-4">
          {/* Digital Wallets */}
          <div className="space-y-2">
            <ApplePay />
            <GooglePay />
          </div>
          
          {/* Credit Card */}
          <div>
            <CreditCard
              buttonProps={{
                css: {
                  backgroundColor: "#059669",
                  fontSize: "14px",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#047857",
                  },
                },
              }}
            />
          </div>
        </div>
      </PaymentForm>

      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Processing payment...</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}