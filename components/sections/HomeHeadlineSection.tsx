import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import { ReactNode } from 'react';

interface HomeHeadlineSectionProps {
  headline: string;
  description: string;
}

export default function HomeHeadlineSection({ headline, description }: HomeHeadlineSectionProps) {
  return (
    <section className="bg-taam-orange">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end py-14 md:py-16">
          <Title as="h1" color="white" className="whitespace-pre-line">
            {headline}
          </Title>
          <Text size="lg" color="white" className="opacity-90 leading-relaxed">
            {description}
          </Text>
        </div>
      </Container>
    </section>
  );
}
