import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const preorder = await prisma.preorder.update({
    where: { id: params.id },
    data: { status: "denied" },
    include: { items: true },
  });
  return NextResponse.json(preorder);
}
