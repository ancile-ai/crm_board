import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const ALLOWED_DOMAIN = "ancile.io";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      checks: ["pkce", "state"],
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if email ends with @ancile.io
      if (!user.email || !user.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.log(`Access denied for email: ${user.email}`);
        return false;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If there's a callbackUrl, use it (as long as it's from the same domain)
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;

      // Default fallback to dashboard
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      // Check email domain (additional security)
      if (user && (!user.email || !user.email.endsWith(`@${ALLOWED_DOMAIN}`))) {
        throw new Error("Unauthorized: Invalid email domain");
      }
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New Ancile user registered: ${user.email}`);
      }
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/auth/error",
  },
};
