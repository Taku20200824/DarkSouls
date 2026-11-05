import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/session";
import { checkSameOrigin } from "@/lib/server/security";

export async function POST(req: NextRequest) {
  if (!checkSameOrigin(req)) return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
