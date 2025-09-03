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
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);

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
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Playback rate control
  const changePlaybackRate = () => {
    if (!videoRef.current) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    videoRef.current.playbackRate = nextRate;
  };

  // Skip to beginning/end
  const skipToBeginning = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
  }, []);

  const skipToEnd = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = duration;
  }, [duration]);

  // Previous/Next video navigation
  const playPreviousVideo = useCallback(() => {
    const currentIndex = videos.findIndex(v => v.path === selectedVideo);
    if (currentIndex > 0) {
      const prevVideo = videos[currentIndex - 1];
      onVideoSelect(prevVideo.path);
    }
  }, [videos, selectedVideo, onVideoSelect]);

  const playNextVideo = useCallback(() => {
    const currentIndex = videos.findIndex(v => v.path === selectedVideo);
    if (currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      onVideoSelect(nextVideo.path);
    }
  }, [videos, selectedVideo, onVideoSelect]);

  // Loop toggle
  const toggleLoop = useCallback(() => {
    if (!videoRef.current) return;
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    videoRef.current.loop = newLoopState;
  }, [isLooping]);

  // Shuffle toggle
  const toggleShuffle = useCallback(() => {
    setIsShuffling(!isShuffling);
  }, [isShuffling]);

  // Picture-in-picture toggle
  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPictureInPicture(true);
      }
    } catch (error) {
      console.error('Picture-in-picture failed:', error);
    }
  }, []);

  // Screenshot capture
  const takeScreenshot = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  // Theater mode toggle
  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode(!isTheaterMode);
  }, [isTheaterMode]);

  // Settings toggle
  const toggleSettings = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings]);

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
        case 'Home':
          e.preventDefault();
          skipToBeginning();
          break;
        case 'End':
          e.preventDefault();
          skipToEnd();
          break;
        case 'PageUp':
          e.preventDefault();
          playPreviousVideo();
          break;
        case 'PageDown':
          e.preventDefault();
          playNextVideo();
          break;
        case 'l':
        case 'L':
          toggleLoop();
          break;
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            takeScreenshot();
          } else {
            toggleShuffle();
          }
          break;
        case 'p':
        case 'P':
          togglePictureInPicture();
          break;
        case 't':
        case 'T':
          toggleTheaterMode();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, toggleMute, toggleLoop, toggleShuffle, togglePictureInPicture, toggleTheaterMode, playNextVideo, playPreviousVideo, skipToBeginning, skipToEnd, takeScreenshot]);

  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const [shuffleCooldown, setShuffleCooldown] = useState(0);

  // Get video suggestions from library
  const getVideoSuggestions = useCallback(() => {
    // Filter out current video and get up to 6 suggestions
    const availableVideos = videos.filter(v => v.path !== selectedVideo);

    // Use seed for consistent randomization
    const seed = suggestionSeed;
    const shuffled = [...availableVideos].sort((a, b) => {
      const hashA = a.path.split('').reduce((hash, char) => hash + char.charCodeAt(0), seed);
      const hashB = b.path.split('').reduce((hash, char) => hash + char.charCodeAt(0), seed);
      return hashA - hashB;
    });

    // Return first 6 videos
    return shuffled.slice(0, 6);
  }, [videos, selectedVideo, suggestionSeed]);

  // Auto-shuffle suggestions every 45 seconds
  useEffect(() => {
    const shuffleInterval = setInterval(() => {
      setSuggestionSeed(prev => prev + 1);
      setShuffleCooldown(45); // Reset cooldown to 45 seconds
    }, 45000); // 45 seconds

    return () => clearInterval(shuffleInterval);
  }, []);

  // Countdown timer for shuffle button
  useEffect(() => {
    if (shuffleCooldown > 0) {
      const countdownTimer = setTimeout(() => {
        setShuffleCooldown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(countdownTimer);
    }
  }, [shuffleCooldown]);

  // Manual shuffle suggestions (with cooldown)
  const shuffleSuggestions = useCallback(() => {
    if (shuffleCooldown === 0) {
      setSuggestionSeed(prev => prev + Math.random());
      setShuffleCooldown(45); // Start 45-second cooldown
    }
  }, [shuffleCooldown]);

  const suggestions = getVideoSuggestions();

  // Handle suggestion click
  const handleSuggestionClick = useCallback((videoPath: string) => {
    onVideoSelect(videoPath);
  }, [onVideoSelect]);

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
                <button className="control-button" onClick={skipToBeginning} title="Skip to beginning">
                  <i className="fas fa-fast-backward"></i>
                </button>
                <button className="control-button" onClick={playPreviousVideo} title="Previous video">
                  <i className="fas fa-step-backward"></i>
                </button>
                <button className="control-button" onClick={() => skipTime(-10)} title="Skip backward 10 seconds">
                  <i className="fas fa-backward"></i>
                </button>
                <button className="control-button play-pause" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <button className="control-button" onClick={() => skipTime(10)} title="Skip forward 10 seconds">
                  <i className="fas fa-forward"></i>
                </button>
                <button className="control-button" onClick={playNextVideo} title="Next video">
                  <i className="fas fa-step-forward"></i>
                </button>
                <button className="control-button" onClick={skipToEnd} title="Skip to end">
                  <i className="fas fa-fast-forward"></i>
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
                <button className={`control-button ${isLooping ? 'active' : ''}`} onClick={toggleLoop} title={isLooping ? "Disable loop" : "Enable loop"}>
                  <i className="fas fa-redo"></i>
                </button>
                <button className={`control-button ${isShuffling ? 'active' : ''}`} onClick={toggleShuffle} title={isShuffling ? "Disable shuffle" : "Enable shuffle"}>
                  <i className="fas fa-random"></i>
                </button>
                <button className={`control-button ${isPictureInPicture ? 'active' : ''}`} onClick={togglePictureInPicture} title={isPictureInPicture ? "Exit picture-in-picture" : "Picture-in-picture"}>
                  <i className="fas fa-external-link-alt"></i>
                </button>
                <button className="control-button" onClick={takeScreenshot} title="Take screenshot">
                  <i className="fas fa-camera"></i>
                </button>
                <div className="settings-container">
                  <button className={`control-button ${showSettings ? 'active' : ''}`} onClick={toggleSettings} title="Settings">
                    <i className="fas fa-cog"></i>
                  </button>
                  {showSettings && (
                    <div className="settings-dropdown">
                      <div className="setting-item">
                        <label>Quality:</label>
                        <select value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)} title="Video quality">
                          <option value="auto">Auto</option>
                          <option value="1080p">1080p</option>
                          <option value="720p">720p</option>
                          <option value="480p">480p</option>
                          <option value="360p">360p</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={subtitlesEnabled}
                            onChange={(e) => setSubtitlesEnabled(e.target.checked)}
                          />
                          Subtitles
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <button className={`control-button ${isTheaterMode ? 'active' : ''}`} onClick={toggleTheaterMode} title={isTheaterMode ? "Exit theater mode" : "Theater mode"}>
                  <i className="fas fa-film"></i>
                </button>
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
              <strong>Keyboard shortcuts:</strong> Space (play/pause), ←→ (skip 10s), ↑↓ (volume), M (mute), F (fullscreen), 
              Home/End (beginning/end), PageUp/PageDown (prev/next video), L (loop), S (shuffle), P (picture-in-picture), 
              T (theater mode), Ctrl+S (screenshot)
            </small>
          </div>
        </div>

        {/* Video Suggestions Section */}
        <div className="video-suggestions">
          <div className="suggestions-header">
            <h3 className="suggestions-title">
              <i className="fas fa-lightbulb"></i>
              You Might Also Like
            </h3>
            <div className="suggestions-controls">
              <button 
                className={`shuffle-btn ${shuffleCooldown > 0 ? 'disabled' : ''}`} 
                onClick={shuffleSuggestions}
                disabled={shuffleCooldown > 0}
                title={shuffleCooldown > 0 ? `Shuffle available in ${shuffleCooldown}s` : 'Shuffle suggestions'}
              >
                <i className="fas fa-random"></i>
                {shuffleCooldown > 0 ? `Shuffle (${shuffleCooldown}s)` : 'Shuffle'}
              </button>
            </div>
          </div>

          <div className="suggestions-grid">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div 
                  key={suggestion.path} 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick(suggestion.path)}
                >
                  <div className="suggestion-thumbnail">
                    <img
                      src={toFileUrl(suggestion.thumbnail) || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMWEwYTBhIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGxhY2Vob2xkZXI8L3RleHQ+Cjwvc3ZnPg=="}
                      alt={suggestion.title || suggestion.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Video'}
                      className="suggestion-image"
                    />
                    <div className="suggestion-play-overlay">
                      <div className="suggestion-play-btn">
                        <i className="fas fa-play"></i>
                      </div>
                    </div>
                  </div>
                  <div className="suggestion-info">
                    <h4 className="suggestion-title">
                      {suggestion.title || suggestion.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Untitled Video'}
                    </h4>
                    <div className="suggestion-meta">
                      <span className="suggestion-duration">
                        <i className="fas fa-file-video"></i>
                        {suggestion.path.split('.').pop()?.toUpperCase() || 'VIDEO'}
                      </span>
                      {suggestion.stats?.size && (
                        <span className="suggestion-views">
                          <i className="fas fa-weight-hanging"></i>
                          {formatFileSize(suggestion.stats.size)}
                        </span>
                      )}
                      {suggestion.contentType && (
                        <span className="suggestion-match">
                          {suggestion.contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="suggestions-empty">
                <i className="fas fa-video-slash"></i>
                <h3>No Suggestions Available</h3>
                <p>Add more videos to your library to see suggestions here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;
