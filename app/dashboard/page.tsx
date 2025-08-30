import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { 
  getUserByClerkId, 
  createUserIfNotExists,
  getKitchensByUser
} from "@/lib/db-utils";
import DashboardClient from "@/components/dashboard-client";

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from our database, create if doesn't exist
  let dbUser = await getUserByClerkId(userId);
  
  if (!dbUser && user) {
    // Create user if they don't exist in our database
    dbUser = await createUserIfNotExists({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.imageUrl,
    });
  }
  
  const userKitchens = dbUser ? await getKitchensByUser(dbUser.id) : [];

  return (
    <DashboardClient 
      kitchens={userKitchens}
      user={{
        firstName: user?.firstName,
        emailAddress: user?.emailAddresses[0]?.emailAddress
      }}
    />
  );
}
