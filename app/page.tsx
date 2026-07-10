import Hero from './components/Hero';
import siteContent from './content/siteContent.json';

export default function Home() {
  const content = siteContent;

  return (
    <div className="bg-[#111111] text-white">
      {/* Hero Section */}
      <Hero
        title={content.hero.home.title}
        subtitle={content.hero.home.subtitle}
        buttonText={content.hero.home.buttonText}
        videoSrc={content.hero.home.videoSrc}
      />

      {/* Bold Headline Section */}
      <section className="bg-[#F46325]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 whitespace-pre-line">
            {content.homepage.headline}
          </h1>
          <p className="text-xl max-w-3xl text-white/90 leading-relaxed">
            {content.homepage.description}
          </p>
        </div>
      </section>

      {/* Work Grid Section */}
      <section className="bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-5xl md:text-6xl font-black text-[#F46325] mb-12">WORK</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {content.projects.slice(0, 2).map((project) => (
              <div key={project.id} className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700 hover:border-[#F46325] transition group cursor-pointer overflow-hidden">
                {project.image && project.image !== '/placeholder-project.jpg' ? (
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center group-hover:text-[#F46325] transition">
                    <div className="text-sm font-bold text-[#F46325] mb-2">{project.title}</div>
                    <div className="text-gray-500">{project.category}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.projects.slice(2, 6).map((project) => (
              <div key={project.id} className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700 hover:border-[#FF9A66] transition group cursor-pointer overflow-hidden">
                {project.image && project.image !== '/placeholder-project.jpg' ? (
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center group-hover:text-[#FF9A66] transition">
                    <div className="text-xs font-bold text-[#FF9A66] mb-1">{project.title}</div>
                    <div className="text-xs text-gray-500">{project.category}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F46325] py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">{content.homepage.ctaText}</h2>
          <a href={`mailto:${content.contact.email}`} className="inline-block px-8 py-4 bg-[#111111] text-[#F46325] font-black text-lg hover:bg-gray-900 transition">
            GET IN TOUCH
          </a>
        </div>
      </section>

      {/* News Section */}
      <section className="bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-12">
            <span className="text-[#F46325]">NEWS &</span>
            <br />
            <span className="text-[#F46325]">UPDATES</span>
          </h2>

          <div className="space-y-8">
            {content.news.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-700 pb-8 group cursor-pointer hover:border-[#F46325] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#F46325] transition">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 mb-2">
                      {item.description}
                    </p>
                    <a href={item.link} className="text-sm text-[#F46325] font-semibold hover:underline">READ MORE →</a>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
