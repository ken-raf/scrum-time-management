'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Upload,
  Music,
  Link,
  X,
  Minimize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export const FloatingMediaPlayer = () => {
  const t = useTranslations();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string>('');
  const [, setMediaFile] = useState<File | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [youTubeId, setYouTubeId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved volume on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedVolume = localStorage.getItem('mediaPlayerVolume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (audioRef.current) {
        audioRef.current.volume = vol;
      }
    }
  }, []);

  useEffect(() => {
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    const updateTime = () => setCurrentTime(mediaElement.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
      // Ensure volume is applied when media loads
      mediaElement.volume = isMuted ? 0 : volume;
    };

    mediaElement.addEventListener('timeupdate', updateTime);
    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);

    // Set volume immediately if media is already loaded
    if (mediaElement.readyState >= 1) {
      mediaElement.volume = isMuted ? 0 : volume;
    }

    return () => {
      mediaElement.removeEventListener('timeupdate', updateTime);
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
    };
  }, [currentMedia, volume, isMuted, isVideo]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
      const isVideoFile = file.type.startsWith('video/');

      const url = URL.createObjectURL(file);
      setCurrentMedia(url);
      setMediaName(fileName);
      setMediaFile(file);
      setIsPlaying(false);
      setCurrentTime(0);
      setIsYouTube(false);
      setYouTubeId(null);
      setIsVideo(isVideoFile);
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      const url = urlInput.trim();
      let displayName = '';

      // Handle YouTube URLs - extract video ID and set up iframe
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
          setIsYouTube(true);
          setYouTubeId(videoId);
          setCurrentMedia(null); // Don't use media element for YouTube
          setIsVideo(true);
          displayName = 'YouTube Video';

          // Save YouTube info to localStorage
          localStorage.setItem('lastPlayedMedia', displayName);
          localStorage.setItem('lastPlayedMediaData', videoId);
          localStorage.setItem('lastPlayedMediaType', 'youtube');
          localStorage.setItem('lastPlayedIsVideo', 'true');
        } else {
          alert('Invalid YouTube URL');
          return;
        }
      } else {
        // Handle other URLs (SoundCloud, direct audio/video, etc.)
        setIsYouTube(false);
        setYouTubeId(null);

        let isVideoUrl = false;
        if (url.includes('soundcloud.com')) {
          displayName = 'SoundCloud Track';
          isVideoUrl = false;
        } else {
          // Extract filename from URL for direct media files
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1] || 'Online Media';
          displayName = fileName;

          // Try to detect if it's a video URL based on file extension
          const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
          isVideoUrl = videoExtensions.some(ext => url.toLowerCase().includes(ext));
        }

        setCurrentMedia(url);
        setIsVideo(isVideoUrl);
      }

      setMediaName(displayName);
      setMediaFile(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setShowUrlInput(false);
      setUrlInput('');
    }
  };

  const togglePlay = () => {
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (!mediaElement || !currentMedia) return;

    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stop = () => {
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    mediaElement.pause();
    mediaElement.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    const newTime = parseFloat(event.target.value);
    mediaElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);

    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.volume = isMuted ? 0 : newVolume;
    }

    // If volume is changed while muted, unmute
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      if (mediaElement) {
        mediaElement.volume = newVolume;
      }
    }

    // Save volume to localStorage
    localStorage.setItem('mediaPlayerVolume', newVolume.toString());
  };

  const toggleMute = () => {
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    if (isMuted) {
      mediaElement.volume = volume;
      setIsMuted(false);
    } else {
      mediaElement.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show if no media is loaded and not in expanded mode
  if (!currentMedia && !isYouTube && !isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none transition-colors cursor-pointer"
          title={t('media.openMusicPlayer')}
        >
          <Music size={20} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-80 max-w-[calc(100vw-2rem)]'
      }`}
      style={{
        // Responsive positioning for mobile
        right: window.innerWidth < 768 ? '1rem' : '1rem',
        bottom: window.innerWidth < 768 ? '1rem' : '1rem',
        maxWidth: window.innerWidth < 768 ? 'calc(100vw - 2rem)' : '20rem'
      }}
    >
      {/* Minimized State */}
      {isMinimized ? (
        <div className="w-full h-full flex items-center justify-center">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-4 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            {isPlaying ? (
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-600 rounded animate-pulse"></div>
              </div>
            ) : (
              isVideo ? (
                <div className="text-purple-600">🎬</div>
              ) : (
                <Music size={16} className="text-purple-600" />
              )
            )}
          </button>
        </div>
      ) : (
        <div className="p-3">
          {/* Header with Controls */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music size={16} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-800">{t('media.music')}</h3>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                title={t('media.minimize')}
              >
                <Minimize2 size={12} />
              </button>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  if (!currentMedia && !isYouTube) {
                    // Hide completely if no media
                  }
                }}
                className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                title={t('media.close')}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-purple-600 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <>
              {/* Action Buttons */}
              <div className="flex gap-1 mb-2 justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 focus:outline-none transition-colors cursor-pointer"
                  title={t('media.uploadAudioVideo')}
                >
                  <Upload size={12} />
                  {t('media.file')}
                </button>

                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 focus:outline-none transition-colors cursor-pointer"
                  title={t('media.addMusicUrl')}
                >
                  <Link size={12} />
                  {t('media.url')}
                </button>

              </div>

              {/* URL Input */}
              {showUrlInput && (
                <div className="mb-2">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={t('media.youtubeAudioUrl')}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUrlSubmit();
                        }
                        if (e.key === 'Escape') {
                          setShowUrlInput(false);
                          setUrlInput('');
                        }
                      }}
                    />
                    <button
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 transition-colors cursor-pointer"
                    >
                      {t('media.add')}
                    </button>
                    <button
                      onClick={() => {
                        setShowUrlInput(false);
                        setUrlInput('');
                      }}
                      className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Current Media Display */}
          {(currentMedia || isYouTube) && (
            <div className="mb-2">
              <div className="bg-purple-50 rounded px-2 py-1">
                <p className="text-xs text-purple-800 font-medium truncate">
                  {isYouTube ? '📺' : (isVideo ? '🎬' : '🎵')} {mediaName}
                </p>
              </div>
            </div>
          )}

          {/* YouTube Player */}
          {isYouTube && youTubeId && isExpanded && (
            <div className="mb-2">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded"
                  src={`https://www.youtube.com/embed/${youTubeId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
                  title={t('media.youtubeVideoPlayer')}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Media Elements - Always render for background playback */}
          {currentMedia && !isYouTube && !isVideo && (
            <audio ref={audioRef} src={currentMedia} preload="metadata" />
          )}

          {currentMedia && !isYouTube && isVideo && (
            <video
              ref={videoRef}
              src={currentMedia}
              preload="metadata"
              controls={isExpanded}
              className={isExpanded ? "w-full rounded mb-2" : ""}
              style={isExpanded ? { maxHeight: '200px' } : { display: 'none' }}
            />
          )}

          {/* Controls for Audio, or Video when not expanded */}
          {currentMedia && !isYouTube && (!isVideo || !isExpanded) && (
            <div className="space-y-2">
              {/* Play Controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={togglePlay}
                  disabled={!currentMedia}
                  className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button
                  onClick={stop}
                  disabled={!currentMedia}
                  className="bg-gray-600 text-white p-1.5 rounded-full hover:bg-gray-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Square size={14} />
                </button>

                {/* Volume Control - Inline */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={toggleMute}
                    className="text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={14} />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-mini"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              {isExpanded && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 w-8 text-center">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-mini"
                    style={{
                      background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100 || 0}%, #e5e7eb ${(currentTime / duration) * 100 || 0}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 w-8 text-center">
                    {formatTime(duration)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Simple Close Button for YouTube */}
          {isYouTube && isExpanded && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  setIsYouTube(false);
                  setYouTubeId(null);
                  setMediaName('');
                }}
                className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 focus:outline-none transition-colors cursor-pointer"
              >
                {t('media.closeVideo')}
              </button>
            </div>
          )}

          {/* Helper Text */}
          {!currentMedia && !isYouTube && isExpanded && (
            <div className="text-center">
              <p className="text-xs text-gray-400">
                {t('media.uploadFiles')}
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .slider-mini::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: 1px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .slider-mini::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: 1px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};