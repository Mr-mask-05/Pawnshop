import React from 'react';
import { Card, Hero, money } from './ui';

export type Product = {
  id: string;
  name: string;
  description?: string;
  publicPrice: number;
  businessPrice: number;
  stock: number;
  image?: string;
  cardSize?: 'sm' | 'md' | 'lg';
};

export function Catalog({
  products,
  bgUrl,
}: {
  products: Product[];
  bgUrl?: string;
}) {
  return (
    <div className="space-y-6">
      <Hero bgUrl={bgUrl}>
        <h1 className="text-3xl font-extrabold">Shop Catalog</h1>
        <p className="text-white/90">Public prices only (no stock shown)</p>
      </Hero>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="group">
            {p.image && (
              <div
                className={`overflow-hidden rounded-xl ${
                  p.cardSize === 'lg' ? 'h-52' : p.cardSize === 'sm' ? 'h-28' : 'h-40'
                }`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
            </div>
            {p.description && (
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                {p.description}
              </div>
            )}
            <div className="mt-1 text-xl font-bold">{money(p.publicPrice)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
