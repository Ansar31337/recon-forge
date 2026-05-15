import { NextResponse } from "next/server";

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function successMessage(message: string, status = 200) {
  return NextResponse.json({ success: true, message }, { status });
}

export function errorResponse(error: string, message: string, status = 400) {
  return NextResponse.json({ error, message }, { status });
}
