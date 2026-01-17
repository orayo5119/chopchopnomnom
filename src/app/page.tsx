import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Planner from "@/components/Planner";
import Header from "@/components/Header";
import styles from "./page.module.css";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className={styles.main}>
      <Header user={session.user} />
      <Planner />
    </main>
  );
}
