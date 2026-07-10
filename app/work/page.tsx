'use client';

import { useState } from 'react';
import Hero from '../components/Hero';
import siteContent from '../content/siteContent.json';

interface ProjectItem {
  id: number;
  title: string;
  category: string;
  color: string;
  size: 'small' | 'large';
  image: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  technologies: string;
}

export default function Work() {
  const content = siteContent;
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

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

  return (
    <div className="bg-black text-white">
      {/* Hero Section with Masked Text */}
      <Hero
        title={content.hero.work.title}
        subtitle={content.hero.work.subtitle}
        buttonText={content.hero.work.buttonText}
      />

      {/* Portfolio Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {content.projects.map((project) => {
            const colorClass = colorClasses[project.color as keyof typeof colorClasses] || colorClasses.red;
            const textColorClass = textColorClasses[project.color as keyof typeof textColorClasses] || textColorClasses.red;
            const spanClass =
              project.size === 'large' ? 'col-span-2 md:col-span-2 row-span-2' : 'col-span-1';

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project as ProjectItem)}
                className={`${spanClass} bg-gradient-to-br ${colorClass} rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer group hover:shadow-2xl transition-all duration-300 border-2 relative overflow-hidden`}
              >
                {project.image && project.image !== '/placeholder-project.jpg' ? (
                  <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300" />
                <div className="relative z-10 text-center">
                  <div className={`text-sm font-bold mb-2 ${textColorClass}`}>
                    {project.category}
                  </div>
                  <h3 className="text-lg md:text-2xl font-black text-white group-hover:scale-110 transition duration-300">
                    {project.title}
                  </h3>
                  <div className={`text-xs mt-2 ${textColorClass} opacity-0 group-hover:opacity-100 transition`}>
                    VIEW DETAILS →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Project Details Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-2xl w-full p-8 border-2 border-red-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-4xl font-black mb-2">{selectedProject.title}</h2>
                <p className={`text-lg font-semibold ${textColorClasses[selectedProject.color]}`}>
                  {selectedProject.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-3xl font-bold text-gray-400 hover:text-red-600 transition"
              >
                ×
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg aspect-video mb-6 flex items-center justify-center border border-gray-600 overflow-hidden">
              {selectedProject.image && selectedProject.image !== '/placeholder-project.jpg' ? (
                <img src={selectedProject.image} alt={selectedProject.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className={`text-sm font-bold mb-2 ${textColorClasses[selectedProject.color]}`}>
                    PROJECT IMAGE
                  </div>
                  <div className="text-gray-500">High-quality project showcase</div>
                </div>
              )}
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {selectedProject.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-bold text-[#F46325] mb-2">CHALLENGE</h4>
                <p className="text-sm text-gray-400">{selectedProject.challenge}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F46325] mb-2">SOLUTION</h4>
                <p className="text-sm text-gray-400">{selectedProject.solution}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F46325] mb-2">RESULTS</h4>
                <p className="text-sm text-gray-400">{selectedProject.results}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F46325] mb-2">TECHNOLOGIES</h4>
                <p className="text-sm text-gray-400">{selectedProject.technologies}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedProject(null)}
              className="w-full px-6 py-3 bg-red-600 text-black font-black hover:bg-red-500 transition rounded-lg"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="bg-[#F46325] py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">START YOUR PROJECT</h2>
          <p className="text-lg mb-8 text-black/80 max-w-2xl mx-auto">
            Ready to create something amazing? Let's talk about how we can help bring your vision to life.
          </p>
          <a href={`mailto:${content.contact.email}`} className="inline-block px-8 py-4 bg-black text-[#F46325] font-black text-lg hover:bg-gray-900 transition">
            GET IN TOUCH
          </a>
        </div>
      </section>
    </div>
  );
}
