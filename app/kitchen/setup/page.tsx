import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getUserByClerkId, createUserIfNotExists } from "@/lib/db-utils";
import KitchenSetupForm from "@/components/kitchen-setup-form";

export default async function KitchenSetupPage() {
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
  
  if (!dbUser) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Set Up Your Kitchen
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome to Kantabai! Let&apos;s create your first kitchen to start tracking ingredients.
        </p>
      </div>

      <KitchenSetupForm 
        userId={dbUser.id}
        userEmail={user?.emailAddresses[0]?.emailAddress || dbUser.email}
      />
    </div>
  );
}
