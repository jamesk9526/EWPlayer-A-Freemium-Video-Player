import React, { useState } from 'react';
import './App.css';

const ipcRenderer = (window as any).require('electron').ipcRenderer;

interface Video {
  path: string;
  thumbnail: string;
  stats?: {
    size: number;
  };
  watchedProgress?: number; // 0-100
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
  const [videoKey, setVideoKey] = useState(0); // For triggering video element re-animation
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');

  const playVideo = React.useCallback((path: string) => {
    if (selectedVideo !== path) {
      // Trigger animation for new video
      setVideoKey(prev => prev + 1);
    }
    setSelectedVideo(path);
  }, [selectedVideo]);

  // Handle file opening from Windows file associations
  React.useEffect(() => {
    const handleFileOpen = (event: any, filePath: string) => {
      if (filePath && typeof filePath === 'string') {
        // Create a video object and play it
        const video: Video = {
          path: filePath,
          thumbnail: ''
        };
        setVideos(prev => {
          const exists = prev.find(v => v.path === filePath);
          if (!exists) {
            return [...prev, video];
          }
          return prev;
        });
        playVideo(filePath);
      }
    };

    ipcRenderer.on('open-file', handleFileOpen);

    return () => {
      ipcRenderer.removeListener('open-file', handleFileOpen);
    };
  }, [playVideo]);

  const selectDirectory = async () => {
    try {
      setIsLoading(true);
      const dir = await ipcRenderer.invoke('select-directory');
      if (dir) {
        console.log('Selected directory:', dir);
        const vids = await ipcRenderer.invoke('scan-videos', dir);
        console.log('Received videos:', vids);
        const normalized = (Array.isArray(vids) ? vids : []).map((v: any, idx: number) =>
          typeof v === 'string' ? { path: v, thumbnail: '', watchedProgress: idx % 3 === 0 ? Math.floor(Math.random() * 100) : 0 } : v
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

  // moved above and memoized with useCallback

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

  const openSingleFile = async () => {
    try {
      const filePath = await ipcRenderer.invoke('open-file-dialog');
      if (filePath) {
        const video: Video = {
          path: filePath,
          thumbnail: ''
        };
        setVideos(prev => {
          const exists = prev.find(v => v.path === filePath);
          if (!exists) {
            return [...prev, video];
          }
          return prev;
        });
        playVideo(filePath);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const openDisc = async () => {
  setIsLoading(true);
    try {
      const drive: string | null = await ipcRenderer.invoke('choose-disc-drive');
      if (!drive) {
        return;
      }
  // Scanning disc
      const result: any = await ipcRenderer.invoke('scan-disc', drive);
      if (!result || result.kind === 'none') {
        alert('No playable media found on this disc.');
        return;
      }
      if (result.kind === 'data') {
        const list: Video[] = (result.videos || []).map((v: any) => ({ path: v.path, thumbnail: v.thumbnail || '' }));
        if (list.length === 0) {
          alert('No supported video files found on this disc.');
          return;
        }
        setVideos(list);
        playVideo(list[0].path);
        return;
      }
      if (result.kind === 'dvd') {
        const vobs: string[] = result.vobs || [];
        if (!vobs.length) {
          alert('DVD structure detected but no title files found.');
          return;
        }
  // Converting DVD to MP4 may take a while
        const outPath: string | null = await ipcRenderer.invoke('convert-dvd-title', vobs);
        if (!outPath) {
          alert('Failed to convert DVD to a playable file.');
          return;
        }
        const vid: Video = { path: outPath, thumbnail: '' };
        setVideos(prev => [...prev, vid]);
        playVideo(outPath);
        return;
      }
    } catch (e) {
      console.error('Open disc error', e);
      alert('Error opening disc.');
    } finally {
  setIsLoading(false);
    }
  };

  const showInExplorer = async (filePath: string) => {
    try {
      await ipcRenderer.invoke('show-in-explorer', filePath);
    } catch (error) {
      console.error('Error showing in explorer:', error);
    }
  };

  const filteredVideos = videos.filter(video => 
    video.path && video.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        const nameA = a.path.split(/[/\\]/).pop()?.toLowerCase() || '';
        const nameB = b.path.split(/[/\\]/).pop()?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      case 'date':
        // For now, sort by path as we don't have date info
        return a.path.localeCompare(b.path);
      case 'size':
        // For now, sort by path as we don't have size info
        return a.path.localeCompare(b.path);
      default:
        return 0;
    }
  });

  const getVideoExtensions = () => {
    const extensions = new Set(videos.map(v => v.path.split('.').pop()?.toUpperCase()).filter(Boolean));
    return Array.from(extensions);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">▶</div>
            <h1>EwPlayer</h1>
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
                  const title = video.path ? video.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') : 'Unknown Video';
                  const extension = video.path ? video.path.split('.').pop()?.toUpperCase() : '';
                  return (
                    <div 
                      key={index} 
                      className={`video-card ${selectedVideo === video.path ? 'selected' : ''}`} 
                      onClick={() => playVideo(video.path)} 
                      title={title}
                      tabIndex={0}
                      role="button"
                      aria-label={`Play ${title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          playVideo(video.path);
                        }
                      }}
                    >
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
                      </div>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="primary" 
                          onClick={() => playVideo(video.path)} 
                          title="Play"
                          aria-label={`Play ${title}`}
                        >
                          ▶
                        </button>
                        <button 
                          onClick={() => showInExplorer(video.path)} 
                          title="Show in folder"
                          aria-label={`Show ${title} in folder`}
                        >
                          📁
                        </button>
                        <button 
                          onClick={() => deleteVideo(video.path)} 
                          title="Delete"
                          aria-label={`Delete ${title}`}
                        >
                          🗑
                        </button>
                      </div>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        aria-label={`Watched ${video.watchedProgress}%`}
                        aria-valuenow={video.watchedProgress} 
                        aria-valuemin={0} 
                        aria-valuemax={100}
                      >
                        <div className="progress-fill" style={{ width: `${video.watchedProgress}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="library-header">
              <div className="library-header-top">
                <div className="library-info">
                  <h2 className="library-title">Video Library</h2>
                  <div className="library-stats">
                    <div className="stats-item">
                      <span>📹</span>
                      <span>{videos.length} videos</span>
                    </div>
                    {getVideoExtensions().length > 0 && (
                      <div className="stats-item">
                        <span>📁</span>
                        <span>{getVideoExtensions().join(', ')}</span>
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
                  <button className="browse-btn secondary" onClick={openDisc} title="Open a DVD or CD">Open Disc</button>
                </div>
              </div>
            </div>
            <div className={`video-grid-container ${viewMode}-view`}>
              {isLoading && (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <span>Loading videos...</span>
                </div>
              )}
              {!isLoading && videos.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🎬</div>
                  <h3>Welcome to EwPlayer</h3>
                  <p>Your video library is empty. Browse a directory or open a single file to get started.</p>
                  <div className="empty-state-actions">
                    <button className="browse-btn" onClick={selectDirectory}>Browse Folder</button>
                    <button className="browse-btn secondary" onClick={openSingleFile}>Open File</button>
                    <button className="browse-btn secondary" onClick={openDisc}>Open Disc</button>
                  </div>
                </div>
              )}
              {!isLoading && videos.length > 0 && sortedVideos.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <span>No videos match your search.</span>
                </div>
              )}
              {sortedVideos.map((video, index) => {
                const title = video.path ? video.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') : 'Unknown Video';
                const extension = video.path ? video.path.split('.').pop()?.toUpperCase() : '';
                return (
                  <div 
                    key={index} 
                    className={`video-card ${viewMode}-style`} 
                    onClick={() => playVideo(video.path)} 
                    title={title}
                    tabIndex={0}
                    role="button"
                    aria-label={`Play ${title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playVideo(video.path);
                      }
                    }}
                  >
                    <div className="video-thumbnail-container">
                      <LazyImage
                        src={video.thumbnail ? toFileUrl(video.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
                        alt={title || 'thumbnail'}
                        className="video-thumbnail"
                        width={320}
                        height={180}
                      />
                      <div className="quality-badge">{extension}</div>
                    </div>
                    <div className="card-content">
                      <div className="card-title" title={title}>{title}</div>
                      <div className="card-metadata">
                        <div className="metadata-item">
                          <span>📄</span>
                          <span>{extension} • Video File</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="primary" 
                        onClick={() => playVideo(video.path)} 
                        title="Play"
                        aria-label={`Play ${title}`}
                      >
                        ▶
                      </button>
                      <button 
                        onClick={() => showInExplorer(video.path)} 
                        title="Show in folder"
                        aria-label={`Show ${title} in folder`}
                      >
                        📁
                      </button>
                      <button 
                        onClick={() => deleteVideo(video.path)} 
                        title="Delete"
                        aria-label={`Delete ${title}`}
                      >
                        🗑
                      </button>
                    </div>
                    {video.watchedProgress && video.watchedProgress > 0 && (
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        aria-label={`Watched ${video.watchedProgress}%`}
                        aria-valuenow={video.watchedProgress} 
                        aria-valuemin={0} 
                        aria-valuemax={100}
                      >
                        <div className="progress-fill" style={{ width: `${video.watchedProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
