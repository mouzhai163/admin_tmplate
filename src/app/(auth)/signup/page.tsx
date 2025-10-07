import { SignupForm } from "@/components/signup-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) redirect("/");
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <SignupForm />
    </main>
  );
}
