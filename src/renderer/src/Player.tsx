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
  return (
    <>
      <div className="player-section">
        <div className="video-container">
          <video
            key={videoKey}
            src={toFileUrl(selectedVideo)}
            controls
            className="video-player"
            poster={toFileUrl(videos.find(v => v.path === selectedVideo)?.thumbnail)}
            autoPlay
          />
        </div>
        <div className="video-info">
          <h2 className="video-title">
            {videos.find(v => v.path === selectedVideo)?.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Video'}
          </h2>
          <div className="video-meta">
            {videos.find(v => v.path === selectedVideo)?.path.split('.').pop()?.toUpperCase()} •
            Video File
          </div>
          <div className="video-controls">
            <button
              className="control-btn"
              onClick={onBackToLibrary}
            >
              ← Back to Library
            </button>
            <button
              className="control-btn danger"
              onClick={() => onDeleteVideo(selectedVideo)}
            >
              🗑 Delete Video
            </button>
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Up Next</h3>
          <span className="video-count">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="video-grid">
          {filteredVideos.map((video, index) => (
            <VideoCard
              key={index}
              video={video}
              isSelected={selectedVideo === video.path}
              showQualityBadge={false}
              onVideoSelect={onVideoSelect}
              onShowInExplorer={onShowInExplorer}
              onDeleteVideo={onDeleteVideo}
              userProfile={userProfile}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Player;
