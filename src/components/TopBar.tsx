'use client';

import Link from 'next/link';
import React from 'react';

interface TopBarProps {
  username: string;
  stateId: string;
}

export default function TopBar({ username, stateId }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="font-semibold">{username}</div>
      <div className="text-sm text-gray-600">State ID: {stateId}</div>
      <div>
        <Link href="/account" className="underline">
          Account Settings
        </Link>
      </div>
    </header>
  );
}
