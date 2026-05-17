import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/requireUser";
import { replyToMessage } from "@/features/messages/messageService";
import { errorResponse, successMessage } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireUser(request);
    if (!authed || authed.role !== "superadmin") {
      return errorResponse("forbidden", "You do not have permission");
    }
    const { id } = await params;
    const { reply } = await request.json();
    if (!reply || !reply.trim()) {
      return errorResponse("validation", "Reply is required");
    }
    await replyToMessage(id, reply);
    return successMessage("Reply sent");
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
