import React from 'react';
import TopBar from '../../components/TopBar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // Placeholder values; in real app these would come from auth/session
  const username = 'Demo User';
  const stateId = 'STATE-12345';

  return (
    <div>
      <TopBar username={username} stateId={stateId} />
      <main className="p-4">{children}</main>
    </div>
  );
}
