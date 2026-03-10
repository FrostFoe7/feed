import { generateUsername } from "@/app/_actions/generate-username";
import AccountSetupForm from "@/components/auth/account-setup-form";
import { getLoggedInUser } from "@/lib/appwrite/session";
import { getUserByEmail } from "@/lib/appwrite/db";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const user = await getLoggedInUser();

  if (!user || !user.email) redirect("/login");

  const dbUser = await getUserByEmail(user.email);

  if (dbUser && dbUser.verified) redirect("/");

  const username = (await generateUsername(user.email)) ?? "";

  return (
    <div className="mx-auto flex h-[95vh] w-full max-w-lg flex-col items-center justify-center gap-6">
      <AccountSetupForm username={username} />
    </div>
  );
}
