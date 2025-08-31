import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request, { params }: { params: { route: string[] } }) {
  const path = (params.route || []).join("/");
  const session = await auth();
  if (!session || !(session as any).username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  switch (path) {
    case "me/change-password": {
      const { newPassword } = await req.json();
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { username: (session as any).username },
        data: { hashedPassword: hashed, mustChangePassword: false }
      });
      await session.update?.({ mustChangePassword: false });
      return NextResponse.json({ ok: true });
    }
    case "me/set-stateid": {
      const { stateId } = await req.json();
      await prisma.user.update({
        where: { username: (session as any).username },
        data: { stateId, mustAddStateId: false }
      });
      await session.update?.({ mustAddStateId: false, stateId });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
