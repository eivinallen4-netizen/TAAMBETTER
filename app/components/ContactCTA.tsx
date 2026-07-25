'use client';

import { useContactForm } from './ContactForm/ContactFormProvider';

interface ContactCTAProps {
  children: React.ReactNode;
  className?: string;
  challenge?: string;
  services?: string[];
  onOpen?: () => void;
}

export default function ContactCTA({ children, className, challenge, services, onOpen }: ContactCTAProps) {
  const { openContactForm } = useContactForm();

  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        openContactForm({ challenge, services });
      }}
      className={className}
    >
      {children}
    </button>
  );
}
