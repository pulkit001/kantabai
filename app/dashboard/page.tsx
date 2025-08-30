import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUserByClerkId, getPostsByUser } from "@/lib/db-utils";
import { Database, Users, FileText } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from our database
  const dbUser = await getUserByClerkId(userId);
  const userPosts = dbUser ? await getPostsByUser(dbUser.id) : [];

  return (
    <div className="container mx-auto py-4 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
        
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
          <div className="p-4 md:p-6 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5" />
              <h3 className="text-lg md:text-xl font-semibold">Database</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              Powered by Neon DB with Drizzle ORM for type-safe database operations.
            </p>
            <Button className="w-full md:w-auto">Explore Database</Button>
          </div>
          
          <div className="p-4 md:p-6 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg md:text-xl font-semibold">Your Posts</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              You have {userPosts.length} posts. Create and manage your content.
            </p>
            <Button variant="outline" className="w-full md:w-auto">Manage Posts</Button>
          </div>
          
          <div className="p-4 md:p-6 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg md:text-xl font-semibold">Profile</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              {dbUser ? "Synced with database" : "Profile needs sync"}
            </p>
            <Button variant="secondary" className="w-full md:w-auto">View Profile</Button>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-4 md:p-6 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold mb-4">Database Integration Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>Drizzle ORM</span>
              <span className="text-green-600 dark:text-green-400">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>Neon Database</span>
              <span className="text-green-600 dark:text-green-400">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>User Sync</span>
              <span className={dbUser ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                {dbUser ? "✓ Synced" : "⚠ Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>Clerk Webhooks</span>
              <span className="text-blue-600 dark:text-blue-400">ℹ Setup Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
