import MobileNavbar from "@/components/layouts/mobile-navbar";
import SiteHeader from "@/components/layouts/site-header";
import { getLoggedInUser } from "@/lib/appwrite/session";
import { getUserByEmail } from "@/lib/appwrite/db";
import { redirect } from "next/navigation";

interface PagesLayoutProps {
  children: React.ReactNode;
}

export default async function PagesLayout({ children }: PagesLayoutProps) {
  const user = await getLoggedInUser();

  if (!user) redirect("/login");

  const dbUser = await getUserByEmail(user.email);

  if (!dbUser) redirect("/account?origin=/");

  return (
    <>
      <SiteHeader />
      <main className="container max-w-[620px] px-4 sm:px-6">{children}</main>
      <MobileNavbar />
    </>
  );
}
