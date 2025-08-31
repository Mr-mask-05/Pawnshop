import Link from 'next/link';
import { auth } from '../lib/auth';

export default async function HomePage() {
  const session = await auth();
  const username = (session as any)?.username || session?.user?.name;

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">Pawnshop Portal</h1>
      {session ? (
        <p>
          Welcome back, {username}. Visit your{' '}
          <Link href="/account" className="underline">
            account settings
          </Link>
          .
        </p>
      ) : (
        <p>
          <Link href="/login" className="underline">
            Sign in
          </Link>{' '}
          to continue.
        </p>
      )}
    </main>
  );
}

