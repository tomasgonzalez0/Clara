import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedEmail = process.env.ALLOWED_EMAIL?.trim().toLowerCase();

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ user }) {
      // This is a single-user app: Google identity must also match the explicit allowlist.
      return Boolean(user.email && allowedEmail && user.email.toLowerCase() === allowedEmail);
    },
  },
};
