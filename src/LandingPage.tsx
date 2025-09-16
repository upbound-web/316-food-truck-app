import { useState } from "react";
import { SignInForm } from "./SignInForm";

export function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  if (showSignIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <button
              onClick={() => setShowSignIn(false)}
              className="text-primary hover:text-primary-hover font-medium mb-4 flex items-center gap-2 mx-auto"
            >
              ← Back to Home
            </button>
          </div>
          <SignInForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full translate-y-32 -translate-x-32"></div>
        
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Coffee Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-8 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
              </svg>
            </div>

            {/* Main Headlines */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Order From{" "}
              <span className="text-primary">316 The Food Truck</span>{" "}
              Online
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Skip the line and order your favorite coffee and food ahead of time. 
              Perfect for busy lifestyles - order anywhere, anytime!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => setShowSignIn(true)}
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                Start Ordering Now
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg"
              >
                Learn More
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Skip the queue
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Order on the go
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secure payments
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Order Online?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the convenience of digital ordering with our easy-to-use platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save Time</h3>
              <p className="text-gray-600 leading-relaxed">
                Order ahead and skip the line. Your food will be ready when you arrive, 
                saving you valuable time during busy periods.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Order On The Go</h3>
              <p className="text-gray-600 leading-relaxed">
                Use any device to place your order - phone, tablet, or computer. 
                Perfect for busy schedules when you're out and about.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customize Orders</h3>
              <p className="text-gray-600 leading-relaxed">
                Personalize your coffee with milk alternatives, syrups, and other options. 
                Get exactly what you want, every time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Preview */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fresh Coffee & Food Daily
            </h2>
            <p className="text-xl text-gray-600">
              Quality ingredients, expertly crafted
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Menu Item 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">Specialty Lattes</h3>
                <p className="text-gray-600 text-sm">From $5.00</p>
              </div>
            </div>

            {/* Menu Item 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-brown-200 to-orange-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5,4V7H7.5L9,10H15L16.5,7H19V4H5M3,8L5,14H19L21,8H3Z" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">Fresh Food</h3>
                <p className="text-gray-600 text-sm">From $8.50</p>
              </div>
            </div>

            {/* Menu Item 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">Iced Drinks</h3>
                <p className="text-gray-600 text-sm">From $5.00</p>
              </div>
            </div>

            {/* Menu Item 4 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">Specialty Teas</h3>
                <p className="text-gray-600 text-sm">From $5.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers who love the convenience of online ordering. 
            Create your account today and place your first order!
          </p>
          <button
            onClick={() => setShowSignIn(true)}
            className="bg-white text-primary hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
          >
            Create Your Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
            </svg>
            <span className="text-xl font-semibold">316 The Food Truck</span>
          </div>
          <p className="text-gray-400">
            Quality coffee and food, served with convenience
          </p>
        </div>
      </footer>
    </div>
  );
}