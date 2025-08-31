import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const modelMap = {
  products: "product",
  businesses: "business",
  users: "user",
  orders: "order",
  settings: "settings",
  applications: "application",
  preorders: "preorder"
} as const;

const roleMap: Record<keyof typeof modelMap, string[]> = {
  products: ["owner", "inventory"],
  businesses: ["owner", "manager"],
  users: ["owner", "hr"],
  orders: ["owner", "orders"],
  settings: ["owner"],
  applications: ["owner", "hr"],
  preorders: ["owner", "inventory"]
};

type Resource = keyof typeof modelMap;

async function handle(
  req: NextRequest,
  { params }: { params: { slug: string[] } },
  method: string
) {
  const [resource, id] = params.slug || [];
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const allowed = roleMap[resource as Resource];
  const role = (session as any).staffRole as string | null;
  if (!allowed || !role || !allowed.includes(role))
    return new Response("Forbidden", { status: 403 });

  const modelKey = modelMap[resource as Resource];
  if (!modelKey) return new Response("Not Found", { status: 404 });
  const model = (prisma as any)[modelKey];

  try {
    if (method === "GET") {
      if (id || resource === "settings") {
        const whereId = resource === "settings" ? Number(id || 1) : id;
        const data = await model.findUnique({ where: { id: whereId } });
        return Response.json(data);
      }
      const data = await model.findMany();
      return Response.json(data);
    }

    const body = await req.json();
    if (method === "POST") {
      const data = await model.create({ data: body });
      return Response.json(data);
    }
    if (method === "PUT") {
      const whereId = resource === "settings" ? Number(id || 1) : id;
      const data = await model.update({ where: { id: whereId }, data: body });
      return Response.json(data);
    }
    if (method === "DELETE") {
      const whereId = resource === "settings" ? Number(id || 1) : id;
      const data = await model.delete({ where: { id: whereId } });
      return Response.json(data);
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (e) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export function GET(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return handle(req, ctx, "GET");
}
export function POST(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return handle(req, ctx, "POST");
}
export function PUT(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return handle(req, ctx, "PUT");
}
export function DELETE(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return handle(req, ctx, "DELETE");
}
