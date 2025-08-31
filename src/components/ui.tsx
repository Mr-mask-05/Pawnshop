import React from 'react';

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger';
  }
) {
  const { variant = 'primary', className = '', ...rest } = props;
  const base =
    'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60';
  const s = {
    primary:
      'bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black',
    ghost:
      'bg-transparent text-gray-800 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  } as const;
  return <button className={`${base} ${s[variant]} ${className}`} {...rest} />;
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function TextInput(
  p: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, ...rest } = p;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
        </span>
      )}
      <input
        {...rest}
        className="w-full rounded-lg border border-gray-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
      />
    </label>
  );
}

export function TextArea(
  p: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, ...rest } = p;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
        </span>
      )}
      <textarea
        {...rest}
        className="w-full rounded-lg border border-gray-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
      />
    </label>
  );
}

export function Hero({
  bgUrl,
  children,
}: {
  bgUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {bgUrl && (
        <img src={bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="relative z-10 space-y-2 bg-black/40 p-8 text-white">{children}</div>
    </div>
  );
}

export const money = (n: number) =>
  new Intl.NumberFormat('en-SE', { style: 'currency', currency: 'SEK' }).format(n);
