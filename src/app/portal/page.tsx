import Link from 'next/link';

export default function Portal() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Portal</h1>
      <ul className="list-disc pl-5">
        <li><Link href="/business">Business portal</Link></li>
        <li><Link href="/staff">Staff portal</Link></li>
      </ul>
    </div>
  );
}
