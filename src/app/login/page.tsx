'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const res = await signIn('credentials', {
      username,
      password,
      redirect: true,
      callbackUrl: '/account',
    });
    if (res && res.error) {
      setError(res.error);
    }
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      {error && <p className="mb-2 text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full border px-2 py-1"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border px-2 py-1"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-1"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

