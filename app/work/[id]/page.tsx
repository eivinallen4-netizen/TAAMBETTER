import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteContent from '../../content/siteContent.json';
import ContactCTA from '../../components/ContactCTA';
import { getCtaCopy, getServicesForCategory } from '../../lib/cta';
import ScrollAnimations from '../../components/ScrollAnimations';
import VideoCarousel from '../../components/VideoCarousel';
import { ProjectHeroAnimated, ProjectBackLinkAnimated, ProjectLeftSectionAnimated, ProjectRightSectionAnimated, ProjectScrollAnimatedImage } from '../../components/ProjectAnimatedContent';

const colorClasses: Record<string, string> = {
  red: 'from-red-900 to-red-700 border-red-500',
  cyan: 'from-cyan-900 to-cyan-700 border-cyan-400',
  yellow: 'from-yellow-900 to-yellow-700 border-yellow-400',
  purple: 'from-purple-900 to-purple-700 border-purple-500',
  green: 'from-green-900 to-green-700 border-green-500',
  orange: 'from-orange-900 to-orange-700 border-orange-500',
  blue: 'from-blue-900 to-blue-700 border-blue-500',
  pink: 'from-pink-900 to-pink-700 border-pink-500',
};

const textColorClasses: Record<string, string> = {
  red: 'text-red-400',
  cyan: 'text-cyan-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  green: 'text-green-400',
  orange: 'text-orange-400',
  blue: 'text-blue-400',
  pink: 'text-pink-400',
};

export async function generateStaticParams() {
  return siteContent.projects
    .filter((project) => project.published !== false)
    .map((project) => ({ id: String(project.id) }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = siteContent.projects.find((p) => String(p.id) === id);

  if (!project || project.published === false) {
    notFound();
  }

  const colorClass = colorClasses[project.color] || colorClasses.red;
  const textColorClass = textColorClasses[project.color] || textColorClasses.red;
  const otherProjects = siteContent.projects
    .filter((p) => p.published !== false && String(p.id) !== id)
    .slice(0, 3);

  return (
    <ScrollAnimations>
      <div className="bg-black text-white min-h-screen overflow-hidden">
        {/* Hero with color background */}
        <ProjectHeroAnimated>
          <div className={`bg-gradient-to-br ${colorClass} border-b-2 border-opacity-30`}>
            <div className="mx-auto px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20 md:max-w-6xl md:pt-32 md:pb-24">
              <ProjectBackLinkAnimated>
                <Link
                  href="/work"
                  className="inline-block text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition mb-4 sm:mb-6"
                >
                  ← BACK TO WORK
                </Link>
              </ProjectBackLinkAnimated>
          </div>
        </div>

        {/* Video Carousel Section */}
        {project.videos && project.videos.length > 0 && (
          <div className="mx-auto px-4 relative -mt-20 sm:-mt-24 md:-mt-32 mb-16 sm:mb-20 md:mb-24 z-10 sm:px-6 md:max-w-6xl">
            <VideoCarousel videos={project.videos} />
          </div>
        )}

        {/* Editorial Info Section - Company & Overview */}
        <div className="mx-auto px-4 mb-12 sm:mb-16 md:mb-24 sm:px-6 md:max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Left: Agency */}
            <ProjectLeftSectionAnimated>
            <div
              id="company-section"
            >
              <div className="space-y-4">
                <div
                  className={`text-xs font-bold mb-2 sm:mb-3 ${textColorClass}`}
                >
                  {project.category}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-6">
                  {project.title}
                </h1>
                
              </div>
            </div>
            </ProjectLeftSectionAnimated>

            {/* Right: Overview & Impact */}
            <ProjectRightSectionAnimated>
            <div
              id="overview-section"
              className="flex flex-col justify-center"
            >
              <div className="border-t border-gray-700 pt-6 prose prose-invert max-w-none text-base sm:text-lg text-gray-300 leading-relaxed [&_p]:mb-4 [&_h3]:text-gray-200 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_strong]:text-gray-200 [&_em]:text-gray-400 [&_ul]:list-disc [&_ul]:ml-5 [&_li]:mb-2">
                <div
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              </div>
            </div>
            </ProjectRightSectionAnimated>
          </div>
        </div>
        </ProjectHeroAnimated>


        {/* Featured Video Section */}
        <div className="mx-auto px-4 mb-16 sm:mb-20 md:mb-32 sm:px-6 md:max-w-6xl">
          <div
            id="featured-video"
            data-scroll-animate="right"
            className="w-full bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg aspect-video flex items-center justify-center border border-gray-600 overflow-hidden hover:border-[#F46325] hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group"
          >
            {project.videos && project.videos.length > 0 && typeof project.videos[0] === 'object' && 'src' in project.videos[0] ? (
              <video
                src={(project.videos[0] as any).src}
                controls
                autoPlay
                muted
                loop
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center px-4">
                <div className="text-sm font-bold mb-2 text-[#F46325]">Featured</div>
                <div className="text-xs sm:text-sm text-gray-500">Hero video</div>
              </div>
            )}
          </div>
        </div>

        {/* Editorial Image Gallery */}
        {project.images && project.images.length > 0 ? (
          project.images.map((img: any, idx: number) => {
            const isLeft = (idx + 1) % 2 === 1;
            const direction = isLeft ? 'left' : 'right';
            return (
              <ProjectScrollAnimatedImage key={idx} direction={direction as 'left' | 'right'}>
                <div className={`mb-0 flex ${isLeft ? 'justify-start' : 'justify-end'} overflow-hidden`}>
                  <div className="w-full lg:w-4/5 xl:w-3/4 aspect-video flex items-center justify-center border border-gray-600 overflow-hidden hover:border-[#F46325] transition-all duration-300 group">
                    {img.src && img.src !== '/placeholder-project.jpg' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center px-4 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-gray-800 to-gray-700 w-full h-full flex items-center justify-center">
                        <div className="text-xs sm:text-sm text-gray-500">{img.alt}</div>
                      </div>
                    )}
                  </div>
                </div>
              </ProjectScrollAnimatedImage>
            );
          })
        ) : (
          [1, 2, 3, 4].map((idx) => {
            const isLeft = idx % 2 === 1;
            const direction = isLeft ? 'left' : 'right';
            return (
              <ProjectScrollAnimatedImage key={idx} direction={direction as 'left' | 'right'}>
                <div className={`mb-0 flex ${isLeft ? 'justify-start' : 'justify-end'} overflow-hidden`}>
                  <div className="w-full lg:w-4/5 xl:w-3/4 aspect-video flex items-center justify-center border border-gray-600 overflow-hidden hover:border-[#F46325] transition-all duration-300 group">
                    <div className="text-center px-4 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-gray-800 to-gray-700 w-full h-full flex items-center justify-center">
                      <div className="text-xs sm:text-sm text-gray-500">Image {idx}</div>
                    </div>
                  </div>
                </div>
              </ProjectScrollAnimatedImage>
            );
          })
        )}

        {/* More Work Section */}
        {otherProjects.length > 0 && (
          <div className="mx-auto px-4 mb-12 sm:mb-16 md:mb-24 sm:px-6 md:max-w-6xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12">
              MORE WORK
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {otherProjects.map((proj, idx) => (
                <Link key={proj.id} href={`/work/${proj.id}`}>
                  <div
                    className="group cursor-pointer animate-scale-in opacity-0"
                    style={{ animationDelay: `${1.6 + idx * 0.1}s` }}
                  >
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg aspect-square flex items-center justify-center border border-gray-600 overflow-hidden mb-3 sm:mb-4 group-hover:border-[#F46325] group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300">
                      {proj.image && proj.image !== '/placeholder-project.jpg' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="text-center px-4">
                          <div className="text-sm font-bold mb-2 text-[#F46325]">PROJECT</div>
                          <div className="text-xs sm:text-sm text-gray-500">{proj.title}</div>
                        </div>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-1 group-hover:text-[#F46325] transition-colors duration-300">
                      {proj.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">{proj.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <section className="bg-[#F46325] py-12 sm:py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent" style={{ backgroundSize: '200% 100%' }}></div>
          </div>
          <div className="mx-auto px-4 text-center relative z-10 sm:px-6 md:max-w-7xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4">
              START YOUR PROJECT
            </h2>
            <p className="text-xs sm:text-base mb-6 sm:mb-8 text-black/80 max-w-2xl mx-auto leading-relaxed">
              Tell us the problem you&apos;re trying to solve. We&apos;ll tell you straight whether we&apos;re the right team to solve it.
            </p>
            <div>
              <ContactCTA
                services={getServicesForCategory(project.category)}
                className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-black text-[#F46325] font-black text-sm sm:text-lg hover:bg-gray-900 hover:shadow-lg hover:shadow-black/50 transition-all duration-300 hover:scale-105 transform"
              >
                {getCtaCopy(project.category)}
              </ContactCTA>
            </div>
          </div>
        </section>
      </div>
    </ScrollAnimations>
  );
}
