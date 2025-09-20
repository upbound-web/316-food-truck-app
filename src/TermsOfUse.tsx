interface TermsOfUseProps {
  onClose: () => void;
}

export function TermsOfUse({ onClose }: TermsOfUseProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Terms of Use</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Terms of Use for 316 the Food Truck</h1>
            <p className="text-gray-600">Last Updated: 21/09/2025</p>
          </div>

          <div className="space-y-4">
            <p>
              Welcome to the 316 the Food Truck mobile application (the "App"). This App is owned and operated by 316 the Food Truck (ABN [Your ABN]) ("we", "us", "our").
            </p>

            <p>
              By creating an account, placing an order, or otherwise using our App, you ("you", "the user") agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, you must not use the App.
            </p>

            <div>
              <h3 className="text-lg font-semibold mb-2">1. The Service</h3>
              <p className="mb-2">Our App provides a platform for you to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Browse our menu of food and beverages.</li>
                <li>Place orders for collection from our food truck.</li>
                <li>Pay for your orders securely through our third-party payment processor, Square.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">2. Accounts</h3>
              <p className="mb-2">To place an order, you may be required to create an account. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Providing accurate and current information.</li>
                <li>Maintaining the confidentiality of your account password.</li>
                <li>All activities that occur under your account.</li>
              </ul>
              <p className="mt-2">You must notify us immediately if you suspect any unauthorised use of your account.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3. Orders, Payments, and Refunds</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Placing an Order:</h4>
                  <p>When you place an order through the App, you are making an offer to purchase the selected products at the price listed. We reserve the right to accept or reject any order for any reason, such as the unavailability of an item.</p>
                </div>
                <div>
                  <h4 className="font-medium">Pricing:</h4>
                  <p>All prices are listed in Australian Dollars (AUD) and are inclusive of GST. We reserve the right to change prices at any time without notice.</p>
                </div>
                <div>
                  <h4 className="font-medium">Payment:</h4>
                  <p>We use Square, a third-party service, to process all payments. By providing your payment information, you agree to the terms and conditions of Square. We do not collect or store your full credit card information on our servers.</p>
                </div>
                <div>
                  <h4 className="font-medium">Refunds:</h4>
                  <p>We are committed to providing quality products. If you are not satisfied with your order, please contact us directly at the food truck or via enterprises@dundaloo.org.au. Refunds and remedies will be provided in accordance with our obligations under the Australian Consumer Law.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">4. Acceptable Use</h3>
              <p className="mb-2">You agree not to use the App for any unlawful purpose or in any way that could damage, disable, or impair the App. This includes, but is not limited to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Placing fraudulent orders.</li>
                <li>Attempting to interfere with the App's security or network.</li>
                <li>Using the App to harass or abuse any person.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">5. Intellectual Property</h3>
              <p>All content in the App, including the "316 the food truck" name, logos, text, graphics, and software, is our exclusive property and is protected by copyright and trademark laws. You are granted a limited, non-transferable license to use the App for the sole purpose of placing orders with us.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">6. Third-Party Services (Square)</h3>
              <p>Our App relies on Square for payment processing. We are not responsible for the performance, availability, or security of Square's services. Any issues related directly to payment processing should be handled in accordance with Square's user agreement.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">7. Limitation of Liability & Disclaimer</h3>
              <div className="space-y-2">
                <p>The App is provided "as is" and "as available". While we strive to ensure the App is always operational and accurate, we do not guarantee it will be error-free, uninterrupted, or completely secure.</p>
                <p>To the fullest extent permitted by law, we exclude all liability for any loss or damage (including indirect or consequential loss) arising from your use of, or inability to use, the App.</p>
                <p className="font-medium">Note on Australian Consumer Law:</p>
                <p>Nothing in these Terms excludes, restricts or modifies any guarantee, warranty, term or condition, right or remedy implied or imposed by any legislation which cannot be lawfully excluded or limited, including the Australian Consumer Law.</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">8. Termination</h3>
              <p>We reserve the right to suspend or terminate your account and access to the App at our discretion, without notice, if you breach these Terms.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">9. Governing Law</h3>
              <p>These Terms are governed by the laws of New South Wales, Australia. You agree to submit to the exclusive jurisdiction of the courts of that jurisdiction.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">10. Contact Us</h3>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <div className="mt-2 pl-4">
                <p>Email: enterprises@dundaloo.org.au</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}