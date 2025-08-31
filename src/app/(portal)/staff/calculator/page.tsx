import { prisma } from '@/lib/prisma';
import { Settings } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as React from 'react';

export default async function CalculatorPage() {
  const settings = await prisma.settings.findFirst();
  return <CalculatorClient settings={settings} />;
}

async function saveSettings(formData: FormData) {
  'use server';
  const payoutPct = Number(formData.get('payoutPct')) || 0;
  const feePct = Number(formData.get('feePct')) || 0;
  const feeFlat = Number(formData.get('feeFlat')) || 0;
  const doNotBuyJson = (formData.get('doNotBuyJson') as string) || '';
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { payoutPct, feePct, feeFlat, doNotBuyJson },
    create: { id: 1, payoutPct, feePct, feeFlat, doNotBuyJson }
  });
  revalidatePath('/staff/calculator');
}

function CalculatorClient({ settings }: { settings: Settings | null }) {
  'use client';
  const [items, setItems] = React.useState([{ name: '', qty: 1, unit: 0 }]);
  const [payoutPct, setPayoutPct] = React.useState(settings?.payoutPct ?? 0);
  const [feePct, setFeePct] = React.useState(settings?.feePct ?? 0);
  const [feeFlat, setFeeFlat] = React.useState(settings?.feeFlat ?? 0);
  const doNotBuy = React.useMemo(() => {
    try {
      return JSON.parse(settings?.doNotBuyJson || '[]') as string[];
    } catch {
      return [];
    }
  }, [settings]);

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unit, 0);
  const policyValue = subtotal * (payoutPct / 100);
  const fees = policyValue * (feePct / 100) + feeFlat;
  const payout = policyValue - fees;

  const updateItem = (idx: number, field: 'name' | 'qty' | 'unit', value: string) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, [field]: field === 'name' ? value : Number(value) } : it)));
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Calculator</h1>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-wrap items-end gap-2">
            <input
              className="rounded border p-1"
              placeholder="Item"
              value={item.name}
              onChange={(e) => updateItem(idx, 'name', e.target.value)}
            />
            <input
              type="number"
              className="w-20 rounded border p-1"
              value={item.qty}
              onChange={(e) => updateItem(idx, 'qty', e.target.value)}
            />
            <input
              type="number"
              className="w-24 rounded border p-1"
              value={item.unit}
              onChange={(e) => updateItem(idx, 'unit', e.target.value)}
            />
            {doNotBuy.includes(item.name.trim().toLowerCase()) && <span className="text-red-500">Do Not Buy</span>}
          </div>
        ))}
        <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={() => setItems([...items, { name: '', qty: 1, unit: 0 }])}>
          Add Item
        </button>
      </div>

      <div className="space-y-2">
        <div>Subtotal: ${subtotal.toFixed(2)}</div>
        <div>
          Payout %:
          <input
            type="number"
            className="ml-2 w-20 rounded border p-1"
            value={payoutPct}
            onChange={(e) => setPayoutPct(Number(e.target.value))}
          />
        </div>
        <div>
          Fee %:
          <input
            type="number"
            className="ml-2 w-20 rounded border p-1"
            value={feePct}
            onChange={(e) => setFeePct(Number(e.target.value))}
          />
        </div>
        <div>
          Fee Flat:
          <input
            type="number"
            className="ml-2 w-24 rounded border p-1"
            value={feeFlat}
            onChange={(e) => setFeeFlat(Number(e.target.value))}
          />
        </div>
        <div>Policy Value: ${policyValue.toFixed(2)}</div>
        <div>Fees: ${fees.toFixed(2)}</div>
        <div className="font-bold">Final Payout: ${payout.toFixed(2)}</div>
      </div>

      <form action={saveSettings} className="space-y-2 border-t pt-4">
        <h2 className="text-lg font-semibold">Edit Settings</h2>
        <div className="flex flex-wrap gap-2">
          <input name="payoutPct" type="number" className="w-24 rounded border p-1" defaultValue={settings?.payoutPct ?? 0} />
          <input name="feePct" type="number" className="w-24 rounded border p-1" defaultValue={settings?.feePct ?? 0} />
          <input name="feeFlat" type="number" className="w-24 rounded border p-1" defaultValue={settings?.feeFlat ?? 0} />
        </div>
        <textarea
          name="doNotBuyJson"
          className="h-24 w-full rounded border p-1"
          defaultValue={settings?.doNotBuyJson || ''}
          placeholder="Do Not Buy JSON"
        />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-white">
          Save Settings
        </button>
      </form>
    </div>
  );
}
