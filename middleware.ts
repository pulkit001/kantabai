import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Make the home page and all non-dashboard routes public
  publicRoutes: ["/(.*)"],
  ignoredRoutes: ["/api/webhooks/clerk"],
  // Handle authentication redirects
  afterAuth(auth, req) {
    // Protect dashboard route - redirect to sign-in if not authenticated
    if (req.nextUrl.pathname.startsWith('/dashboard') && !auth.userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
    
    // Redirect authenticated users from home page to dashboard
    if (req.nextUrl.pathname === '/' && auth.userId) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return Response.redirect(dashboardUrl);
    }
    
    // Allow all other routes to be public
    return;
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
