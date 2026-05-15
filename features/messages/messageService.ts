import { getDB } from "@/lib/db";
import { SupportMessage } from "@/entities/SupportMessage";

export interface MessageData {
  fromUserId: string;
  category: "support" | "upgrade_request";
  subject: string;
  body: string;
}

export async function createMessage(
  data: MessageData,
): Promise<SupportMessage> {
  const db = await getDB();
  const repo = db.getRepository(SupportMessage);

  const msg = repo.create({
    fromUserId: data.fromUserId,
    category: data.category,
    subject: data.subject,
    body: data.body,
    status: "open",
  });

  return repo.save(msg);
}

export async function getUserMessages(
  userId: string,
): Promise<SupportMessage[]> {
  const db = await getDB();
  return db.getRepository(SupportMessage).find({
    where: { fromUserId: userId },
    order: { createdAt: "DESC" },
  });
}

export async function getAllMessages(): Promise<SupportMessage[]> {
  const db = await getDB();
  return db.getRepository(SupportMessage).find({
    order: { createdAt: "DESC" },
    relations: ["fromUser"],
  });
}

export async function replyToMessage(
  messageId: string,
  adminReply: string,
): Promise<void> {
  const db = await getDB();
  await db.getRepository(SupportMessage).update(messageId, {
    adminReply,
    status: "replied",
  });
}
