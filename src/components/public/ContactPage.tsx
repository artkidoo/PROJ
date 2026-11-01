import React, { useState } from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { Mail, Phone, MapPin } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const ContactPage: React.FC<Props> = ({ navigate }) => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    // No backend submission exists in Phase 1 — do not pretend it was sent.
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <PublicHeader current="contact" navigate={navigate} />
      <main className="flex-1">
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Contact</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase">Start a project.</h1>
            <p className="text-sm text-neutral-400">Enquiries are reviewed by the KeedoHub team. No automated submission backend is connected in Phase 1.</p>
            <div className="space-y-2 text-sm text-neutral-400">
              <div className="flex items-center gap-2"><Mail size={14} className="text-[#FF1E1E]" /> contact details to be confirmed</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-[#FF1E1E]" /> phone to be confirmed</div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-[#FF1E1E]" /> location to be confirmed</div>
            </div>
          </div>
          <form onSubmit={onSubmit} className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded space-y-4">
            {submitted && (
              <div className="text-sm text-amber-400 border border-amber-900/40 bg-amber-950/20 p-3 rounded">
                Form validated successfully. Submission endpoint is not yet connected, so no message was sent.
              </div>
            )}
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#080808] border border-[#242424] rounded px-3 py-2 text-sm text-white" />
              {errors.name && <p className="text-xs text-[#FF1E1E] mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-[#080808] border border-[#242424] rounded px-3 py-2 text-sm text-white" />
              {errors.email && <p className="text-xs text-[#FF1E1E] mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="w-full bg-[#080808] border border-[#242424] rounded px-3 py-2 text-sm text-white" />
              {errors.message && <p className="text-xs text-[#FF1E1E] mt-1">{errors.message}</p>}
            </div>
            <button type="submit" className="w-full bg-[#FF1E1E] hover:bg-[#E01818] text-white py-2.5 text-sm font-semibold rounded">Validate Enquiry</button>
          </form>
        </section>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};
