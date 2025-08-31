"use client";

import { useState } from "react";

interface FormState {
  inGameFullName: string;
  contact: string;
  phone: string;
  stateId: string;
  region: string;
  about: string;
  moreThan5Hours: boolean;
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>({
    inGameFullName: "",
    contact: "",
    phone: "",
    stateId: "",
    region: "",
    about: "",
    moreThan5Hours: false
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSubmitted(true);
  };

  if (submitted) return <p className="p-4">Thank you for applying!</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 p-4">
      <input
        required
        name="inGameFullName"
        placeholder="In-Game Full Name"
        value={form.inGameFullName}
        onChange={handleChange}
        className="w-full rounded border p-2"
      />
      <input
        required
        name="contact"
        placeholder="Discord or Contact"
        value={form.contact}
        onChange={handleChange}
        className="w-full rounded border p-2"
      />
      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
        className="w-full rounded border p-2"
      />
      <input
        name="stateId"
        placeholder="State ID"
        value={form.stateId}
        onChange={handleChange}
        className="w-full rounded border p-2"
      />
      <input
        required
        name="region"
        placeholder="Region"
        value={form.region}
        onChange={handleChange}
        className="w-full rounded border p-2"
      />
      <textarea
        required
        name="about"
        placeholder="Tell us about yourself"
        value={form.about}
        onChange={handleChange}
        className="w-full rounded border p-2"
      />
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="moreThan5Hours"
          checked={form.moreThan5Hours}
          onChange={handleChange}
        />
        <span>Can play more than 5 hours weekly</span>
      </label>
      <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white">
        Submit
      </button>
    </form>
  );
}
