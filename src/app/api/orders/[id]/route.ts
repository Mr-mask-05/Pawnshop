import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z.object({
  status: z.string().optional(),
  invoicePaid: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const data = PatchSchema.parse(await req.json());
  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: data.status,
      invoicePaid: data.invoicePaid,
    },
    include: { items: true },
  });
  return NextResponse.json(order);
}
