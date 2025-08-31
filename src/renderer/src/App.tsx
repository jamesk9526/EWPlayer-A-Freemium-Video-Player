import React, { useState } from 'react';
import './App.css';

const ipcRenderer = (window as any).require('electron').ipcRenderer;

interface Video {
  path: string;
  thumbnail: string;
  stats?: {
    size: number;
  };
}

// Simple lazy loading component
const LazyImage = ({ src, alt, className, width, height }: {
  src: string;
  alt: string;
  className: string;
  width: number;
  height: number;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
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

  const handleError = (e: any) => {
    const target = e.target;
    target.style.display = 'none';
  };

  return (
    <div ref={setRef} className={`lazy-image-container ${className}`}>
      {!shouldLoad && (
        <div className="lazy-placeholder">
          <div className="lazy-spinner"></div>
        </div>
      )}
      {shouldLoad && (
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

// Window control functions
const minimizeWindow = () => {
  ipcRenderer.invoke('window-minimize');
};

const maximizeWindow = () => {
  ipcRenderer.invoke('window-maximize');
};

const closeWindow = () => {
  ipcRenderer.invoke('window-close');
};

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectDirectory = async () => {
    try {
      setIsLoading(true);
      const dir = await ipcRenderer.invoke('select-directory');
      if (dir) {
        console.log('Selected directory:', dir);
        const vids = await ipcRenderer.invoke('scan-videos', dir);
        console.log('Received videos:', vids);
        const normalized = (Array.isArray(vids) ? vids : []).map((v: any) =>
          typeof v === 'string' ? { path: v, thumbnail: '' } : v
        );
        console.log('Normalized videos:', normalized.length, normalized[0]);
        setVideos(normalized);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playVideo = (path: string) => {
    setSelectedVideo(path);
  };

  const deleteVideo = async (path: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this video?');
    if (confirmed) {
      const success = await ipcRenderer.invoke('delete-video', path);
      if (success) {
        setVideos(videos.filter(v => v.path !== path));
        if (selectedVideo === path) {
          setSelectedVideo(null);
        }
      }
    }
  };

  const filteredVideos = videos.filter(video => 
    video.path && video.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">▶</div>
            <h1>VideoTube</h1>
          </div>
        </div>
        <div className="search-container">
          <input 
            type="text" 
            className="search-input"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="header-actions">
          <button className="browse-btn" onClick={selectDirectory}>Browse Files</button>
        </div>
        <div className="window-controls">
          <button className="window-btn minimize-btn" onClick={minimizeWindow}>−</button>
          <button className="window-btn maximize-btn" onClick={maximizeWindow}>□</button>
          <button className="window-btn close-btn" onClick={closeWindow}>×</button>
        </div>
      </header>
      <div className={`main-content ${selectedVideo ? 'with-video' : 'no-video'}`}>
        {selectedVideo ? (
          <>
            <div className="player-section">
              <div className="video-container">
                <video 
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
                    onClick={() => setSelectedVideo(null)}
                  >
                    ← Back to Library
                  </button>
                  <button 
                    className="control-btn danger"
                    onClick={() => deleteVideo(selectedVideo)}
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
                {filteredVideos.map((video, index) => {
                  const title = video.path ? video.path.split(/[\/\\]/).pop()?.replace(/\.[^/.]+$/, '') : 'Unknown Video';
                  const extension = video.path ? video.path.split('.').pop()?.toUpperCase() : '';
                  return (
                    <div key={index} className={`video-card ${selectedVideo === video.path ? 'selected' : ''}`} onClick={() => playVideo(video.path)} title={title}>
                      <LazyImage
                        src={video.thumbnail ? toFileUrl(video.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
                        alt={title || 'thumbnail'}
                        className="video-thumbnail"
                        width={320}
                        height={180}
                      />
                      <div className="card-content">
                        <div className="card-title" title={title}>{title}</div>
                        <div className="card-metadata">{extension} • Video File</div>
                        <div className="card-actions">
                          <button className="primary" onClick={(e) => {e.stopPropagation(); playVideo(video.path)}}>Play</button>
                          <button onClick={(e) => {e.stopPropagation(); deleteVideo(video.path)}}>Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="full-width-grid">
            {isLoading && <div className="loading">Loading videos...</div>}
            {!isLoading && videos.length === 0 && (
              <div className="empty-state">
                <p>No videos found. Click "Browse Files" to select a directory and get started.</p>
                <button className="browse-btn" onClick={selectDirectory}>Browse Files</button>
              </div>
            )}
            {!isLoading && videos.length > 0 && filteredVideos.length === 0 && (
              <div className="no-results">No videos match your search.</div>
            )}
            {filteredVideos.map((video, index) => {
              const title = video.path ? video.path.split(/[\/\\]/).pop()?.replace(/\.[^/.]+$/, '') : 'Unknown Video';
              const extension = video.path ? video.path.split('.').pop()?.toUpperCase() : '';
              return (
                <div key={index} className="video-card" onClick={() => playVideo(video.path)} title={title}>
                  <LazyImage
                    src={video.thumbnail ? toFileUrl(video.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
                    alt={title || 'thumbnail'}
                    className="video-thumbnail"
                    width={320}
                    height={180}
                  />
                  <div className="card-content">
                    <div className="card-title" title={title}>{title}</div>
                    <div className="card-metadata">{extension} • Video File</div>
                    <div className="card-actions">
                      <button className="primary" onClick={(e) => {e.stopPropagation(); playVideo(video.path)}}>Play</button>
                      <button onClick={(e) => {e.stopPropagation(); deleteVideo(video.path)}}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
