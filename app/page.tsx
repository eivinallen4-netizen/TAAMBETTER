import Hero from './components/Hero';
import ContactCTA from './components/ContactCTA';
import siteContent from './content/siteContent.json';
import StatsBarSection from '@/components/sections/StatsBarSection';
import HomeHeadlineSection from '@/components/sections/HomeHeadlineSection';
import ServicesSection from '@/components/sections/ServicesSection';
import HomeWorkGridSection from '@/components/sections/HomeWorkGridSection';
import ProcessSection from '@/components/sections/ProcessSection';
import NewsSection from '@/components/sections/NewsSection';
// import BlogSection from '@/components/sections/BlogSection'; // Disabled temporarily
import CTASection from '@/components/sections/CTASection';
import { ScrollProgress } from '@/components/motion';

export default function Home() {
  const content = siteContent;
  const publishedProjects = content.projects.filter((p) => p.published !== false);

  return (
    <div className="bg-[#111111] text-white">
      <ScrollProgress />
      <Hero
        title={content.hero.home.title}
        subtitle={content.hero.home.subtitle}
        buttonText={content.hero.home.buttonText}
        videoSrc={content.hero.home.videoSrc}
        imageSrc={content.hero.home.imageSrc}
      />

      <StatsBarSection stats={content.stats} />

      <HomeHeadlineSection
        headline={content.homepage.headline}
        description={content.homepage.description}
      />

      <ServicesSection services={content.company.services} showMoreLink />

      {publishedProjects.length > 0 && (
        <HomeWorkGridSection projects={publishedProjects} />
      )}

      <ProcessSection steps={content.process} />

      <NewsSection items={content.news} />

      {/* <BlogSection blogs={content.blogs} limit={3} /> */}

      <CTASection
        title={content.homepage.ctaText}
        email={content.contact.email}
      />
    </div>
  );
}
