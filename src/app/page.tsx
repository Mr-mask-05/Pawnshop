import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="border rounded p-4 bg-white/80 dark:bg-gray-800/80">
            <div className="font-semibold">{p.name}</div>
            <div>${(p.publicPrice / 100).toFixed(2)}</div>
          </li>
        ))}
      </ul>
      <Link
        href="/apply"
        className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
      >
        Apply for Job
      </Link>
    </main>
  );
}
