import { NextResponse } from "next/server";
import { authorizeBrowserMutation } from "@/lib/auth/request-guard";
import {
  buildChildDownload,
  buildClassDownload,
  buildParentDownload,
  buildTeacherDownload,
  buildTeacherStudentDownload,
} from "@/lib/privacy/account-data-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  kind?: unknown;
  childId?: unknown;
  username?: unknown;
};

export async function POST(request: Request) {
  const origin = authorizeBrowserMutation(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Could not download that file. Try again." }, { status: 400 });
  }

  const result =
    body.kind === "child" && typeof body.childId === "string"
      ? await buildChildDownload(body.childId)
      : body.kind === "parent"
        ? await buildParentDownload()
        : body.kind === "teacher"
          ? await buildTeacherDownload()
          : body.kind === "student" && typeof body.username === "string"
            ? await buildTeacherStudentDownload(body.username)
            : body.kind === "class"
              ? await buildClassDownload()
              : { ok: false as const, error: "Could not download that file. Try again." };

  if (!result.ok) {
    const status = /sign in|pin|not linked|not in this class/i.test(result.error) ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return new NextResponse(result.body, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
