import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/requireUser";
import { getCreditsSummary } from "@/features/credits/creditService";
import { errorResponse, success } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireUser(request);
    if (!authed) {
      return errorResponse("unauthenticated", "Please login first");
    }

    const summary = await getCreditsSummary(authed.id, authed.role);
    return success(summary);
  } catch (e) {
    console.error(e);
    return errorResponse("db_error", "Something went wrong");
  }
}
