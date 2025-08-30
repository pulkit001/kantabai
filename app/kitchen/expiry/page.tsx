import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { 
  getUserByClerkId, 
  createUserIfNotExists,
  getDefaultKitchen, 
  getKitchensByUser,
  getExpiringItems,
  getExpiringItemsThisMonth
} from "@/lib/db-utils";
import ExpiryView from "@/components/expiry-view";

interface ExpiryPageProps {
  searchParams: { kitchenId?: string }
}

export default async function ExpiryPage({ searchParams }: ExpiryPageProps) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from our database, create if doesn't exist
  let dbUser = await getUserByClerkId(userId);
  
  if (!dbUser && user) {
    dbUser = await createUserIfNotExists({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.imageUrl,
    });
  }
  
  if (!dbUser) {
    redirect("/dashboard");
  }

  // Get kitchen to work with
  let targetKitchen = null;
  
  if (searchParams.kitchenId) {
    // Get specific kitchen by ID
    const kitchenId = parseInt(searchParams.kitchenId);
    const userKitchens = await getKitchensByUser(dbUser.id);
    targetKitchen = userKitchens.find(k => k.id === kitchenId) || null;
  }
  
  if (!targetKitchen) {
    // Fallback to default kitchen
    targetKitchen = await getDefaultKitchen(dbUser.id);
  }
  
  if (!targetKitchen) {
    redirect("/kitchen/setup");
  }

  // Get expiring items for different time ranges
  const [expiringToday, expiringWeek, expiringMonth] = await Promise.all([
    getExpiringItems(targetKitchen.id, 0), // Today
    getExpiringItems(targetKitchen.id, 7), // 7 days
    getExpiringItemsThisMonth(targetKitchen.id), // This month but not this week
  ]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Expiry Tracking</h1>
          <p className="text-muted-foreground">
            Monitor ingredient expiry dates to reduce food waste in {targetKitchen.name}
          </p>
        </div>

        <ExpiryView
          expiringToday={expiringToday}
          expiringWeek={expiringWeek}
          expiringMonth={expiringMonth}
          kitchenId={targetKitchen.id}
        />
      </div>
    </div>
  );
}
