import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
});

const PreorderSchema = z.object({
  businessId: z.string(),
  requestedById: z.string(),
  note: z.string().optional(),
  items: z.array(ItemSchema).min(1),
});

export async function POST(req: Request) {
  const data = PreorderSchema.parse(await req.json());
  const preorder = await prisma.preorder.create({
    data: {
      businessId: data.businessId,
      requestedById: data.requestedById,
      note: data.note,
      items: { create: data.items },
    },
    include: { items: true },
  });
  return NextResponse.json(preorder, { status: 201 });
}
