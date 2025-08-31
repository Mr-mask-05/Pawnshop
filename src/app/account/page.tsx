import React from 'react';
import { auth } from '../../lib/auth';

export default async function AccountPage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Account Settings</h1>
        <p>You must be signed in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Account Settings</h1>
      <p className="mb-2">Username: {(session as any).username || session.user?.name}</p>
      <p>State ID: {(session as any).stateId || 'N/A'}</p>
    </div>
  );
}
