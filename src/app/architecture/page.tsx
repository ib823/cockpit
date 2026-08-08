import { redirect } from "next/navigation";

/**
 * The architecture tool lives at /architecture/v3; this route survives only
 * so old bookmarks and links keep working.
 */
export default function Page() {
  redirect("/architecture/v3");
}
