import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: {
        id: string;
        name: string;
        description?: string | null;
      };
      company?: {
        id: string;
        code: string;
        name: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    role?: {
      id: string;
      name: string;
      description?: string | null;
    };
    company?: {
      id: string;
      code: string;
      name: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    picture?: string | null;
    role?: {
      id: string;
      name: string;
      description?: string | null;
    };
    company?: {
      id: string;
      code: string;
      name: string;
    };
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  // Add trustHost for deployment
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            company: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });

        console.log("👤 User found:", user ? "Yes" : "No");

        if (!user || !user.password) {
          console.log("❌ User not found or no password");
          return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log("✅ Password valid:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("❌ Invalid password");
          return null;
        }

        console.log("✅ Login successful for:", user.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role ?? undefined,
          company: user.company ?? undefined,
        };
      },
    }),
    DiscordProvider,
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth",
    error: "/auth",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = String(user.id);
        token.role = user.role;
        token.company = user.company;
        token.picture = user.image;
        token.name = user.name;
      }

      // Update session (when trigger is "update")
      if (trigger === "update") {
        // Fetch latest user data from database
        const dbUser = await db.user.findUnique({
          where: { id: String(token.id) },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            company: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });

        if (dbUser) {
          token.role = dbUser.role ?? undefined;
          token.company = dbUser.company ?? undefined;
          token.picture = dbUser.image;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.company = token.company as typeof session.user.company;
        session.user.image = token.picture ?? session.user.image;
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle logout redirects
      if (url.includes("/api/auth/signout") || url.includes("signout")) {
        return `${baseUrl}/auth`;
      }

      // If there's a specific URL to redirect to, use it
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      }

      // For successful login, redirect to dashboard based on company
      if (url === baseUrl || url.includes("/api/auth/callback")) {
        return `${baseUrl}/dashboard`;
      }

      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
    },
  },
  // Cookie configuration for NextAuth v5 (Auth.js) compatibility
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-authjs.session-token`
          : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-authjs.callback-url`
          : `authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-authjs.csrf-token`
          : `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        
      },
    },
  },
  // Production-specific settings
  ...(process.env.NODE_ENV === "production" && {
    useSecureCookies: true,
  }),
} satisfies NextAuthConfig;
