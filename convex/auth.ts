import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";
import Resend from "@auth/core/providers/resend";

// Simple email provider for password reset
// For development, we'll log the reset code instead of sending email
const ResendPasswordReset = Resend({
  id: "resend-password-reset",
  name: "Resend Password Reset",
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM_EMAIL || "noreply@316foodtruck.com",
  async sendVerificationRequest({ identifier: email, url, provider, theme }) {
    try {
      // Extract the code from the URL
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get("code");
      
      // In development, just log the code
      if (process.env.NODE_ENV !== "production") {
        console.log(`🔐 Password Reset Code for ${email}: ${code}`);
        console.log(`🔗 Reset URL: ${url}`);
        return;
      }

      // In production, you would send actual email here
      // For now, we'll just log it
      console.log(`Password reset requested for ${email} with code: ${code}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw error;
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({ 
      reset: ResendPasswordReset,
    }), 
    Anonymous
  ],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
