'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SocialMediaOnboardingForm from '@/app/social-media-onboarding/SocialMediaOnboardingForm';

export default function IntakePage() {
  const params = useParams();
  const token = params.token as string;
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/intake-links/validate?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title);
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (error) {
        setIsValid(false);
      }
    }

    validateToken();
  }, [token]);

  if (isValid === null) {
    return (
      <div className="min-h-screen bg-taam-near-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-taam-near-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black mb-3">Link Expired or Invalid</h1>
          <p className="text-gray-400">This intake form link is no longer valid. Please contact the sender.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taam-near-black text-white py-12 px-6">
      <div className="max-w-2xl mx-auto mb-8">
        {title && <h2 className="text-2xl font-bold text-center text-gray-300">{title}</h2>}
      </div>
      <SocialMediaOnboardingForm intakeToken={token} />
    </div>
  );
}
