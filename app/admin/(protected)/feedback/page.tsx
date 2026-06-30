import { db } from "@/lib/db";
import { feedback, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AdminFeedbackBrowser } from "@/components/admin/AdminFeedbackBrowser";

async function getFeedback() {
  return db
    .select({
      id: feedback.id,
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
      createdAt: feedback.createdAt,
      userNickname: users.nickname,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt));
}

export default async function AdminFeedbackPage() {
  const rows = await getFeedback();
  return <AdminFeedbackBrowser rows={rows} />;
}
