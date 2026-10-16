'use client';

import { useState, useEffect } from 'react';
import Arrow from '@/components/editorial/Arrow';
import {
  Camera,
  Users,
  Music2,
  Play,
  Link2,
  Share2,
  Mail,
  Lock,
  CheckCircle,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 'confirmation';

interface SocialAccount {
  platform: string;
  username: string;
  email: string;
  password: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Camera, color: 'from-pink-500 to-purple-500' },
  { id: 'facebook', name: 'Facebook', icon: Users, color: 'from-blue-600 to-blue-400' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'from-black to-gray-800' },
  { id: 'youtube', name: 'YouTube', icon: Play, color: 'from-red-600 to-red-400' },
  { id: 'linkedin', name: 'LinkedIn', icon: Link2, color: 'from-blue-500 to-cyan-500' },
  { id: 'twitter', name: 'Twitter', icon: Share2, color: 'from-cyan-400 to-blue-500' },
];

interface SocialMediaOnboardingFormProps {
  intakeToken?: string;
}

export default function SocialMediaOnboardingForm({ intakeToken }: SocialMediaOnboardingFormProps = {}) {
  const [step, setStep] = useState<Step>(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialAccount[]>([]);
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [submitterEmail, setSubmitterEmail] = useState<string>('');
  const [submitterName, setSubmitterName] = useState<string>('');

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('onboarding_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setSelectedPlatforms(draft.platforms || []);
        setStep(draft.step || 1);
        setCurrentPlatformIndex(draft.currentPlatformIndex || 0);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    if (dirty) {
      const draft = {
        platforms: selectedPlatforms,
        step,
        currentPlatformIndex,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('onboarding_draft', JSON.stringify(draft));
    }
  }, [selectedPlatforms, step, currentPlatformIndex, dirty]);

  // Clear draft on successful submission
  useEffect(() => {
    if (step === 'confirmation') {
      localStorage.removeItem('onboarding_draft');
    }
  }, [step]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function selectPlatform(platformId: string) {
    setDirty(true);
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (platform && !selectedPlatforms.find((p) => p.platform === platformId)) {
      setSelectedPlatforms((prev) => [
        ...prev,
        {
          platform: platformId,
          username: '',
          email: '',
          password: '',
        },
      ]);
    }
  }

  function removePlatform(platformId: string) {
    setDirty(true);
    setSelectedPlatforms((prev) => prev.filter((p) => p.platform !== platformId));
    if (currentPlatformIndex >= selectedPlatforms.length - 1) {
      setCurrentPlatformIndex(Math.max(0, selectedPlatforms.length - 2));
    }
  }

  function updateAccount(field: keyof Omit<SocialAccount, 'platform'>, value: string) {
    setDirty(true);
    setSelectedPlatforms((prev) => {
      const updated = [...prev];
      updated[currentPlatformIndex] = {
        ...updated[currentPlatformIndex],
        [field]: value,
      };
      return updated;
    });
  }

  function goToCredentials() {
    if (selectedPlatforms.length > 0) {
      setCurrentPlatformIndex(0);
      setStep(2);
    }
  }

  function nextAccount() {
    if (currentPlatformIndex < selectedPlatforms.length - 1) {
      setCurrentPlatformIndex(currentPlatformIndex + 1);
    } else {
      setStep(3);
    }
  }

  function prevAccount() {
    if (currentPlatformIndex > 0) {
      setCurrentPlatformIndex(currentPlatformIndex - 1);
    } else {
      setStep(1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Validate submitter info for intake forms
      if (intakeToken) {
        if (!submitterEmail.trim()) {
          throw new Error('Please enter your email address');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(submitterEmail)) {
          throw new Error('Please enter a valid email address');
        }
      }

      const endpoint = intakeToken
        ? '/api/social-media-onboarding/intake'
        : '/api/social-media-onboarding';

      const payload: any = {
        accounts: selectedPlatforms,
      };

      if (intakeToken) {
        payload.intakeToken = intakeToken;
        payload.submitterEmail = submitterEmail;
        payload.submitterName = submitterName;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to submit. Please try again.';

        if (res.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (res.status === 400) {
          try {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // Fallback to default error message
          }
        } else if (res.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      setStep('confirmation');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setSubmitError(message);
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  }

  const currentAccount = selectedPlatforms[currentPlatformIndex];
  const stepNumber = step === 'confirmation' ? null : step;
  const step1Valid = selectedPlatforms.length > 0;

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const isValidUsername = (username: string): boolean => {
    return username.trim().length >= 1;
  };

  const getFieldErrors = (account: typeof currentAccount): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!isValidUsername(account.username)) {
      errors.username = 'Username is required';
    }

    if (!account.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(account.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!account.password) {
      errors.password = 'Password is required';
    } else if (!isValidPassword(account.password)) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const currentErrors = currentAccount ? getFieldErrors(currentAccount) : {};
  const step2Valid = currentAccount ? Object.keys(currentErrors).length === 0 : false;

  const step3Valid = selectedPlatforms.every((acc) => {
    const errors = getFieldErrors(acc);
    return Object.keys(errors).length === 0;
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with progress */}
      <div className="mb-12">
        {dirty && step !== 'confirmation' && (
          <div className="mb-6 p-3 bg-blue-500/20 border border-blue-500 text-blue-200 rounded text-sm flex items-center justify-between">
            <span>Draft saved. Your progress is automatically saved.</span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear draft and start over?')) {
                  localStorage.removeItem('onboarding_draft');
                  setSelectedPlatforms([]);
                  setStep(1);
                  setCurrentPlatformIndex(0);
                  setDirty(false);
                  setSubmitError(null);
                }
              }}
              className="text-xs font-bold hover:text-white transition"
            >
              Clear
            </button>
          </div>
        )}
        {stepNumber ? (
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Step {stepNumber} of 3
            </span>
            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-[#F46325] transition-all duration-300"
                style={{ width: `${(stepNumber / 3) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
        <h1 className="text-4xl md:text-5xl font-black mb-3">
          {step === 1 && 'Connect Your Social Media'}
          {step === 2 && `Add Credentials`}
          {step === 3 && 'Review & Confirm'}
          {step === 'confirmation' && 'All Set! 🎉'}
        </h1>
        <p className="text-gray-400 text-lg">
          {step === 1 && 'Select all the platforms you want to manage.'}
          {step === 2 && `Enter your ${currentAccount ? PLATFORMS.find((p) => p.id === currentAccount.platform)?.name : ''} credentials.`}
          {step === 3 && 'Review your connected accounts before confirming.'}
          {step === 'confirmation' && 'Your accounts have been successfully connected.'}
        </p>
      </div>

      {/* Intake form fields */}
      {intakeToken && step === 1 && (
        <div className="mb-8 space-y-4 p-6 bg-gray-900/50 border border-gray-700 rounded">
          <h3 className="font-bold text-lg mb-4">Your Information</h3>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-300">Email *</label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-300">Name (optional)</label>
            <input
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition"
              placeholder="Your name"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {step === 1 && <StepSelectPlatforms platforms={PLATFORMS} selected={selectedPlatforms.map((p) => p.platform)} onSelect={selectPlatform} />}
      {step === 2 && currentAccount && (
        <StepCredentials
          platforms={PLATFORMS}
          account={currentAccount}
          onUpdate={updateAccount}
          onRemove={removePlatform}
          currentIndex={currentPlatformIndex}
          total={selectedPlatforms.length}
          submitError={submitError}
          errors={currentErrors}
        />
      )}
      {step === 3 && <StepReview platforms={PLATFORMS} accounts={selectedPlatforms} onEdit={(idx) => { setCurrentPlatformIndex(idx); setStep(2); }} />}
      {step === 'confirmation' && <Confirmation />}

      {/* Navigation */}
      {step !== 'confirmation' && (
        <div className="flex items-center justify-between mt-12">
          {step === 2 || step === 3 ? (
            <button
              type="button"
              onClick={step === 2 ? prevAccount : () => setStep(2)}
              className="px-6 py-3 text-sm font-bold uppercase tracking-wide text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!step1Valid}
              onClick={goToCredentials}
              className="px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <Arrow dir="right" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              disabled={!step2Valid}
              onClick={nextAccount}
              className="px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {currentPlatformIndex === selectedPlatforms.length - 1 ? 'Review' : 'Next'} <Arrow dir="right" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              disabled={!step3Valid || submitting}
              onClick={handleSubmit}
              className="px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Connecting...' : 'Connect Accounts'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StepSelectPlatforms({
  platforms,
  selected,
  onSelect,
}: {
  platforms: typeof PLATFORMS;
  selected: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id);
        const Icon = platform.icon;
        return (
          <button
            key={platform.id}
            onClick={() => onSelect(platform.id)}
            className={`group relative p-6 rounded-lg border-2 transition ${
              isSelected ? 'border-[#F46325] bg-[#F46325]/10' : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className={`inline-flex p-3 rounded-lg mb-3 bg-gradient-to-br ${platform.color} text-white`}>
              <Icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-left">{platform.name}</h3>
            {isSelected && (
              <div className="absolute top-3 right-3 bg-[#F46325] rounded-full p-1">
                <CheckCircle size={20} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StepCredentials({
  platforms,
  account,
  onUpdate,
  onRemove,
  currentIndex,
  total,
  submitError,
  errors = {},
}: {
  platforms: typeof PLATFORMS;
  account: SocialAccount;
  onUpdate: (field: keyof Omit<SocialAccount, 'platform'>, value: string) => void;
  onRemove: (platformId: string) => void;
  currentIndex: number;
  total: number;
  submitError: string | null;
  errors?: Record<string, string>;
}) {
  const platform = platforms.find((p) => p.id === account.platform);
  const Icon = platform?.icon || Camera;
  const inputClass =
    'w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${platform?.color} text-white shrink-0`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-400">Account {currentIndex + 1} of {total}</p>
          <p className="text-lg font-bold">{platform?.name}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(account.platform)}
          className="text-gray-400 hover:text-red-400 transition text-sm font-bold uppercase tracking-wide"
        >
          Remove
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300">Username / Handle</label>
          <div className="relative">
            <input
              type="text"
              value={account.username}
              onChange={(e) => onUpdate('username', e.target.value)}
              className={`${inputClass} ${errors.username ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder={`@username`}
            />
          </div>
          {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300">Email</label>
          <div className="relative">
            <input
              type="email"
              value={account.email}
              onChange={(e) => onUpdate('email', e.target.value)}
              className={`${inputClass} ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="your@email.com"
            />
            <Mail size={18} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300">Password</label>
          <div className="relative">
            <input
              type="password"
              value={account.password}
              onChange={(e) => onUpdate('password', e.target.value)}
              className={`${inputClass} ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="••••••••"
            />
            <Lock size={18} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          {!errors.password && <p className="text-xs text-gray-500 mt-2">Your passwords are encrypted and stored securely.</p>}
        </div>
      </div>

      {submitError && <p className="text-red-400 text-sm mt-4">{submitError}</p>}
    </div>
  );
}

function StepReview({
  platforms,
  accounts,
  onEdit,
}: {
  platforms: typeof PLATFORMS;
  accounts: SocialAccount[];
  onEdit: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      {accounts.map((account, idx) => {
        const platform = platforms.find((p) => p.id === account.platform);
        const Icon = platform?.icon || Camera;
        return (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition"
          >
            <div className="flex items-center gap-4">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${platform?.color} text-white`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="font-bold">{platform?.name}</p>
                <p className="text-sm text-gray-400">@{account.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(idx)}
              className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#F46325] hover:bg-[#F46325]/10 rounded transition"
            >
              Edit
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Confirmation() {
  return (
    <div className="text-center py-10">
      <div className="mb-6 flex justify-center">
        <CheckCircle size={64} className="text-[#F46325]" />
      </div>
      <h2 className="text-3xl md:text-4xl font-black mb-4">All Set!</h2>
      <p className="text-gray-300 text-lg max-w-lg mx-auto">
        Your social media accounts have been successfully connected. We&apos;ll start managing your content right away.
      </p>
    </div>
  );
}
