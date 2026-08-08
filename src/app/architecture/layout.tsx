import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Architecture",
  description: "Design solution architecture and team structure",
};

export default async function ArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/login?callbackUrl=/architecture");
  }

  return children;
}
