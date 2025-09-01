import React from 'react';
import './App.css';
import VideoCard from './VideoCard';

interface Video {
  path: string;
  thumbnail: string;
  stats?: {
    size: number;
  };
  watchedProgress?: number; // 0-100
  contentType?: 'movie' | 'tv-show' | 'home-media';
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
  viewMode: 'grid' | 'list' | 'compact';
  setViewMode: (mode: 'grid' | 'list' | 'compact') => void;
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
  cardSize?: 'small' | 'medium' | 'large' | 'extra-large';
  currentPage?: string;
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
  cardSize = 'medium',
  currentPage = 'home'
}) => {
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
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <span>⊞</span> Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <span>☰</span> List
              </button>
              <button
                className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
              >
                <span>⊡</span> Compact
              </button>
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
            <button className="browse-btn secondary" onClick={onOpenDisc} title={userProfile ? `${userProfile.name}, open a DVD or CD` : "Open a DVD or CD"}>Open Disc</button>
          </div>
        </div>
      </div>
      <div className={`video-grid-container ${viewMode}-view card-size-${cardSize}`}>
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
            onVideoSelect={onVideoSelect}
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
            }}
            userProfile={userProfile}
          />
        ))}
      </div>
    </>
  );
};

export default Library;
