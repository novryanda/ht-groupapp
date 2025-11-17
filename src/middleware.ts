import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define token type to match JWT from auth config
interface Token {
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

// Define public routes that don't require authentication
const publicRoutes = ["/", "/auth", "/unauthorized"];

// Helper: check if path is a public asset in /public (e.g. /netkrida.png, /logo.svg, etc)
function isPublicAsset(pathname: string) {
  // Only match root-level files (not /public/subfolder/file.png)
  // If you want to allow all /public/**, use: return !pathname.includes("/") || pathname.split("/").length === 2;
  // But Next.js serves /public/* as /*
  // Allow all files at root (e.g. /file.png, /logo.svg)
  return /^\/[\w.-]+\.(png|jpg|jpeg|gif|svg|ico|webp|txt|json|xml|pdf)$/i.test(pathname);
}

// Define protected routes and their required roles
const protectedRoutes = {
  "/dashboard/pt-pks": ["Admin", "Manager", "User"],
  "/dashboard/pt-htk": ["Admin", "Manager", "User"],
  "/dashboard/pt-nilo": ["Admin", "Manager", "User"],
  "/dashboard/pt-zta": ["Admin", "Manager", "User"],
};

// API routes that require specific roles
// Note: These are checked by middleware AND in the route handler for double protection
const protectedApiRoutes: Record<string, string[]> = {
  "/api/admin": ["Admin"],
};

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get token from JWT
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET 
  }) as Token | null;

  const isLoggedIn = !!token;
  const isPublicRoute = publicRoutes.includes(pathname) || isPublicAsset(pathname);
  const isApiRoute = pathname.startsWith("/api");

  // Handle API routes
  if (isApiRoute) {
    // Allow NextAuth API routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Check if API route requires authentication
    const protectedApiRoute = Object.keys(protectedApiRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (protectedApiRoute) {
      // Redirect to login if not authenticated
      if (!isLoggedIn) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check if user has required role for this API route
      const requiredRoles = protectedApiRoutes[protectedApiRoute];
      const userRole = token?.role?.name;

      if (!userRole || !requiredRoles || !requiredRoles.includes(userRole)) {
        return NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // Handle dashboard redirect from root /dashboard
  if (pathname === "/dashboard") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth", nextUrl));
    }

    const companyCode = token?.company?.code;
    if (companyCode) {
      return NextResponse.redirect(
        new URL(`/dashboard/${companyCode.toLowerCase()}`, nextUrl)
      );
    }

    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  // Handle public routes
  if (isPublicRoute) {
    // Jika user sudah login dan akses halaman public (/, /auth, /unauthorized), redirect ke dashboard perusahaan
    if (isLoggedIn) {
      const companyCode = token?.company?.code;
      if (companyCode) {
        return NextResponse.redirect(
          new URL(`/dashboard/${companyCode.toLowerCase()}`, nextUrl)
        );
      }
    }
    return NextResponse.next();
  }

  // Handle protected routes
  const protectedRoute = Object.keys(protectedRoutes).find((route) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has the required role
    const requiredRoles = protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
    const userRole = token?.role?.name;

    if (!userRole || !requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Check if user has access to the company
    const companyCode = token?.company?.code;
    const routeCompany = protectedRoute.replace("/dashboard/", "").toUpperCase();

    // Only allow users to access their own company dashboard
    if (companyCode !== routeCompany) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // All checks passed, allow access
    return NextResponse.next();
  }

  // For any other route, check if user is logged in
  // If not logged in and trying to access non-public route, redirect to auth
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
