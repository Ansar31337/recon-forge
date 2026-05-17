import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/requireUser";
import {
  createMessage,
  getUserMessages,
} from "@/features/messages/messageService";
import { errorResponse, success, successMessage } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }
    const messages = await getUserMessages(authed.id);
    return success(messages);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }
    const { subject, body, category } = await request.json();
    if (!subject || !body) {
      return errorResponse("validation", "Subject and body are required");
    }
    if (!["support", "upgrade_request"].includes(category)) {
      return errorResponse("validation", "Invalid category");
    }
    if (category === "upgrade_request" && authed.role !== "regular") {
      return errorResponse(
        "forbidden",
        "Only regular users can request upgrades",
      );
    }
    await createMessage({ fromUserId: authed.id, category, subject, body });
    return successMessage("Message sent successfully");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
