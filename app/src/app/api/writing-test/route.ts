import { NextResponse } from "next/server";
import { listWritingTestSubmissions } from "@/lib/writing-test-store";

/** Admin/export: protect with WRITING_TEST_ADMIN_KEY query or header. */
function isAuthorized(request: Request): boolean {
  const expected = process.env.WRITING_TEST_ADMIN_KEY?.trim();
  if (!expected) return false;

  const url = new URL(request.url);
  const keyQuery = url.searchParams.get("key");
  if (keyQuery && keyQuery === expected) return true;

  const header = request.headers.get("x-writing-test-admin-key");
  return header === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized. Set WRITING_TEST_ADMIN_KEY and pass ?key= or x-writing-test-admin-key header.",
      },
      { status: 401 }
    );
  }

  const submissions = listWritingTestSubmissions();
  return NextResponse.json({ success: true, submissions, count: submissions.length });
}
