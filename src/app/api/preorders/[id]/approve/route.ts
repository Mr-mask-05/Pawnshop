import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const preorder = await prisma.preorder.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!preorder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const order = await prisma.$transaction(async (tx) => {
    let total = 0;
    const orderItems: { productId: string; qty: number; unitPrice: number }[] = [];
    for (const it of preorder.items) {
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
      orderItems.push({
        productId: it.productId,
        qty: it.qty,
        unitPrice: product.businessPrice,
      });
    }
    const order = await tx.order.create({
      data: {
        businessId: preorder.businessId,
        placedById: preorder.requestedById,
        delivery: "pickup",
        status: "placed",
        total,
        items: { create: orderItems },
      },
      include: { items: true },
    });
    await tx.preorder.update({
      where: { id: preorder.id },
      data: { status: "approved" },
    });
    return order;
  });
  return NextResponse.json(order);
}
