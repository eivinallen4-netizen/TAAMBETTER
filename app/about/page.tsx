import Hero from '../components/Hero';
import siteContent from '../content/siteContent.json';

export default function About() {
  const content = siteContent;
  return (
    <div className="bg-black text-white">
      {/* Hero Section with Masked Text */}
      <Hero
        title={content.hero.about.title}
        subtitle={content.hero.about.subtitle}
        buttonText={content.hero.about.buttonText}
      />

      {/* Bold Headline */}
      <section className="bg-[#F46325]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            {content.company.tagline.toUpperCase()}
          </h1>
        </div>
      </section>

      {/* About Content */}
      <section className="bg-black">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div>
              <h2 className="text-3xl font-black mb-6">Who We Are</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {content.company.description}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-black mb-6">What We Do</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                We specialize in {content.company.services.join(', ').toLowerCase()}.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Every project is an opportunity to create something unforgettable.
                We approach challenges with fresh perspectives and innovative solutions.
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-black mb-12">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.team.map((member) => (
                <div key={member.id} className="text-center">
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700 mb-4 overflow-hidden">
                    {member.image && member.image !== '/placeholder-person.jpg' ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-500">{member.name}</div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-[#F46325] font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-400">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values Section */}
          <div className="bg-gray-900 rounded-lg p-12">
            <h2 className="text-4xl font-black mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {content.company.services.map((service) => (
                <div key={service}>
                  <h3 className="text-2xl font-black text-[#F46325] mb-2">{service}</h3>
                  <p className="text-gray-400">Delivering excellence in {service.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F46325] py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">READY TO DO BIG THINGS?</h2>
          <a href={`mailto:${content.contact.email}`} className="inline-block px-8 py-4 bg-black text-[#F46325] font-black text-lg hover:bg-gray-900 transition">
            LET'S TALK
          </a>
        </div>
      </section>
    </div>
  );
}
