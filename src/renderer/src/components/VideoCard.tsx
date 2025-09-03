import React, { useState } from 'react';
import './VideoCard.css';

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
  title?: string;
  season?: number;
  episode?: number;
  year?: number;
  duration?: number; // in seconds
  resolution?: string; // e.g., "1080p", "4K"
  bitrate?: number; // in kbps
  codec?: string; // e.g., "H.264", "H.265"
  isFavorite?: boolean;
  lastWatched?: Date;
  genres?: string[]; // ewplayer-style genres
  rating?: string; // e.g., "PG-13", "R"
  director?: string;
  cast?: string[];
}

interface UserProfile {
  name: string;
  info: string;
  onboardingComplete: boolean;
}

// Enhanced lazy loading component with better error handling
const LazyImage = ({ src, alt, className, width, height }: {
  src: string;
  alt: string;
  className: string;
  width: number;
  height: number;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !shouldLoad) {
      setShouldLoad(true);
    }
  };

  const setRef = (element: HTMLDivElement | null) => {
    if (element && !shouldLoad) {
      const observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.1,
        rootMargin: '50px'
      });
      observer.observe(element);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div ref={setRef} className={`lazy-image-container ${className}`}>
      {!shouldLoad && (
        <div className="lazy-placeholder">
          <div className="lazy-spinner"></div>
          <span className="lazy-text">Loading...</span>
        </div>
      )}
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
        />
      )}
      {hasError && (
        <div className="lazy-error">
          <div className="error-icon">📷</div>
          <span className="error-text">No thumbnail</span>
        </div>
      )}
    </div>
  );
};

// Convert a filesystem path to a file:/// URL (Windows-safe)
const toFileUrl = (p?: string) => {
  if (!p) return '';
  // Ensure forward slashes and prefix with triple slash
  const normalized = p.replace(/\\/g, '/');
  const url = 'file:///' + normalized.replace(/^([A-Za-z]):/, '$1:');
  return encodeURI(url);
};

// Format file size
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Format duration
const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

interface VideoCardProps {
  video: Video;
  viewMode?: 'grid';
  isSelected?: boolean;
  showQualityBadge?: boolean;
  showCheckbox?: boolean;
  organizationMode?: boolean;
  onVideoSelect?: (path: string) => void;
  onShowInExplorer?: (path: string) => void;
  onDeleteVideo?: (path: string) => void;
  onToggleFavorite?: (path: string) => void;
  onUpdateContentType?: (path: string, contentType: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media') => void;
  onOpenContentTypeModal?: (videoPath: string) => void;
  userProfile?: UserProfile | null;
  className?: string;
  coverStyle?: 'horizontal' | 'vertical';
  layoutDensity?: 'comfortable' | 'compact' | 'dense';
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  viewMode = 'grid',
  isSelected = false,
  showQualityBadge = false,
  showCheckbox = false,
  organizationMode = false,
  onVideoSelect,
  onShowInExplorer,
  onDeleteVideo,
  onToggleFavorite,
  onUpdateContentType,
  onOpenContentTypeModal,
  userProfile,
  className = '',
  coverStyle = 'horizontal',
  layoutDensity = 'comfortable'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const title = video.title || (video.path ? video.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') : 'Unknown Video');

  const contentTypeOptions = [
    { value: 'movie', label: '🎬 Movie', icon: '🎬' },
    { value: 'tv-show', label: '📺 TV Show', icon: '📺' },
    { value: 'documentary', label: '📚 Documentary', icon: '📚' },
    { value: 'short', label: '🎭 Short Film', icon: '🎭' },
    { value: 'music-video', label: '🎵 Music Video', icon: '🎵' },
    { value: 'home-media', label: '🏠 Home Media', icon: '🏠' }
  ];

  const currentContentType = contentTypeOptions.find(option => option.value === video.contentType) || contentTypeOptions[5]; // Default to home-media

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onVideoSelect?.(video.path);
    }
  };

  const handleCardClick = () => {
    onVideoSelect?.(video.path);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`video-card ${viewMode}-style ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${coverStyle}-cover ${layoutDensity}-layout ${organizationMode ? 'organization-mode' : ''} ${className}`}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        if (window.api?.showToolsMenu) {
          window.api.showToolsMenu({ videoId: video.path });
        }
      }}
      title={title}
      tabIndex={onVideoSelect ? 0 : -1}
      role={onVideoSelect ? "button" : undefined}
      aria-label={onVideoSelect ? `Play ${title}` : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Enhanced thumbnail container */}
      <div className="video-thumbnail-container">
        <LazyImage
          src={video.thumbnail ? toFileUrl(video.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
          alt={title || 'thumbnail'}
          className="video-thumbnail"
          width={320}
          height={180}
        />

        {/* Selection checkbox overlay */}
        {showCheckbox && (
          <div className="selection-overlay">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onVideoSelect?.(video.path);
              }}
              className="video-checkbox"
              aria-label={`Select ${title}`}
            />
          </div>
        )}

        {/* Play overlay */}
        {!showCheckbox && (
          <div className="play-overlay">
            <div className="play-button">
              <span className="play-icon">▶</span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced card content with ewplayer styling */}
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title" title={title}>{title}</h3>
          {video.isFavorite !== undefined && (
            <button
              className={`favorite-btn ${video.isFavorite ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(video.path);
              }}
              title={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {video.isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        {/* ewplayer-style genre tags */}
        {video.genres && video.genres.length > 0 && (
          <ul className="movie-gen">
            {video.genres.slice(0, 3).map((genre, index) => (
              <li key={index}>{genre}</li>
            ))}
          </ul>
        )}

        {/* Enhanced metadata with ewplayer typography */}
        <div className="card-metadata">
          <div className="metadata-row">
            {video.year && (
              <div className="metadata-item">
                <span className="metadata-icon">📅</span>
                <span>{video.year}</span>
              </div>
            )}
            {video.rating && (
              <div className="metadata-item">
                <span className="metadata-icon">🎯</span>
                <span>{video.rating}</span>
              </div>
            )}
            {video.duration && (
              <div className="metadata-item">
                <span className="metadata-icon">⏱️</span>
                <span>{formatDuration(video.duration)}</span>
              </div>
            )}
          </div>

          <div className="metadata-row">
            {video.resolution && (
              <div className="metadata-item">
                <span className="metadata-icon">�</span>
                <span>{video.resolution}</span>
              </div>
            )}
            {video.stats?.size && (
              <div className="metadata-item">
                <span className="metadata-icon">💾</span>
                <span>{formatFileSize(video.stats.size)}</span>
              </div>
            )}
          </div>

          {video.season && video.episode && (
            <div className="metadata-item episode-info">
              <span className="metadata-icon">📺</span>
              <span>S{video.season}E{video.episode}</span>
            </div>
          )}

          {video.director && (
            <div className="metadata-item">
              <span className="metadata-icon">🎬</span>
              <span>Directed by {video.director}</span>
            </div>
          )}

          {video.cast && video.cast.length > 0 && (
            <div className="metadata-item">
              <span className="metadata-icon">🎭</span>
              <span>{video.cast.slice(0, 2).join(', ')}{video.cast.length > 2 ? '...' : ''}</span>
            </div>
          )}
        </div>

        {/* ewplayer-style watch button */}
        <button
          className="watch-btn"
          onClick={(e) => {
            e.stopPropagation();
            onVideoSelect?.(video.path);
          }}
          title={userProfile ? `${userProfile.name}, watch this video` : "Watch now"}
          aria-label={`Watch ${title}`}
        >
          <i>▶</i> Watch Now
        </button>
      </div>

      {/* Enhanced action buttons */}
      {(onVideoSelect || onShowInExplorer || onDeleteVideo || onToggleFavorite || onUpdateContentType) && (
        <div className="card-actions">
          {onVideoSelect && (
            <button
              className="action-btn primary"
              onClick={(e) => {
                e.stopPropagation();
                onVideoSelect(video.path);
              }}
              title={userProfile ? `${userProfile.name}, play this video` : "Play"}
              aria-label={`Play ${title}`}
            >
              ▶
            </button>
          )}
          {onToggleFavorite && (
            <button
              className={`action-btn ${video.isFavorite ? 'favorite-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(video.path);
              }}
              title={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {video.isFavorite ? '❤️' : '🤍'}
            </button>
          )}
          {onUpdateContentType && (
            <button
              className="action-btn content-type-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenContentTypeModal?.(video.path);
              }}
              title="Change content type"
              aria-label="Change content type"
            >
              {currentContentType.icon}
            </button>
          )}
          {onShowInExplorer && (
            <button
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onShowInExplorer(video.path);
              }}
              title={userProfile ? `${userProfile.name}, show this video in folder` : "Show in folder"}
              aria-label={`Show ${title} in folder`}
            >
              📁
            </button>
          )}
          {onDeleteVideo && (
            <button
              className="action-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteVideo(video.path);
              }}
              title={userProfile ? `${userProfile.name}, delete this video` : "Delete"}
              aria-label={`Delete ${title}`}
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* Enhanced progress bar */}
      {video.watchedProgress && video.watchedProgress > 0 && (
        <div
          className="progress-bar"
          role="progressbar"
          aria-label={`Watched ${video.watchedProgress}%`}
          aria-valuenow={video.watchedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill"
            data-progress={`${video.watchedProgress}%`}
          ></div>
          <div className="progress-glow"></div>
        </div>
      )}

      {/* Continue watching indicator */}
      {video.watchedProgress && video.watchedProgress > 0 && video.watchedProgress < 95 && (
        <div className="continue-indicator">
          <span>Continue</span>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
