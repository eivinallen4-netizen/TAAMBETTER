'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface VerticalVideoPlayerProps {
  videos?: string[];
  src?: string;
  alt?: string;
  poster?: string;
}

export default function VerticalVideoPlayer({ videos = [], src, alt = 'Video', poster }: VerticalVideoPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoList = videos.length > 0 ? videos : src ? [src] : [];

  useEffect(() => {
    if (videoList.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % videoList.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [videoList.length]);

  if (videoList.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex justify-center items-center gap-6 perspective" style={{ perspective: '1200px' }}>
        {videoList.map((video, index) => {
          const isActive = index === activeIndex;
          const offset = (index - activeIndex + videoList.length) % videoList.length;
          const isExiting = offset === videoList.length - 1;

          return (
            <motion.div
              key={index}
              layout
              initial={{ x: 0, scale: 0.75, opacity: 0.4, rotateY: -90 }}
              animate={{
                x: offset === 1 ? 192 : offset === videoList.length - 1 ? -192 : 0,
                scale: isActive ? 1 : 0.75,
                opacity: isActive ? 1 : 0.4,
                rotateY: isActive ? 0 : isExiting ? -90 : 0,
                zIndex: isActive ? 20 : 10,
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
              className="absolute flex-shrink-0"
              style={{ perspective: '1200px' }}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isActive ? 0 : isExiting ? -90 : 0 }}
                transition={{
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className={`
                  bg-black rounded-lg overflow-hidden w-56 h-auto
                  border-2 ${isActive ? 'border-[#F46325]' : 'border-gray-700'}
                  transition-colors duration-300
                `}
                style={{ perspective: '1200px' }}
              >
                <video
                  src={video}
                  poster={poster}
                  controls={isActive}
                  muted={!isActive}
                  autoPlay={isActive}
                  controlsList="nodownload"
                  className="w-full h-full object-cover"
                  onPlay={() => isActive && setIsPlaying(true)}
                  onPause={() => isActive && setIsPlaying(false)}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Indicator Dots */}
      {videoList.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {videoList.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-8 bg-[#F46325]' : 'w-2 bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
