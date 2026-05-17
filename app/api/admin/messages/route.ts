import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/requireUser";
import { getAllMessages } from "@/features/messages/messageService";
import { errorResponse, success } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const messages = await getAllMessages();
    return success(messages);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
