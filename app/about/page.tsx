import type { Metadata } from 'next';
import SimpleHeader from '../components/SimpleHeader';
import siteContent from '../content/siteContent.json';
import { getServiceInfo } from '../lib/services';
import StatsBarSection from '@/components/sections/StatsBarSection';
import Container from '@/components/ui/Container';
import Title from '@/components/ui/Title';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import Badge from '@/components/ui/Badge';
import CTASection from '@/components/sections/CTASection';

export const metadata: Metadata = {
  title: "About TAAM | Content Marketing Agency",
  description: "Learn about TAAM's unified team approach to content marketing. 9+ years delivering real results for high-performance businesses with 120+ projects delivered.",
  openGraph: {
    title: "About TAAM | Our Story & Team",
    description: "Discover how TAAM's unified content marketing team delivers real results for high-performance businesses.",
    type: "website",
    images: [
      {
        url: "/og-about.png",
        width: 1200,
        height: 630,
        alt: "About TAAM",
      },
    ],
  },
  alternates: {
    canonical: "https://taambetter.com/about",
  },
};

export default function About() {
  const content = siteContent;
  return (
    <div className="bg-black text-white">
      <SimpleHeader
        title={content.hero.about.title}
        subtitle={content.hero.about.subtitle}
      />

      <StatsBarSection stats={content.stats} />

      <section className="bg-[#F46325]">
        <Container className="py-14">
          <Title as="h1" color="white">
            {content.company.tagline.toUpperCase()}
          </Title>
        </Container>
      </section>

      <section className="bg-black">
        <Container className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <Heading as="h2" color="white" className="mb-4">
                Who We Are
              </Heading>
              <Text color="gray-400" className="leading-relaxed">
                {content.company.description}
              </Text>
            </div>
            <div>
              <Heading as="h2" color="white" className="mb-4">
                What We Do
              </Heading>
              <Text color="gray-400" className="leading-relaxed mb-4">
                We specialize in {content.company.services.join(', ').toLowerCase()}.
              </Text>
              <Text color="gray-400" className="leading-relaxed">
                Every project is scoped with a clear challenge, a specific solution, and a way to
                measure whether it worked — no vague "brand awareness" hand-waving.
              </Text>
            </div>
          </div>

          <div className="mb-16">
            <Heading as="h2" color="white" className="mb-8">
              How We Work
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {content.process.map((step) => (
                <div key={step.step} className="border-t-2 border-[#F46325] pt-4">
                  <Badge>{step.step}</Badge>
                  <Heading as="h3" color="white" className="text-lg mt-2 mb-2">
                    {step.title}
                  </Heading>
                  <Text size="sm" color="gray-400" className="leading-relaxed">
                    {step.description}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          {/* Team section - commented out until team data is added to siteContent.json
          <div className="mb-16">
            <Heading as="h2" color="white" className="mb-8">
              Our Team
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.team?.map((member, index) => {
                const direction = index % 2 === 0 ? 'left' : 'right';
                return (
                <div key={member.id}>
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700 mb-3 overflow-hidden">
                    {member.image && member.image !== '/placeholder-person.jpg' ? (
                      <img src={member.image} alt={member.name} data-scroll-animate={direction} className="w-full h-full object-cover" />
                    ) : (
                      <Text size="sm" color="gray-600">{member.name}</Text>
                    )}
                  </div>
                  <Heading as="h3" color="white" className="text-lg">
                    {member.name}
                  </Heading>
                  <Text size="sm" color="white" className="text-[#F46325] font-semibold mb-2">
                    {member.role}
                  </Text>
                  <Text size="sm" color="gray-400" className="leading-relaxed">
                    {member.bio}
                  </Text>
                </div>
              );
              })}
            </div>
          </div>
          */}

          <div className="bg-gray-900 rounded-lg p-8 md:p-10">
            <Heading as="h2" color="white" className="mb-8">
              Our Services
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {content.company.services.map((service, idx) => {
                const info = getServiceInfo(service);
                return (
                  <div key={service} className="flex gap-4">
                    <Badge className="shrink-0">{String(idx + 1).padStart(2, '0')}</Badge>
                    <div>
                      <Heading as="h3" color="orange" className="text-lg mb-1">
                        {info.name}
                      </Heading>
                      <Text size="sm" color="gray-400" className="leading-relaxed">
                        {info.description}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <CTASection title="READY TO STOP PAYING FOR EXCUSES?" variant="default" />
    </div>
  );
}
