import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { saveUser } from "@/lib/saveUser";

// Single NextAuth instance shared by the API route and server components.
// (Same setup google-sso-library made, plus saving the user to Supabase.)
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  events: {
    // Runs after every successful Google login
    async signIn({ user }) {
      if (!user.email) return;
      try {
        await saveUser({ email: user.email, name: user.name, image: user.image });
      } catch (err) {
        // Never block the login because of a database problem
        console.error("[auth] could not save user:", err);
      }
    },
  },
});
