import React, { useState } from 'react';
import '../App.css';
import VideoCard from '../components/VideoCard';

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

interface LibraryProps {
  videos: Video[];
  filteredVideos: Video[];
  sortedVideos: Video[];
  userProfile: UserProfile | null;
  viewMode: 'grid';
  setViewMode: (mode: 'grid') => void;
  sortBy: 'name' | 'date' | 'size';
  setSortBy: (sort: 'name' | 'date' | 'size') => void;
  isLoading: boolean;
  searchTerm: string;
  onVideoSelect: (path: string) => void;
  onOpenDisc: () => void;
  onSelectDirectory: () => void;
  onOpenSingleFile: () => void;
  onShowInExplorer: (path: string) => void;
  onDeleteVideo: (path: string) => void;
  setVideos: (videos: Video[] | ((prevVideos: Video[]) => Video[])) => void;
  onUpdateContentType?: (path: string, contentType: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media') => void;
  cardSize?: 'small' | 'medium' | 'large' | 'extra-large' | 'giant' | 'massive';
  cardSpacing?: 'tight' | 'compact' | 'normal' | 'comfortable' | 'loose';
  currentPage?: string;
  saveSettings?: (settings: any) => Promise<void>;
  settings?: any;
}

const Library: React.FC<LibraryProps> = ({
  videos,
  filteredVideos,
  sortedVideos,
  userProfile,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  isLoading,
  searchTerm,
  onVideoSelect,
  onOpenDisc,
  onSelectDirectory,
  onOpenSingleFile,
  onShowInExplorer,
  onDeleteVideo,
  setVideos,
  onUpdateContentType,
  cardSize = 'medium',
  cardSpacing = 'normal',
  currentPage = 'home',
  saveSettings,
  settings
}) => {
  const [organizationMode, setOrganizationMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [showGridOptions, setShowGridOptions] = useState(false);

  // Debug: Log when cardSize changes
  React.useEffect(() => {
    console.log('Library component: cardSize prop changed to', cardSize);
  }, [cardSize]);

  // Debug: Log when settings changes
  React.useEffect(() => {
    console.log('Library component: settings prop changed, cardSize:', settings?.cardSize);
  }, [settings]);

  const toggleGridOptions = () => {
    setShowGridOptions(!showGridOptions);
  };

  const handleCardSizeChange = async (size: 'small' | 'medium' | 'large' | 'extra-large' | 'giant' | 'massive') => {
    if (saveSettings && settings) {
      console.log('Changing card size from', cardSize, 'to', size);
      await saveSettings({ ...settings, cardSize: size });
      console.log('Card size change saved');
    }
  };

  const handleCardSpacingChange = (spacing: 'tight' | 'compact' | 'normal' | 'comfortable' | 'loose') => {
    if (saveSettings && settings) {
      saveSettings({ ...settings, cardSpacing: spacing });
    }
  };

  const handleThumbnailQualityChange = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    if (saveSettings && settings) {
      saveSettings({ ...settings, thumbnailQuality: quality });
    }
  };

  const handleLayoutDensityChange = (density: 'comfortable' | 'compact' | 'dense') => {
    if (saveSettings && settings) {
      saveSettings({ ...settings, layoutDensity: density });
    }
  };

  const handleAnimationSpeedChange = (speed: 'off' | 'slow' | 'normal' | 'fast') => {
    if (saveSettings && settings) {
      saveSettings({ ...settings, animationSpeed: speed });
    }
  };

  const handleHoverEffectChange = (effect: 'none' | 'glow' | 'scale' | 'both') => {
    if (saveSettings && settings) {
      saveSettings({ ...settings, hoverEffect: effect });
    }
  };

  const toggleOrganizationMode = () => {
    setOrganizationMode(!organizationMode);
    setSelectedVideos(new Set());
  };

  const handleVideoSelect = (videoPath: string) => {
    if (organizationMode) {
      setSelectedVideos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(videoPath)) {
          newSet.delete(videoPath);
        } else {
          newSet.add(videoPath);
        }
        return newSet;
      });
    } else {
      onVideoSelect(videoPath);
    }
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === sortedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(sortedVideos.map(v => v.path)));
    }
  };

  const handleBulkContentTypeChange = (contentType: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media') => {
    selectedVideos.forEach(videoPath => {
      if (onUpdateContentType) {
        onUpdateContentType(videoPath, contentType);
      }
    });
    setSelectedVideos(new Set());
  };
  const getPageTitle = () => {
    switch (currentPage) {
      case 'tv':
        return 'TV Shows';
      case 'movies':
        return 'Movies';
      case 'my-list':
        return 'My List';
      case 'home':
      default:
        return userProfile ? `${userProfile.name}'s Video Library` : 'Video Library';
    }
  };

  const getPageStats = () => {
    const compatibleVideos = videos.filter(video => {
      const supportedExtensions = ['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'];
      const fileExtension = video.path.toLowerCase().substring(video.path.lastIndexOf('.'));
      return supportedExtensions.includes(fileExtension);
    });
    const totalCount = compatibleVideos.length;
    const filteredCount = sortedVideos.length;

    switch (currentPage) {
      case 'tv':
        return `${filteredCount} TV show${filteredCount !== 1 ? 's' : ''}`;
      case 'movies':
        return `${filteredCount} movie${filteredCount !== 1 ? 's' : ''}`;
      case 'my-list':
        return `${filteredCount} item${filteredCount !== 1 ? 's' : ''} in your list`;
      case 'home':
      default:
        return `${totalCount} video${totalCount !== 1 ? 's' : ''}`;
    }
  };

  const getVideoExtensions = () => {
    const supportedExtensions = ['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'];
    const extensions = new Set(videos
      .filter(video => {
        const fileExtension = video.path.toLowerCase().substring(video.path.lastIndexOf('.'));
        return supportedExtensions.includes(fileExtension);
      })
      .map(v => v.path.split('.').pop()?.toUpperCase())
      .filter(Boolean)
    );
    return Array.from(extensions);
  };

  const getSupportedExtensions = () => {
    return ['MP4', 'MKV', 'MOV', 'WMV', 'FLV', 'M2TS'];
  };

  const getIncompatibleCount = () => {
    const supportedExtensions = ['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'];
    return videos.filter(video => {
      const fileExtension = video.path.toLowerCase().substring(video.path.lastIndexOf('.'));
      return !supportedExtensions.includes(fileExtension);
    }).length;
  };

  return (
    <>
      <div className="library-header">
        <div className="library-header-top">
          <div className="library-info">
            <h2 className="library-title">{getPageTitle()}</h2>
            <div className="library-stats">
              <div className="stats-item">
                <span>📹</span>
                <span>{getPageStats()}</span>
              </div>
              {currentPage === 'home' && getVideoExtensions().length > 0 && (
                <div className="stats-item">
                  <span>📁</span>
                  <span>{getVideoExtensions().join(', ')}</span>
                </div>
              )}
              {currentPage === 'home' && getIncompatibleCount() > 0 && (
                <div className="stats-item warning" title={`${getIncompatibleCount()} incompatible, hidden`}>
                  <span>⚠️</span>
                </div>
              )}
            </div>
          </div>
          <div className="view-controls">
            <div className="view-toggle">
              <div className="grid-options-container">
                <button
                  className={`view-btn active`}
                  onClick={toggleGridOptions}
                  title="Grid options"
                >
                  <span>⊞</span> Grid Options
                </button>
              </div>
            </div>
            <div className="sort-dropdown">
              <select
                className="sort-btn"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                title="Sort videos by"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
            <button 
              className={`org-toggle-btn ${organizationMode ? 'active' : ''}`}
              onClick={toggleOrganizationMode}
              title={organizationMode ? "Exit organization mode" : "Enter organization mode"}
            >
              <span>📋</span> Organize
            </button>
          </div>
        </div>
      </div>
      <div className={`video-grid-container ${viewMode}-view card-size-${cardSize} card-spacing-${cardSpacing} layout-density-${settings?.layoutDensity || 'comfortable'} animation-speed-${settings?.animationSpeed || 'normal'} hover-effect-${settings?.hoverEffect || 'glow'}`}>
        {isLoading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading videos...</span>
          </div>
        )}
        {!isLoading && videos.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <h3>Welcome{userProfile ? `, ${userProfile.name}` : ''}!</h3>
            <p>Your video library is empty. Browse a directory or open a single file to get started.</p>
            <div className="supported-formats">
              <h4>Supported Formats:</h4>
              <p>{getSupportedExtensions().join(', ')}</p>
            </div>
            <div className="empty-state-actions">
              <button className="browse-btn" onClick={onSelectDirectory} title={userProfile ? `${userProfile.name}, browse your video folders` : "Browse video folders"}>Browse Folder</button>
              <button className="browse-btn secondary" onClick={onOpenSingleFile} title={userProfile ? `${userProfile.name}, open a single video file` : "Open a single video file"}>Open File</button>
              <button className="browse-btn secondary" onClick={onOpenDisc} title={userProfile ? `${userProfile.name}, open a DVD or CD` : "Open a DVD or CD"}>Open Disc</button>
            </div>
          </div>
        )}
        {!isLoading && videos.length > 0 && sortedVideos.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <span>No videos match your search.</span>
            {getIncompatibleCount() > 0 && (
              <div className="no-results-hint">
                <small>Note: {getIncompatibleCount()} incompatible video files are hidden. Check Settings to show all formats.</small>
              </div>
            )}
          </div>
        )}
        {sortedVideos.map((video, index) => (
          <VideoCard
            key={index}
            video={video}
            viewMode={viewMode}
            showQualityBadge={true}
            isSelected={selectedVideos.has(video.path)}
            showCheckbox={organizationMode}
            organizationMode={organizationMode}
            onVideoSelect={handleVideoSelect}
            onShowInExplorer={onShowInExplorer}
            onDeleteVideo={onDeleteVideo}
            onToggleFavorite={(path) => {
              // Toggle favorite status for the video
              setVideos(prevVideos => 
                prevVideos.map(video => 
                  video.path === path 
                    ? { ...video, isFavorite: !video.isFavorite } 
                    : video
                )
              );
              
              // Save favorites to settings
              if (saveSettings && settings) {
                const updatedVideos = videos.map(video => 
                  video.path === path 
                    ? { ...video, isFavorite: !video.isFavorite } 
                    : video
                );
                const favorites = updatedVideos
                  .filter(video => video.isFavorite)
                  .map(video => ({ path: video.path, addedAt: new Date().toISOString() }));
                
                saveSettings({ ...settings, favorites });
              }
            }}
            onUpdateContentType={onUpdateContentType}
            userProfile={userProfile}
          />
        ))}
      </div>
      {organizationMode && (
        <div className="organization-panel">
          <div className="organization-header">
            <h3>Organization Mode</h3>
            <div className="selection-info">
              {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
            </div>
            <div className="organization-actions">
              <button 
                className="org-btn secondary"
                onClick={handleSelectAll}
              >
                {selectedVideos.size === sortedVideos.length ? 'Deselect All' : 'Select All'}
              </button>
              <button 
                className="org-btn primary"
                onClick={toggleOrganizationMode}
              >
                Exit Organization
              </button>
            </div>
          </div>
          {selectedVideos.size > 0 && (
            <div className="bulk-actions">
              <span className="bulk-label">Apply content type to selected videos:</span>
              <div className="content-type-buttons">
                <button 
                  className="content-type-btn"
                  onClick={() => handleBulkContentTypeChange('movie')}
                  title="Mark as Movie"
                >
                  🎬 Movie
                </button>
                <button 
                  className="content-type-btn"
                  onClick={() => handleBulkContentTypeChange('tv-show')}
                  title="Mark as TV Show"
                >
                  📺 TV Show
                </button>
                <button 
                  className="content-type-btn"
                  onClick={() => handleBulkContentTypeChange('documentary')}
                  title="Mark as Documentary"
                >
                  📚 Documentary
                </button>
                <button 
                  className="content-type-btn"
                  onClick={() => handleBulkContentTypeChange('short')}
                  title="Mark as Short Film"
                >
                  🎭 Short
                </button>
                <button 
                  className="content-type-btn"
                  onClick={() => handleBulkContentTypeChange('music-video')}
                  title="Mark as Music Video"
                >
                  🎵 Music Video
                </button>
                <button 
                  className="content-type-btn"
                  onClick={() => handleBulkContentTypeChange('home-media')}
                  title="Mark as Home Media"
                >
                  🏠 Home Media
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {showGridOptions && (
        <div className="grid-options-modal-overlay">
          <div className="grid-options-modal-content">
            <div className="grid-options-header">
              <h3>Grid Options</h3>
              <button 
                className="close-options-btn"
                onClick={toggleGridOptions}
                title="Close options"
              >
                ×
              </button>
            </div>
            <div className="grid-option-section">
              <h4>Card Size</h4>
              <div className="option-buttons">
                <button 
                  className={`option-btn ${cardSize === 'small' ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange('small')}
                >
                  Small
                </button>
                <button 
                  className={`option-btn ${cardSize === 'medium' ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange('medium')}
                >
                  Medium
                </button>
                <button 
                  className={`option-btn ${cardSize === 'large' ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange('large')}
                >
                  Large
                </button>
                <button 
                  className={`option-btn ${cardSize === 'extra-large' ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange('extra-large')}
                >
                  Extra Large
                </button>
                <button 
                  className={`option-btn ${cardSize === 'giant' ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange('giant')}
                >
                  Giant
                </button>
                <button 
                  className={`option-btn ${cardSize === 'massive' ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange('massive')}
                >
                  Massive
                </button>
              </div>
            </div>
            <div className="grid-option-section">
              <h4>Card Spacing</h4>
              <div className="option-buttons">
                <button 
                  className={`option-btn ${cardSpacing === 'tight' ? 'active' : ''}`}
                  onClick={() => handleCardSpacingChange('tight')}
                >
                  Tight
                </button>
                <button 
                  className={`option-btn ${cardSpacing === 'compact' ? 'active' : ''}`}
                  onClick={() => handleCardSpacingChange('compact')}
                >
                  Compact
                </button>
                <button 
                  className={`option-btn ${cardSpacing === 'normal' ? 'active' : ''}`}
                  onClick={() => handleCardSpacingChange('normal')}
                >
                  Normal
                </button>
                <button 
                  className={`option-btn ${cardSpacing === 'comfortable' ? 'active' : ''}`}
                  onClick={() => handleCardSpacingChange('comfortable')}
                >
                  Comfortable
                </button>
                <button 
                  className={`option-btn ${cardSpacing === 'loose' ? 'active' : ''}`}
                  onClick={() => handleCardSpacingChange('loose')}
                >
                  Loose
                </button>
              </div>
            </div>
            <div className="grid-option-section">
              <h4>Thumbnail Quality</h4>
              <div className="option-buttons">
                <button 
                  className={`option-btn ${(settings?.thumbnailQuality || 'medium') === 'low' ? 'active' : ''}`}
                  onClick={() => handleThumbnailQualityChange('low')}
                >
                  Low
                </button>
                <button 
                  className={`option-btn ${(settings?.thumbnailQuality || 'medium') === 'medium' ? 'active' : ''}`}
                  onClick={() => handleThumbnailQualityChange('medium')}
                >
                  Medium
                </button>
                <button 
                  className={`option-btn ${(settings?.thumbnailQuality || 'medium') === 'high' ? 'active' : ''}`}
                  onClick={() => handleThumbnailQualityChange('high')}
                >
                  High
                </button>
                <button 
                  className={`option-btn ${(settings?.thumbnailQuality || 'medium') === 'ultra' ? 'active' : ''}`}
                  onClick={() => handleThumbnailQualityChange('ultra')}
                >
                  Ultra
                </button>
              </div>
            </div>
            <div className="grid-option-section">
              <h4>Layout Density</h4>
              <div className="option-buttons">
                <button 
                  className={`option-btn ${(settings?.layoutDensity || 'comfortable') === 'comfortable' ? 'active' : ''}`}
                  onClick={() => handleLayoutDensityChange('comfortable')}
                >
                  Comfortable
                </button>
                <button 
                  className={`option-btn ${(settings?.layoutDensity || 'comfortable') === 'compact' ? 'active' : ''}`}
                  onClick={() => handleLayoutDensityChange('compact')}
                >
                  Compact
                </button>
                <button 
                  className={`option-btn ${(settings?.layoutDensity || 'comfortable') === 'dense' ? 'active' : ''}`}
                  onClick={() => handleLayoutDensityChange('dense')}
                >
                  Dense
                </button>
              </div>
            </div>
            <div className="grid-option-section">
              <h4>Animation Speed</h4>
              <div className="option-buttons">
                <button 
                  className={`option-btn ${(settings?.animationSpeed || 'normal') === 'off' ? 'active' : ''}`}
                  onClick={() => handleAnimationSpeedChange('off')}
                >
                  Off
                </button>
                <button 
                  className={`option-btn ${(settings?.animationSpeed || 'normal') === 'slow' ? 'active' : ''}`}
                  onClick={() => handleAnimationSpeedChange('slow')}
                >
                  Slow
                </button>
                <button 
                  className={`option-btn ${(settings?.animationSpeed || 'normal') === 'normal' ? 'active' : ''}`}
                  onClick={() => handleAnimationSpeedChange('normal')}
                >
                  Normal
                </button>
                <button 
                  className={`option-btn ${(settings?.animationSpeed || 'normal') === 'fast' ? 'active' : ''}`}
                  onClick={() => handleAnimationSpeedChange('fast')}
                >
                  Fast
                </button>
              </div>
            </div>
            <div className="grid-option-section">
              <h4>Hover Effects</h4>
              <div className="option-buttons">
                <button 
                  className={`option-btn ${(settings?.hoverEffect || 'glow') === 'none' ? 'active' : ''}`}
                  onClick={() => handleHoverEffectChange('none')}
                >
                  None
                </button>
                <button 
                  className={`option-btn ${(settings?.hoverEffect || 'glow') === 'glow' ? 'active' : ''}`}
                  onClick={() => handleHoverEffectChange('glow')}
                >
                  Glow
                </button>
                <button 
                  className={`option-btn ${(settings?.hoverEffect || 'glow') === 'scale' ? 'active' : ''}`}
                  onClick={() => handleHoverEffectChange('scale')}
                >
                  Scale
                </button>
                <button 
                  className={`option-btn ${(settings?.hoverEffect || 'glow') === 'both' ? 'active' : ''}`}
                  onClick={() => handleHoverEffectChange('both')}
                >
                  Both
                </button>
              </div>
            </div>
            <div className="grid-options-footer">
              <button 
                className="reset-options-btn"
                onClick={() => {
                  if (saveSettings && settings) {
                    saveSettings({
                      ...settings,
                      cardSize: 'medium',
                      cardSpacing: 'normal',
                      thumbnailQuality: 'medium',
                      layoutDensity: 'comfortable',
                      animationSpeed: 'normal',
                      hoverEffect: 'glow'
                    });
                  }
                }}
                title="Reset all grid options to defaults"
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Library;
