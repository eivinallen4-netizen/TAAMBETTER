'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Badge from '../ui/Badge';

interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

interface ProcessSectionProps {
  steps: ProcessStep[];
}

export default function ProcessSection({ steps }: ProcessSectionProps) {
  return (
    <section className="bg-black border-t border-gray-800">
      <Container>
        <div className="py-14 md:py-16">
          <Title as="h2" color="white" className="mb-10">
            HOW WE WORK
          </Title>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="border-t-2 border-taam-orange pt-4">
                <Badge>{step.step}</Badge>
                <Title as="h3" color="white" className="text-xl mt-2 mb-2">
                  {step.title}
                </Title>
                <Text size="sm" color="gray-400" className="leading-relaxed">
                  {step.description}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
