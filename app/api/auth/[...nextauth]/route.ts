import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };
