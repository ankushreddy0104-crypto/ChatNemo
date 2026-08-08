import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function RootPage() {
  const token = cookies().get("chatnemo_token");
  if (token) redirect("/chat");
  redirect("/auth");
}
