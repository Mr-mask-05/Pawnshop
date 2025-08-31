import React, { useState } from 'react';
import { Card, TextInput, TextArea, Button } from './ui';

export interface ApplicationInput {
  inGameFullName: string;
  discordOrEmail: string;
  phone?: string;
  stateId?: string;
  region: 'AU' | 'EU' | 'NA' | 'Other';
  about: string;
  moreThan5Hours: boolean;
}

export function ApplyPage({
  onSubmit,
}: {
  onSubmit: (a: ApplicationInput) => void;
}) {
  const [inGameFullName, setInGameFullName] = useState('');
  const [discordOrEmail, setDiscordOrEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stateId, setStateId] = useState('');
  const [region, setRegion] = useState<ApplicationInput['region']>('EU');
  const [moreThan5Hours, setMoreThan5Hours] = useState(false);
  const [about, setAbout] = useState('');
  const [done, setDone] = useState(false);

  function submit() {
    if (!inGameFullName || !discordOrEmail || !about) return;
    onSubmit({
      inGameFullName,
      discordOrEmail,
      phone: phone || undefined,
      stateId: stateId || undefined,
      region,
      about,
      moreThan5Hours,
    });
    setDone(true);
    setInGameFullName('');
    setDiscordOrEmail('');
    setPhone('');
    setStateId('');
    setRegion('EU');
    setMoreThan5Hours(false);
    setAbout('');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Apply for Job</h1>
      {done && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          Application sent!
        </div>
      )}
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput label="In-game Full Name" value={inGameFullName} onChange={(e) => setInGameFullName(e.target.value)} />
          <TextInput label="Discord or Email" value={discordOrEmail} onChange={(e) => setDiscordOrEmail(e.target.value)} />
          <TextInput label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextInput label="State ID (optional)" value={stateId} onChange={(e) => setStateId(e.target.value)} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Region</span>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              value={region}
              onChange={(e) => setRegion(e.target.value as ApplicationInput['region'])}
            >
              <option value="AU">AU</option>
              <option value="EU">EU</option>
              <option value="NA">NA</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={moreThan5Hours} onChange={(e) => setMoreThan5Hours(e.target.checked)} />
            Will you work more than 5 hours per week?
          </label>
          <div className="md:col-span-2">
            <TextArea
              label="Why should you work here? Tell us about you"
              rows={6}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <Button onClick={submit}>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
