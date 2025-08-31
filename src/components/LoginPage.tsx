import React, { useState } from 'react';
import { Card, TextInput, Button } from './ui';

export function LoginPage({
  onLogin,
  onBack,
}: {
  onLogin: (u: string, p: string) => string | null;
  onBack: () => void;
}) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h2 className="mb-4 text-xl font-bold">Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(onLogin(u, p));
          }}
        >
          <TextInput label="Username" value={u} onChange={(e) => setU(e.target.value)} />
          <TextInput label="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} />
          {err && <div className="mt-2 text-sm text-red-500">{err}</div>}
          <div className="mt-3 flex items-center justify-between">
            <Button type="submit">Login</Button>
            <Button variant="ghost" type="button" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
