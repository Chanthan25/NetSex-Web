import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward, SkipBack } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualityLevels(hls!.levels);
        video.play();
        setIsPlaying(true);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play();
        setIsPlaying(true);
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (duration && !isNaN(duration)) {
        const current = (videoRef.current.currentTime / duration) * 100;
        if (!isNaN(current)) {
          setProgress(current);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (duration && !isNaN(duration)) {
        const time = (parseFloat(e.target.value) / 100) * duration;
        videoRef.current.currentTime = time;
        setProgress(parseFloat(e.target.value));
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center group"
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={handleProgress}
        onClick={togglePlay}
      />

      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Center Play/Pause Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${!isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
          <Play className="w-16 h-16 fill-current" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 appearance-none cursor-pointer mb-6 accent-red-600"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={togglePlay} className="hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
            </button>
            <div className="flex items-center gap-4 group/vol">
              <button onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
              </button>
              <input 
                type="range" 
                min="0" max="1" step="0.1" 
                value={volume || 0} 
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (videoRef.current) videoRef.current.volume = v;
                }}
                className="w-0 group-hover/vol:w-24 transition-all accent-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group/quality">
              <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                <Settings className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest">Quality</span>
              </button>
              <div className="absolute bottom-full right-0 mb-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-2 opacity-0 group-hover/quality:opacity-100 transition-opacity pointer-events-none group-hover/quality:pointer-events-auto min-w-[120px]">
                {qualityLevels.map((level, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentQuality(i)}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 rounded transition-colors ${currentQuality === i ? 'text-red-500 font-bold' : ''}`}
                  >
                    {level.height}p
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentQuality(-1)}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 rounded transition-colors ${currentQuality === -1 ? 'text-red-500 font-bold' : ''}`}
                >
                  Auto
                </button>
              </div>
            </div>
            <button onClick={() => videoRef.current?.requestFullscreen()}>
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
