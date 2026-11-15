import Link from 'next/link';
import { SMS_CONSENT_LABEL, SMS_DISCLOSURES } from '../lib/legal';

/**
 * The SMS opt-in checkbox with every disclosure the carriers' 10DLC review asks for listed right beside it:
 * message types, frequency, rates, STOP and HELP, plus links to the Terms and Privacy Policy.
 * Never pre-checked and never required.
 */
export default function SmsConsent({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="mt-8 flex items-start gap-3 text-sm leading-relaxed text-white/85">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={`${id}-disclosures`}
        className="mt-0.5 h-5 w-5 shrink-0 accent-taam-near-black cursor-pointer"
      />
      <div>
        <label htmlFor={id} className="cursor-pointer">
          {SMS_CONSENT_LABEL} <span className="opacity-70">(optional)</span>
        </label>
        <ul id={`${id}-disclosures`} className="mt-2 space-y-1 text-[13px] text-white/80">
          {SMS_DISCLOSURES.map((d) => (
            <li key={d.label}>
              <strong className="font-semibold text-white">{d.label}:</strong> {d.text}
            </li>
          ))}
          <li>
            See our{' '}
            <Link href="/terms#text-messages" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-white">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy#text-messages" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-white">
              Privacy Policy
            </Link>
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
