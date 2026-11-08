import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ensureClientWorkspace } from '../../lib/clientWorkspace';

export interface ClientProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  accountType: 'Artist' | 'Brand' | 'Company';
  organizationName: string;
  onboardingComplete: boolean;
  status?: 'Active' | 'Suspended';
  createdAt: string;
  updatedAt: string;
}

interface ClientOnboardingProps {
  onComplete: () => void;
}

export const ClientOnboarding: React.FC<ClientOnboardingProps> = ({ onComplete }) => {
  const { firebaseUser } = useApp();
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [accountType, setAccountType] = useState<'Artist' | 'Brand' | 'Company'>('Artist');
  const [organizationName, setOrganizationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!displayName.trim() || !organizationName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const profileRef = doc(db, 'clientProfiles', firebaseUser.uid);
      const existingProfile = await getDoc(profileRef);
      const profile = {
        displayName: displayName.trim(),
        photoURL: firebaseUser.photoURL || '',
        accountType,
        organizationName: organizationName.trim(),
        onboardingComplete: true,
        updatedAt: now,
      };
      if (existingProfile.exists()) {
        await setDoc(profileRef, profile, { merge: true });
      } else {
        await setDoc(profileRef, {
          ...profile,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          createdAt: now,
        });
      }
      await ensureClientWorkspace(firebaseUser.uid);

      const userRef = doc(db, 'users', firebaseUser.uid);
      const existingUser = await getDoc(userRef);
      if (existingUser.exists()) {
        await setDoc(userRef, {
          ...profile,
          updatedAt: now,
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          ...profile,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          createdAt: now,
        });
      }
      onComplete();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-10">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#FF1E1E] opacity-80 block mb-4">Welcome to KeedoHub</span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">Complete Your Profile</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">Tell us about yourself so we can tailor your workspace experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded">{error}</div>}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-2">Full Name *</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#0C0C0C] border border-[#222] text-white px-4 py-3 rounded text-sm focus:border-[#FF1E1E] focus:outline-none transition-colors" placeholder="Your full name" required />
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-2">Email Address</label>
            <input type="email" value={firebaseUser?.email || ''} disabled className="w-full bg-[#0C0C0C] border border-[#222] text-neutral-500 px-4 py-3 rounded text-sm cursor-not-allowed" />
            <p className="text-[10px] text-neutral-600 mt-1">From your Google account</p>
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-2">Account Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Artist', 'Brand', 'Company'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setAccountType(type)} className={`px-4 py-3 rounded text-sm font-medium transition-colors border ${accountType === type ? 'bg-[#FF1E1E] text-white border-[#FF1E1E]' : 'bg-[#0C0C0C] text-neutral-400 border-[#222] hover:border-[#FF1E1E]/50'}`}>{type}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-2">
              {accountType === 'Artist' ? 'Artist Name' : accountType === 'Brand' ? 'Brand Name' : 'Company Name'} *
            </label>
            <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="w-full bg-[#0C0C0C] border border-[#222] text-white px-4 py-3 rounded text-sm focus:border-[#FF1E1E] focus:outline-none transition-colors" placeholder={`Your ${accountType.toLowerCase()} name`} required />
          </div>
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#FF1E1E] hover:bg-[#E01E1E] text-white px-6 py-3 rounded font-bold tracking-tight transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientOnboarding;
