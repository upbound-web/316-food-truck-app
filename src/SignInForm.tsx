"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp" | "resetPassword">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setSubmitting(true);
    try {
      // Use Convex Auth password reset flow
      const formData = new FormData();
      formData.set("email", email);
      formData.set("flow", "reset");
      
      await signIn("password", formData);
      toast.success("If an account with that email exists, you'll receive a password reset code. Check the console logs for development.");
      setFlow("signIn");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error("Failed to send password reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {flow === "signIn" ? "Welcome Back" : flow === "signUp" ? "Create Account" : "Reset Password"}
          </h2>
          <p className="text-gray-600 mt-2">
            {flow === "signIn" 
              ? "Sign in to your 316 Food Truck account" 
              : flow === "signUp" 
              ? "Join 316 Food Truck today" 
              : "Enter your email to reset your password"
            }
          </p>
        </div>

        {/* Password Reset Form */}
        {flow === "resetPassword" ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input-field"
                placeholder="Enter your email"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="auth-button w-full"
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => setFlow("signIn")}
              className="w-full text-center text-sm text-primary hover:text-primary-hover font-medium"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          /* Sign In/Up Form */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);
              void signIn("password", formData).catch((error) => {
                let toastTitle = "";
                if (error.message.includes("Invalid password")) {
                  toastTitle = "Invalid password. Please try again.";
                } else if (error.message.includes("User not found")) {
                  toastTitle = "No account found with that email address.";
                } else if (error.message.includes("User already exists")) {
                  toastTitle = "An account with that email already exists.";
                } else {
                  toastTitle =
                    flow === "signIn"
                      ? "Could not sign in, did you mean to sign up?"
                      : "Could not sign up, did you mean to sign in?";
                }
                toast.error(toastTitle);
                setSubmitting(false);
              });
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input-field"
                placeholder="Enter your email"
                required
              />
            </div>
            
            {/* Name and Phone for Sign Up */}
            {flow === "signUp" && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input-field"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input-field"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className="auth-input-field"
                placeholder={flow === "signUp" ? "Create a password (min. 6 characters)" : "Enter your password"}
                minLength={6}
                required
              />
            </div>

            {/* Forgot password link for sign in */}
            {flow === "signIn" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setFlow("resetPassword")}
                  className="text-sm text-primary hover:text-primary-hover font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="auth-button w-full"
            >
              {submitting ? "Please wait..." : (flow === "signIn" ? "Sign In" : "Create Account")}
            </button>

            {/* Toggle between sign in and sign up */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                className="text-sm text-primary hover:text-primary-hover font-medium hover:underline"
              >
                {flow === "signIn" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
