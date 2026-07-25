import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteContent from '../../content/siteContent.json';
import ContactCTA from '../../components/ContactCTA';
import { getCtaCopy, getServicesForCategory } from '../../lib/cta';

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

  return (
    <div className="bg-black text-white min-h-screen">
      <div className={`bg-gradient-to-br ${colorClass} border-b-2`}>
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <Link
            href="/work"
            className="inline-block text-sm font-semibold text-white/80 hover:text-white transition mb-6"
          >
            ← BACK TO WORK
          </Link>
          <div className={`text-xs font-bold mb-2 ${textColorClass}`}>{project.category}</div>
          <h1 className="text-4xl md:text-5xl font-black">{project.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg aspect-video mb-10 flex items-center justify-center border border-gray-600 overflow-hidden">
          {project.image && project.image !== '/placeholder-project.jpg' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className={`text-sm font-bold mb-2 ${textColorClass}`}>PROJECT IMAGE</div>
              <div className="text-gray-500">High-quality project showcase</div>
            </div>
          )}
        </div>

        <p className="text-gray-300 mb-10 leading-relaxed text-lg">{project.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-bold text-[#F46325] mb-2">CHALLENGE</h4>
            <p className="text-sm text-gray-400">{project.challenge}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F46325] mb-2">SOLUTION</h4>
            <p className="text-sm text-gray-400">{project.solution}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F46325] mb-2">RESULTS</h4>
            <p className="text-sm text-gray-400">{project.results}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F46325] mb-2">TECHNOLOGIES</h4>
            <p className="text-sm text-gray-400">{project.technologies}</p>
          </div>
        </div>
      </div>

      <section className="bg-[#F46325] py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">START YOUR PROJECT</h2>
          <p className="text-base mb-8 text-black/80 max-w-2xl mx-auto">
            Tell us the problem you&apos;re trying to solve. We&apos;ll tell you straight whether we&apos;re the right team to solve it.
          </p>
          <ContactCTA
            services={getServicesForCategory(project.category)}
            className="inline-block px-8 py-4 bg-black text-[#F46325] font-black text-lg hover:bg-gray-900 transition"
          >
            {getCtaCopy(project.category)}
          </ContactCTA>
        </div>
      </section>
    </div>
  );
}
