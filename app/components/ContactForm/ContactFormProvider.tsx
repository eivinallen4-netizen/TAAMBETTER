'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ContactFormModal from './ContactFormModal';

export interface ContactFormPrefill {
  challenge?: string;
  services?: string[];
}

interface ContactFormContextValue {
  openContactForm: (prefill?: ContactFormPrefill) => void;
  closeContactForm: () => void;
}

const ContactFormContext = createContext<ContactFormContextValue | null>(null);

export function useContactForm(): ContactFormContextValue {
  const ctx = useContext(ContactFormContext);
  if (!ctx) {
    throw new Error('useContactForm must be used within ContactFormProvider');
  }
  return ctx;
}

export default function ContactFormProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<ContactFormPrefill | undefined>(undefined);

  const openContactForm = useCallback((nextPrefill?: ContactFormPrefill) => {
    setPrefill(nextPrefill);
    setIsOpen(true);
  }, []);

  const closeContactForm = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({ openContactForm, closeContactForm }), [openContactForm, closeContactForm]);

  return (
    <ContactFormContext.Provider value={value}>
      {children}
      {isOpen && <ContactFormModal prefill={prefill} onClose={closeContactForm} />}
    </ContactFormContext.Provider>
  );
}
