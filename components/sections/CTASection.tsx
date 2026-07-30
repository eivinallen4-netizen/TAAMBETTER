'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Button from '../ui/Button';
import ContactCTA from '@/app/components/ContactCTA';

interface CTASectionProps {
  title: string;
  description?: string;
  email?: string;
  variant?: 'default' | 'work';
}

export default function CTASection({
  title,
  description,
  email,
  variant = 'default',
}: CTASectionProps) {
  if (variant === 'work') {
    return (
      <section className="bg-taam-orange py-16">
        <Container>
          <div className="text-center">
            <Title as="h2" color="white">
              {title}
            </Title>
            {description && (
              <Text size="base" color="white" className="text-black/80 max-w-2xl mx-auto mb-8 mt-4">
                {description}
              </Text>
            )}
            <ContactCTA className="inline-block px-8 py-4 bg-black text-taam-orange font-black text-lg hover:bg-gray-900 transition">
              Get Free Recommendations
            </ContactCTA>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-taam-orange py-16">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Title as="h2" color="white" className="text-center md:text-left">
            {title}
          </Title>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {email && (
              <a href={`mailto:${email}`} className="text-sm font-semibold text-black/80 hover:text-black transition">
                {email}
              </a>
            )}
            <ContactCTA className="inline-block px-8 py-4 bg-taam-near-black text-taam-orange font-black text-lg hover:bg-gray-900 transition">
              Get Free Recommendations
            </ContactCTA>
          </div>
        </div>
      </Container>
    </section>
  );
}
