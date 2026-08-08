import Container from '@/components/ui/Container';
import Title from '@/components/ui/Title';
import Text from '@/components/ui/Text';

interface SimpleHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SimpleHeader({ title, subtitle }: SimpleHeaderProps) {
  return (
    <section className="bg-black text-white py-16 md:py-24">
      <Container>
        <Title as="h1" color="white" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {title}
        </Title>
        {subtitle && (
          <Text size="lg" color="gray-400" className="max-w-2xl">
            {subtitle}
          </Text>
        )}
      </Container>
    </section>
  );
}
