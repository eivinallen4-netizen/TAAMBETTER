'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handlePrevious = () => {
    const newIndex = (activeIndex - 1 + displayVideos.length) % displayVideos.length;
    setActiveIndex(newIndex);
    setIsAutoPlay(false);
  };

  const handleNext = () => {
    const newIndex = (activeIndex + 1) % displayVideos.length;
    setActiveIndex(newIndex);
    setIsAutoPlay(false);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [activeIndex]);

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
            ref={videoRef}
            src={displayVideos[activeIndex].src}
            autoPlay
            muted={isMuted}
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

        {/* Control Buttons Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            aria-label="Previous video"
            className="absolute left-4 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 transition text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="p-3 rounded-full bg-white/30 hover:bg-white/50 transition text-white z-20"
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            aria-label="Next video"
            className="absolute right-4 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 transition text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>

        {/* Mute Button - Always Visible */}
        <button
          onClick={handleMuteToggle}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 transition text-white"
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L21.714504,3.20539147 C21.5575352,2.10604706 20.6157225,1.4378282 19.5786078,1.77946707 C18.8891808,2.09337462 18.3182742,2.73514645 18.3182742,3.52063336 L18.3182742,8.50386211 C15.2347961,5.25268982 11.23,3.37915502 6.85409701,3.37915502 C2.97788975,3.37915502 -0.1,5.25268982 -0.1,9.16346272 C-0.1,13.0742356 2.97788975,14.9477704 6.85409701,14.9477704 C7.9912108,14.9477704 9.0282254,14.7906731 10.0652401,14.4770655 L10.0652401,9.94555826 C10.0652401,9.47526545 10.2224046,8.84524727 10.8902794,8.84524727 C11.39014,8.84524727 12.1003172,9.1599879 12.1003172,9.94555826 L12.1003172,17.1999816 C12.1003172,17.6702744 11.9432485,18.3002936 11.2553756,18.3002936 C10.755504,18.3002936 9.98915761,18.0431961 9.98915761,17.1999816 L9.98915761,16.1603181 C8.95213269,16.3175125 7.75151439,16.4746098 6.85409701,16.4746098 C5.86281388,16.4746098 4.81186207,16.3175125 3.9241896,16.0604151 L3.9241896,27.6575048 C3.9241896,28.4429918 4.13399899,29.5313276 5.13088286,30.1595463 C5.59624272,30.4742889 6.38892648,30.5853448 7.13399899,30.5 C7.62388957,30.5 8.29177045,30.3429026 8.7626768,29.8716105 L22.6563168,21.0741566 C23.4457439,20.442348 23.9166502,19.3540122 23.9166502,18.0429916 L23.9166502,7.79754325 C23.9166502,6.62565503 23.4457439,5.53631062 22.6563168,4.90449149 Z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>

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
    </motion.div>
  );
}
