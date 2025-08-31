import Link from 'next/link';
import React from 'react';

const tabs = [
  { href: '/staff/products', label: 'Products' },
  { href: '/staff/orders', label: 'Orders' },
  { href: '/staff/businesses', label: 'Businesses' },
  { href: '/staff/users', label: 'Users' },
  { href: '/staff/settings', label: 'Settings' },
  { href: '/staff/purchase-calculator', label: 'Purchase Calculator' },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
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
