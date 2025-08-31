import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();
  const application = await prisma.application.create({ data });
  return NextResponse.json(application);
}
