import React, { useState, useEffect } from 'react';
import './ContentTypeModal.css';

interface Video {
  path: string;
  thumbnail: string;
  title?: string;
  contentType?: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media';
}

interface ContentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  selectedVideos: string[];
  onToggleVideoSelection: (videoPath: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onApplyContentType: (contentType: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media') => void;
}

const ContentTypeModal: React.FC<ContentTypeModalProps> = ({
  isOpen,
  onClose,
  videos,
  selectedVideos,
  onToggleVideoSelection,
  onSelectAll,
  onClearSelection,
  onApplyContentType
}) => {
  const [selectedContentType, setSelectedContentType] = useState<'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media'>('home-media');

  const contentTypeOptions = [
    { value: 'movie', label: '🎬 Movie', icon: '🎬', description: 'Feature films and movies' },
    { value: 'tv-show', label: '📺 TV Show', icon: '📺', description: 'Television series and episodes' },
    { value: 'documentary', label: '📚 Documentary', icon: '📚', description: 'Documentary films and series' },
    { value: 'short', label: '🎭 Short Film', icon: '🎭', description: 'Short films and clips' },
    { value: 'music-video', label: '🎵 Music Video', icon: '🎵', description: 'Music videos and performances' },
    { value: 'home-media', label: '🏠 Home Media', icon: '🏠', description: 'Personal videos and home recordings' }
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset to first selected video's content type or default
      const firstSelectedVideo = videos.find(v => selectedVideos.includes(v.path));
      if (firstSelectedVideo?.contentType) {
        setSelectedContentType(firstSelectedVideo.contentType);
      }
    }
  }, [isOpen, selectedVideos, videos]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyContentType(selectedContentType);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && selectedVideos.length > 0) {
      handleApply();
    }
  };

  return (
    <div className="content-type-modal-overlay" onClick={onClose}>
      <div className="content-type-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown} tabIndex={-1}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>Bulk Content Type Change</h2>
            <p className="modal-subtitle">Select videos and choose a content type to apply to all selected videos</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <div className="modal-body">
          <div className="selection-summary">
            <div className="selection-count">
              <span>{selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="selection-actions">
              <button className="selection-btn" onClick={onSelectAll}>
                Select All
              </button>
              <button className="selection-btn" onClick={onClearSelection}>
                Clear Selection
              </button>
            </div>
          </div>

          <div className="video-list">
            <h3>Select Videos to Update</h3>
            <div className="video-list-container">
              {videos.slice(0, 20).map((video) => (
                <div
                  key={video.path}
                  className={`video-item ${selectedVideos.includes(video.path) ? 'selected' : ''}`}
                  onClick={() => onToggleVideoSelection(video.path)}
                >
                  <div className="video-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.path)}
                      onChange={() => onToggleVideoSelection(video.path)}
                      aria-label={`Select ${video.title || video.path.split(/[/\\]/).pop()}`}
                    />
                  </div>
                  <div className="video-info">
                    <div className="video-title">
                      {video.title || video.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '')}
                    </div>
                    <div className="video-path">
                      {video.path.split(/[/\\]/).pop()}
                    </div>
                  </div>
                  <div className="current-type">
                    {contentTypeOptions.find(opt => opt.value === video.contentType)?.icon || '🏠'}
                  </div>
                </div>
              ))}
              {videos.length > 20 && (
                <div className="more-videos">
                  ... and {videos.length - 20} more videos
                </div>
              )}
            </div>
          </div>

          <div className="content-type-selection">
            <h3>Select Content Type</h3>
            <div className="content-type-grid">
              {contentTypeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`content-type-option ${selectedContentType === option.value ? 'selected' : ''}`}
                  onClick={() => setSelectedContentType(option.value as any)}
                  title={option.description}
                >
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-label">{option.label}</div>
                  <div className="option-description">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="apply-btn"
            onClick={handleApply}
            disabled={selectedVideos.length === 0}
          >
            Apply to {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentTypeModal;
