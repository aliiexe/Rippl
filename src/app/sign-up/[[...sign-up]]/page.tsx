import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900">
      <div className="rounded-2xl border border-white/5 bg-navy-800/90 p-4 shadow-xl shadow-black/40">
        <SignUp />
      </div>
    </div>
  );
}

