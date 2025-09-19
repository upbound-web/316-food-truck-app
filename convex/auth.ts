import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { query } from "./_generated/server";
import { alphabet, generateRandomString } from "oslo/crypto";

// Custom Resend password reset provider
const ResendPasswordReset = Email({
  id: "resend-password-reset",
  apiKey: process.env.RESEND_API_KEY,
  
  async generateVerificationToken() {
    return generateRandomString(8, alphabet("0-9", "A-Z"));
  },
  
  async sendVerificationRequest({ identifier: email, provider, token }) {
    // Debug environment variables
    console.log(`🐛 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`🐛 RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
    console.log(`🐛 RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`);
    
    const isDevelopment = process.env.NODE_ENV !== "production";
    console.log(`🐛 isDevelopment: ${isDevelopment}`);
    
    // TEMPORARY: Force email sending for testing (bypass NODE_ENV check)
    console.log(`🚀 FORCING PRODUCTION EMAIL SEND FOR TESTING...`);
    
    // Always log to console for debugging
    console.log(`🔐 Password Reset Code for ${email}: ${token}`);
    console.log(`🔗 Use this code to reset your password`);

    // Now also try to send actual email via Resend
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "noreply@316foodtruck.com",
          to: email,
          subject: "Password Reset - 316 The Food Truck",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Password Reset Request</h2>
              <p>You requested a password reset for your 316 The Food Truck account.</p>
              <p>Your password reset code is:</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">
                ${token}
              </div>
              <p>Enter this code on the password reset page to create a new password.</p>
              <p>If you didn't request this reset, you can safely ignore this email.</p>
              <p>Best regards,<br>316 The Food Truck Team</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Resend API error response:", error);
        console.error("❌ Resend API status:", response.status);
        console.error("❌ Resend API headers:", response.headers);
        throw new Error(`Failed to send email: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Password reset email sent successfully to ${email}`);
      console.log(`✅ Resend response:`, result);
    } catch (error) {
      console.error("❌ FAILED to send password reset email:", error);
      console.error("❌ Error details:", error.message);
      // Don't throw error - let it continue so user still gets console code
      console.log("⚠️ Email sending failed, but console code above can still be used");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({ 
      reset: ResendPasswordReset,
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
          phone: params.phone as string,
        };
      },
    })
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
