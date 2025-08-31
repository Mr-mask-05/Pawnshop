import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const OrderItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
});

const OrderSchema = z.object({
  businessId: z.string(),
  placedById: z.string(),
  delivery: z.enum(["pickup", "delivery"]),
  items: z.array(OrderItemSchema).min(1),
});

export async function POST(req: Request) {
  const data = OrderSchema.parse(await req.json());
  const pickupCode =
    data.delivery === "pickup"
      ? String(Math.floor(100000 + Math.random() * 900000))
      : null;

  const order = await prisma.$transaction(async (tx) => {
    let total = 0;
    const items: { productId: string; qty: number; unitPrice: number }[] = [];
    for (const it of data.items) {
      const product = await tx.product.findUnique({
        where: { id: it.productId },
        select: { stock: true, businessPrice: true },
      });
      if (!product || product.stock < it.qty) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.qty } },
      });
      total += product.businessPrice * it.qty;
      items.push({ productId: it.productId, qty: it.qty, unitPrice: product.businessPrice });
    }

    return tx.order.create({
      data: {
        businessId: data.businessId,
        placedById: data.placedById,
        delivery: data.delivery,
        status: "placed",
        total,
        pickupCode: pickupCode || undefined,
        items: { create: items },
      },
      include: { items: true },
    });
  });

  return NextResponse.json(order, { status: 201 });
}
