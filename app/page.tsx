import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import ContactCTA from './components/ContactCTA';
import siteContent from './content/siteContent.json';
import { getServiceInfo } from './lib/services';

export default function Home() {
  const content = siteContent;
  const publishedProjects = content.projects.filter((p) => p.published !== false);

  return (
    <div className="bg-[#111111] text-white">
      <Hero
        title={content.hero.home.title}
        subtitle={content.hero.home.subtitle}
        buttonText={content.hero.home.buttonText}
        videoSrc={content.hero.home.videoSrc}
        imageSrc={content.hero.home.imageSrc}
      />

      <StatsBar stats={content.stats} />

      {/* Bold Headline Section */}
      <section className="bg-[#F46325]">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <h1 className="text-4xl md:text-6xl font-black leading-tight whitespace-pre-line">
              {content.homepage.headline}
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              {content.homepage.description}
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-[#111111] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white">WHAT WE DO</h2>
            <a href="/about" className="text-sm font-semibold text-[#F46325] hover:underline hidden sm:inline">
              MORE ABOUT US →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-gray-800">
            {content.company.services.map((service, idx) => {
              const info = getServiceInfo(service);
              return (
                <div key={service} className="bg-[#111111] p-6 hover:bg-gray-900 transition">
                  <div className="text-xs font-black text-[#F46325] mb-3">{String(idx + 1).padStart(2, '0')}</div>
                  <h3 className="text-lg font-bold mb-2">{info.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Work Grid Section */}
      {publishedProjects.length > 0 && (
      <section className="bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-[#F46325]">SELECTED WORK</h2>
            <a href="/work" className="text-sm font-semibold text-[#F46325] hover:underline">
              ALL PROJECTS →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {publishedProjects.slice(0, 2).map((project) => (
              <a
                key={project.id}
                href="/work"
                className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-gray-700 hover:border-[#F46325] transition group cursor-pointer overflow-hidden relative flex flex-col justify-end p-5"
              >
                {project.image && project.image !== '/placeholder-project.jpg' && (
                  <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="relative z-10">
                  <div className="text-xs font-bold text-[#F46325] uppercase tracking-wide mb-1">{project.category}</div>
                  <div className="text-xl font-black text-white mb-1">{project.title}</div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition line-clamp-2">{project.description}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {publishedProjects.slice(2, 6).map((project) => (
              <a
                key={project.id}
                href="/work"
                className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-gray-700 hover:border-[#FF9A66] transition group cursor-pointer overflow-hidden relative flex flex-col justify-end p-3"
              >
                {project.image && project.image !== '/placeholder-project.jpg' && (
                  <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-[#FF9A66] uppercase tracking-wide mb-1">{project.category}</div>
                  <div className="text-sm font-black text-white leading-tight">{project.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Process Section */}
      <section className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-10">HOW WE WORK</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.process.map((step) => (
              <div key={step.step} className="border-t-2 border-[#F46325] pt-4">
                <div className="text-sm font-black text-[#F46325] mb-2">{step.step}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8">NEWS &amp; UPDATES</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {content.news.map((item) => (
              <a
                key={item.id}
                href={item.link}
                className="border-b border-gray-800 pb-6 group hover:border-[#F46325] transition flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-base font-bold mb-1 group-hover:text-[#F46325] transition">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap pt-1">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F46325] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="text-3xl md:text-4xl font-black text-center md:text-left">{content.homepage.ctaText}</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <a href={`mailto:${content.contact.email}`} className="text-sm font-semibold text-black/80 hover:text-black transition">
              {content.contact.email}
            </a>
            <ContactCTA className="inline-block px-8 py-4 bg-[#111111] text-[#F46325] font-black text-lg hover:bg-gray-900 transition">
              Get Free Recommendations
            </ContactCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
