import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';

interface Video {
  path: string;
  thumbnail: string;
  stats?: {
    size: number;
  };
  watchedProgress?: number; // 0-100
  contentType?: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media';
  category?: string;
  isPrivate?: boolean;
  isFavorite?: boolean;
  title?: string;
  season?: number;
  episode?: number;
  year?: number;
}

interface UserProfile {
  name: string;
  info: string;
  onboardingComplete: boolean;
}

// Convert a filesystem path to a file:/// URL (Windows-safe)
const toFileUrl = (p?: string) => {
  if (!p) return '';
  // Ensure forward slashes and prefix with triple slash
  const normalized = p.replace(/\\/g, '/');
  const url = 'file:///' + normalized.replace(/^([A-Za-z]):/, '$1:');
  return encodeURI(url);
};

interface PlayerProps {
  selectedVideo: string;
  videos: Video[];
  filteredVideos: Video[];
  userProfile: UserProfile | null;
  videoKey: number;
  onVideoSelect: (path: string) => void;
  onBackToLibrary: () => void;
  onDeleteVideo: (path: string) => void;
  onShowInExplorer: (path: string) => void;
}

const Player: React.FC<PlayerProps> = ({
  selectedVideo,
  videos,
  filteredVideos,
  userProfile,
  videoKey,
  onVideoSelect,
  onBackToLibrary,
  onDeleteVideo,
  onShowInExplorer
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    
    const resetHideTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isPlaying) {
      resetHideTimer();
    }

    return () => clearTimeout(hideTimer);
  }, [isPlaying]);

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setShowThumbnail(false);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Progress control
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Playback rate control
  const changePlaybackRate = () => {
    if (!videoRef.current) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    videoRef.current.playbackRate = nextRate;
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    // Update progress bar width using CSS custom property
    if (progressFillRef.current && duration > 0) {
      const percentage = (videoRef.current.currentTime / duration) * 100;
      progressFillRef.current.style.setProperty('--progress-width', `${percentage}%`);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.volume = volume;
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setShowThumbnail(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, toggleMute]);

  const currentVideo = videos.find(v => v.path === selectedVideo);
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="player-section fullwidth">
        <div className="custom-video-container" 
             onMouseEnter={() => setShowControls(true)}
             onMouseLeave={() => isPlaying && setShowControls(false)}>
          
          {/* Video Thumbnail */}
          {showThumbnail && currentVideo?.thumbnail && (
            <img 
              src={toFileUrl(currentVideo.thumbnail)}
              alt="Video thumbnail"
              className="video-thumbnail"
              onClick={togglePlay}
            />
          )}
          
          {/* Video Element */}
          <video
            ref={videoRef}
            key={videoKey}
            src={toFileUrl(selectedVideo)}
            className={`custom-video-player ${showThumbnail ? 'hidden' : 'visible'}`}
            poster={toFileUrl(currentVideo?.thumbnail)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onClick={togglePlay}
            aria-label="Video player"
          />

          {/* Custom Controls */}
          <div className={`custom-controls ${showControls ? 'show' : 'hide'}`}>
            {/* Progress Bar */}
            <div className="progress-container">
              <input
                ref={progressRef}
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={handleProgressChange}
                className="progress-slider"
                aria-label="Video progress"
                title="Video progress"
              />
              <div className="progress-bar-bg">
                <div 
                  ref={progressFillRef}
                  className="progress-bar-fill"
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="controls-row">
              {/* Left Controls */}
              <div className="controls-left">
                <button className="control-button" onClick={() => skipTime(-10)} title="Skip backward 10 seconds">
                  <i className="fas fa-backward"></i>
                </button>
                <button className="control-button play-pause" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <button className="control-button" onClick={() => skipTime(10)} title="Skip forward 10 seconds">
                  <i className="fas fa-forward"></i>
                </button>
              </div>

              {/* Center - Time Display */}
              <div className="time-display">
                <span className="current-time">{formatTime(currentTime)}</span>
                <span className="separator">/</span>
                <span className="duration">{formatTime(duration)}</span>
              </div>

              {/* Right Controls */}
              <div className="controls-right">
                <button className="control-button speed-btn" onClick={changePlaybackRate}>
                  {playbackRate}x
                </button>
                
                <div className="volume-container">
                  <button className="control-button" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                    <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    aria-label="Volume control"
                    title="Volume control"
                  />
                </div>

                <button className="control-button" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="video-info">
          <h2 className="video-title">
            {currentVideo?.title || currentVideo?.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Video'}
          </h2>
          <div className="video-meta">
            {currentVideo?.path.split('.').pop()?.toUpperCase()} • 
            {currentVideo?.contentType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} •
            {duration > 0 && ` ${formatTime(duration)}`}
          </div>
          <div className="video-controls">
            <button
              className="control-btn"
              onClick={onBackToLibrary}
            >
              ← Back to Library
            </button>
            <button
              className="control-btn secondary"
              onClick={() => onShowInExplorer(selectedVideo)}
            >
              📁 Show in Explorer
            </button>
            <button
              className="control-btn danger"
              onClick={() => onDeleteVideo(selectedVideo)}
            >
              🗑 Delete Video
            </button>
          </div>
          
          {/* Keyboard Shortcuts Help */}
          <div className="keyboard-shortcuts">
            <small>
              <strong>Keyboard shortcuts:</strong> Space (play/pause), ←→ (skip 10s), ↑↓ (volume), M (mute), F (fullscreen)
            </small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;
