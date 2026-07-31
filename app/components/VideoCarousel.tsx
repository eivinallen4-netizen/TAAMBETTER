'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { scaleIn } from '@/lib/motion-animations';

interface Video {
  type: string;
  src: string;
  title: string;
}

export default function VideoCarousel({ videos = [] }: { videos?: Video[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const displayVideos = videos.length > 0 ? videos : [
    { type: 'showcase', src: '', title: 'Vertical Video 01' },
    { type: 'states', src: '', title: 'Vertical Video 02' },
  ];

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayVideos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, displayVideos.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlay(false);
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      transition={{ delay: 0.4 }}
      className="relative w-full max-w-sm mx-auto"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Main Video Display */}
      <div className="relative w-full rounded-lg border border-gray-600 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 group hover:border-[#F46325] transition-colors duration-300 hover:shadow-lg hover:shadow-orange-500/20" style={{ aspectRatio: '9/16' }}>
        {displayVideos[activeIndex].src ? (
          <video
            src={displayVideos[activeIndex].src}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-sm font-bold mb-2 text-[#F46325]">{displayVideos[activeIndex].title}</div>
              <div className="text-xs text-gray-500">Video player {activeIndex + 1} / {displayVideos.length}</div>
            </div>
          </div>
        )}

        {/* Slide Transition Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-[#F46325] transition-all duration-300"
            style={{ width: `${((activeIndex + 1) / displayVideos.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex gap-2 justify-center mt-6">
        {displayVideos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === activeIndex
                ? 'w-8 h-2 bg-[#F46325]'
                : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500 font-light">
          {isAutoPlay ? '◉ Auto-playing' : 'Paused'}
        </p>
      </div>
    </motion.div>
  );
}
