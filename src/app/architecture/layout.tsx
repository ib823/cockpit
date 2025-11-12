import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'SAP RFP Diagram Generator',
  description: 'Create production-ready architecture diagrams for SAP implementations',
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
