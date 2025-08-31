'use client';

import Link from 'next/link';
import React from 'react';

interface TopBarProps {
  username?: string | null;
  stateId?: string | null;
}

export default function TopBar({ username, stateId }: TopBarProps) {
  const displayName = username || 'Guest';
  const displayStateId = stateId || 'N/A';

  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="font-semibold">{displayName}</div>
      <div className="text-sm text-gray-600">State ID: {displayStateId}</div>
      <div>
        <Link href="/account" className="underline">
          Account Settings
        </Link>
      </div>
    </header>
  );
}
