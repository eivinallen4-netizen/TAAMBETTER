import Hero from '../components/Hero';
import StatsBar from '../components/StatsBar';
import siteContent from '../content/siteContent.json';
import { getServiceInfo } from '../lib/services';

export default function About() {
  const content = siteContent;
  return (
    <div className="bg-black text-white">
      <Hero
        title={content.hero.about.title}
        subtitle={content.hero.about.subtitle}
        buttonText={content.hero.about.buttonText}
      />

      <StatsBar stats={content.stats} />

      {/* Bold Headline */}
      <section className="bg-[#F46325]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            {content.company.tagline.toUpperCase()}
          </h1>
        </div>
      </section>

      {/* About Content */}
      <section className="bg-black">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-2xl font-black mb-4">Who We Are</h2>
              <p className="text-gray-300 leading-relaxed">
                {content.company.description}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-black mb-4">What We Do</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We specialize in {content.company.services.join(', ').toLowerCase()}.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Every project is scoped with a clear challenge, a specific solution, and a way to
                measure whether it worked — no vague "brand awareness" hand-waving.
              </p>
            </div>
          </div>

          {/* Process */}
          <div className="mb-16">
            <h2 className="text-2xl font-black mb-8">How We Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {content.process.map((step) => (
                <div key={step.step} className="border-t-2 border-[#F46325] pt-4">
                  <div className="text-sm font-black text-[#F46325] mb-2">{step.step}</div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-black mb-8">Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.team.map((member) => (
                <div key={member.id}>
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700 mb-3 overflow-hidden">
                    {member.image && member.image !== '/placeholder-person.jpg' ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-600 text-sm">{member.name}</div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-[#F46325] font-semibold text-sm mb-2">{member.role}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-gray-900 rounded-lg p-8 md:p-10">
            <h2 className="text-2xl font-black mb-8">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {content.company.services.map((service, idx) => {
                const info = getServiceInfo(service);
                return (
                  <div key={service} className="flex gap-4">
                    <div className="text-sm font-black text-[#F46325] shrink-0">{String(idx + 1).padStart(2, '0')}</div>
                    <div>
                      <h3 className="text-lg font-black text-[#F46325] mb-1">{info.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F46325] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="text-3xl md:text-4xl font-black text-center md:text-left">READY TO DO BIG THINGS?</h2>
          <a href={`mailto:${content.contact.email}`} className="inline-block px-8 py-4 bg-black text-[#F46325] font-black text-lg hover:bg-gray-900 transition shrink-0">
            LET&apos;S TALK
          </a>
        </div>
      </section>
    </div>
  );
}
