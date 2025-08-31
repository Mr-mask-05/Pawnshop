import Link from 'next/link';
import React from 'react';

const tabs = [
  { href: '/business/inventory', label: 'Inventory' },
  { href: '/business/checkout', label: 'Checkout' },
  { href: '/business/pre-orders', label: 'Pre-Orders' },
  { href: '/business/users', label: 'Users' },
  { href: '/business/order-tracking', label: 'Order Tracking' },
];

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="flex gap-4 border-b pb-2 mb-4">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="hover:underline">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
