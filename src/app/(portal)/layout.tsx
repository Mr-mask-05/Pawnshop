import React from 'react';
import TopBar from '../../components/TopBar';
import { auth } from '../../lib/auth';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const username = (session as any)?.username ?? session?.user?.name ?? null;
  const stateId = (session as any)?.stateId ?? null;

  return (
    <div>
      <TopBar username={username} stateId={stateId} />
      <main className="p-4">{children}</main>
    </div>
  );
}
