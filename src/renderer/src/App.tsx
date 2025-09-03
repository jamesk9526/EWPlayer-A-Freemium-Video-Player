import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';
import Library from './pages/Library';
import Player from './pages/Player';
import MultiPlayer from './components/MultiPlayer';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import SettingsIcon from '@mui/icons-material/Settings';

// Use the exposed API from preload script
const api = (window as any).api;

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

// Onboarding Component
const OnboardingScreen = ({ onComplete }: { onComplete: (profile: UserProfile) => void }) => {
  const [name, setName] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const profile: UserProfile = {
      name: name.trim(),
      info: info.trim(),
      onboardingComplete: true
    };
    onComplete(profile);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-panel">
        <div className="onboarding-header">
          <div className="logo">
            <div className="logo-icon">▶</div>
            <h1>EwPlayer</h1>
          </div>
          <h2>Welcome to EwPlayer!</h2>
          <p>Let's get to know you to personalize your experience.</p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user-name">What's your name?</label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-info">Tell us a bit about yourself (optional)</label>
            <textarea
              id="user-info"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="e.g., I'm a movie enthusiast who loves organizing my video collection..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="onboarding-submit-btn"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Setting up...' : 'Get Started'}
          </button>
        </form>

        <div className="onboarding-footer">
          <p>You can update this information later in Settings.</p>
        </div>
      </div>
    </div>
  );
};

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

// Helper functions for ewplayer-style genres and ratings
const getGenresForVideo = (contentType: string, fileName: string): string[] => {
  const lowerFileName = fileName.toLowerCase();
  const genres: string[] = [];

  // Content type based genres
  switch (contentType) {
    case 'movie':
      genres.push('Movies');
      break;
    case 'tv-show':
      genres.push('TV Shows');
      break;
    case 'documentary':
      genres.push('Documentaries');
      break;
    case 'short':
      genres.push('Short Films');
      break;
    case 'music-video':
      genres.push('Music Videos');
      break;
    default:
      genres.push('Home Videos');
  }

  // Filename-based genre detection
  if (lowerFileName.includes('action') || lowerFileName.includes('adventure')) {
    genres.push('Action & Adventure');
  }
  if (lowerFileName.includes('comedy') || lowerFileName.includes('funny')) {
    genres.push('Comedy');
  }
  if (lowerFileName.includes('drama') || lowerFileName.includes('dramatic')) {
    genres.push('Drama');
  }
  if (lowerFileName.includes('horror') || lowerFileName.includes('thriller')) {
    genres.push('Horror');
  }
  if (lowerFileName.includes('romance') || lowerFileName.includes('romantic')) {
    genres.push('Romance');
  }
  if (lowerFileName.includes('sci-fi') || lowerFileName.includes('science fiction')) {
    genres.push('Sci-Fi');
  }
  if (lowerFileName.includes('fantasy')) {
    genres.push('Fantasy');
  }
  if (lowerFileName.includes('animation') || lowerFileName.includes('animated')) {
    genres.push('Animation');
  }
  if (lowerFileName.includes('documentary') || lowerFileName.includes('docu')) {
    genres.push('Documentary');
  }
  if (lowerFileName.includes('music') || lowerFileName.includes('musical')) {
    genres.push('Musical');
  }

  // Return unique genres, limited to 3
  return Array.from(new Set(genres)).slice(0, 3);
};

const getRatingForVideo = (contentType: string, fileName: string): string => {
  const lowerFileName = fileName.toLowerCase();

  // Age-based ratings from filename patterns
  if (lowerFileName.includes('pg-13') || lowerFileName.includes('pg13')) {
    return 'PG-13';
  }
  if (lowerFileName.includes('pg')) {
    return 'PG';
  }
  if (lowerFileName.includes('r-rated') || lowerFileName.includes('r rating')) {
    return 'R';
  }
  if (lowerFileName.includes('nc-17') || lowerFileName.includes('nc17')) {
    return 'NC-17';
  }
  if (lowerFileName.includes('g-rated') || lowerFileName.includes('g rating')) {
    return 'G';
  }

  // Content type based default ratings
  switch (contentType) {
    case 'movie':
      return 'PG-13'; // Default for movies
    case 'tv-show':
      return 'TV-14'; // Default for TV shows
    case 'documentary':
      return 'TV-PG'; // Default for documentaries
    case 'short':
      return 'G'; // Default for short films
    case 'music-video':
      return 'PG'; // Default for music videos
    default:
      return 'Not Rated'; // Default for home videos
  }
};

// Theater-style Streaming Interface Component
const StreamingInterface = ({ videos, userProfile, onVideoSelect, settings, currentPage }: {
  videos: Video[];
  userProfile: UserProfile | null;
  onVideoSelect: (path: string) => void;
  settings: any;
  currentPage: string;
}) => {
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [selectedShowData, setSelectedShowData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'main' | 'category' | 'tv-shows' | 'movies' | 'home-videos' | 'continue-watching'>('main');
  const [categoryData, setCategoryData] = useState<{ title: string; items: any[]; isShowGroup: boolean }>({ title: '', items: [], isShowGroup: false });
  const [coverStyle, setCoverStyle] = useState<'horizontal' | 'vertical'>(settings.theaterCoverStyle || 'horizontal');
  const [layoutDensity, setLayoutDensity] = useState<'comfortable' | 'compact' | 'dense'>(settings.theaterLayoutDensity || 'comfortable');

  // Normalize video data and re-detect content types
  const normalizedVideos = videos.map(video => {
    const fileName = video.path?.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || '';
    
    // Always re-detect content type to ensure accuracy
    let contentType: 'movie' | 'tv-show' | 'home-media' = 'home-media';
    
    // TV show patterns - check filename for common TV show patterns
    if (/s\d{1,2}e\d{1,2}/i.test(fileName) || /\d{1,2}x\d{1,2}/.test(fileName) || /season\s*\d+/i.test(fileName) || /episode\s*\d+/i.test(fileName)) {
      contentType = 'tv-show';
    }
    // Movie patterns (year in filename)
    else if (/\b(19|20)\d{2}\b/.test(fileName) || /\bmovie\b/i.test(fileName)) {
      contentType = 'movie';
    }
    
    let title = fileName;
    let season: number | undefined;
    let episode: number | undefined;
    let year: number | undefined;
    
    // Extract season/episode for TV shows
    if (contentType === 'tv-show') {
      const sMatch = fileName.match(/s(\d{1,2})e(\d{1,2})/i);
      const xMatch = fileName.match(/(\d{1,2})x(\d{1,2})/);
      
      if (sMatch) {
        season = parseInt(sMatch[1]);
        episode = parseInt(sMatch[2]);
        title = fileName.replace(/s\d{1,2}e\d{1,2}.*/i, '').trim();
      } else if (xMatch) {
        season = parseInt(xMatch[1]);
        episode = parseInt(xMatch[2]);
        title = fileName.replace(/\d{1,2}x\d{1,2}.*/i, '').trim();
      }
    }
    
    // Extract year
    const yearMatch = fileName.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[0]);
      title = title.replace(yearMatch[0], '').trim();
    }
    
    // Clean up title
    title = title.replace(/[[\]()]/g, '').replace(/\s+/g, ' ').trim();
    
    return {
      ...video,
      contentType,
      title,
      season,
      episode,
      year,
      isPrivate: video.isPrivate ?? false,
      category: video.category ?? 'general',
      // Add ewplayer-style genres based on content type and filename
      genres: getGenresForVideo(contentType, fileName),
      rating: getRatingForVideo(contentType, fileName)
    };
  });

  // Group TV shows by series name
  const groupShowsByTitle = (shows: Video[]) => {
    const grouped: { [key: string]: Video[] } = {};
    
    shows.forEach(show => {
      const seriesName = show.title || show.path?.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
      if (!grouped[seriesName]) {
        grouped[seriesName] = [];
      }
      grouped[seriesName].push(show);
    });
    
    // Convert to array of series objects
    return Object.entries(grouped).map(([title, episodes]) => {
      // Sort episodes by season and episode number
      const sortedEpisodes = episodes.sort((a, b) => {
        if (a.season !== b.season) {
          return (a.season || 0) - (b.season || 0);
        }
        return (a.episode || 0) - (b.episode || 0);
      });
      
      return {
        title,
        episodes: sortedEpisodes,
        thumbnail: sortedEpisodes[0].thumbnail,
        episodeCount: sortedEpisodes.length,
        seasons: Array.from(new Set(sortedEpisodes.map(ep => ep.season).filter(s => s))).length || 1,
        contentType: 'tv-show' as const,
        firstEpisode: sortedEpisodes[0]
      };
    });
  };

  // Filter and group content
  const movies = normalizedVideos.filter(v => v.contentType === 'movie' && (v.isPrivate !== true));
  const tvShowEpisodes = normalizedVideos.filter(v => v.contentType === 'tv-show' && (v.isPrivate !== true));
  const homeMedia = normalizedVideos.filter(v => v.contentType === 'home-media' && (v.isPrivate !== true));
  const continueWatching = normalizedVideos.filter(v => v.watchedProgress && v.watchedProgress > 0 && v.watchedProgress < 90 && (v.isPrivate !== true));
  
  // Group TV shows by series
  const tvShows = groupShowsByTitle(tvShowEpisodes);
  
  // If no videos have been categorized properly, show all videos as home media
  const allVideosVisible = movies.length === 0 && tvShows.length === 0 && homeMedia.length === 0;
  const fallbackVideos = allVideosVisible ? normalizedVideos.filter(v => v.isPrivate !== true) : [];

  // Category View Component
  const CategoryView = ({ 
    title, 
    items, 
    isShowGroup = false, 
    onBack 
  }: { 
    title: string; 
    items: any[]; 
    isShowGroup?: boolean;
    onBack: () => void;
  }) => {
    return (
      <div className="category-view">
        <div className="category-header">
          <button className="back-button" onClick={onBack}>← Back to Library</button>
          <h1 className="category-page-title">{title}</h1>
          <div className="category-stats">{items.length} items</div>
        </div>
        
        <div className="category-grid">
          {items.map((item, index) => {
            let videoTitle: string;
            let onClickAction: () => void;
            let videoPath: string;
            let thumbnail: string | undefined;
            let watchedProgress: number | undefined;
            let seasonEpisode: string;
            
            if (isShowGroup) {
              // This is a grouped TV show
              videoTitle = item.title;
              onClickAction = () => {
                setSelectedShow(item.title);
                setSelectedShowData(item);
              };
              videoPath = item.firstEpisode.path;
              thumbnail = item.thumbnail;
              watchedProgress = item.firstEpisode.watchedProgress;
              seasonEpisode = `${item.seasons} Season${item.seasons !== 1 ? 's' : ''} • ${item.episodeCount} Episodes`;
            } else {
              // This is an individual video
              const video = item as Video;
              videoTitle = video.title || video.path?.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
              onClickAction = () => onVideoSelect(video.path);
              videoPath = video.path;
              thumbnail = video.thumbnail;
              watchedProgress = video.watchedProgress;
              seasonEpisode = video.season && video.episode ? `S${video.season}E${video.episode}` : '';
            }
            
            return (
              <div 
                key={videoPath || index} 
                className="category-item-card"
                onClick={onClickAction}
                tabIndex={0}
                role="button"
                aria-label={`${isShowGroup ? 'Open' : 'Play'} ${videoTitle}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClickAction();
                  }
                }}
              >
                <div className="category-item-image">
                  <LazyImage
                    src={thumbnail ? toFileUrl(thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
                    alt={videoTitle}
                    className="category-item-thumbnail"
                    width={300}
                    height={169}
                  />
                  <div className="category-item-overlay">
                    <div className="category-item-play-button">{isShowGroup ? '▶' : '▶'}</div>
                  </div>
                  {watchedProgress && watchedProgress > 0 && (
                    <div className="category-item-progress">
                      <div className="category-item-progress-bar" data-progress={`${watchedProgress}%`}></div>
                    </div>
                  )}
                </div>
                <div className="category-item-info">
                  <div className="category-item-title">{videoTitle}</div>
                  {seasonEpisode && <div className="category-item-meta">{seasonEpisode}</div>}
                  {!isShowGroup && item.year && <div className="category-item-year">{item.year}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const ShowDetailView = ({ show, onBack }: { show: any; onBack: () => void }) => {
    return (
      <div className="show-detail-view">
        <div className="show-header">
          <div className="show-hero">
            <div className="show-backdrop">
              <LazyImage
                src={show.thumbnail ? toFileUrl(show.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSI0OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5TaG93PC90ZXh0Pjwvc3ZnPg=='}
                alt={show.title}
                className="show-backdrop-image"
                width={1920}
                height={1080}
              />
              <div className="show-backdrop-gradient"></div>
            </div>
            <div className="show-info">
              <button className="back-button" onClick={onBack}>← Back to Library</button>
              <h1 className="show-title">{show.title}</h1>
              <div className="show-meta">
                <span>{show.seasons} Season{show.seasons !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{show.episodeCount} Episode{show.episodeCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="episodes-section">
          <h2>Episodes</h2>
          <div className="episodes-grid">
            {show.episodes.map((episode: Video, index: number) => {
              const episodeTitle = `S${episode.season || 1}E${episode.episode || index + 1}`;
              const fileName = episode.path?.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
              
              return (
                <div 
                  key={episode.path} 
                  className="episode-card"
                  onClick={() => onVideoSelect(episode.path)}
                >
                  <div className="episode-thumbnail">
                    <LazyImage
                      src={episode.thumbnail ? toFileUrl(episode.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkVwaXNvZGU8L3RleHQ+PC9zdmc+'}
                      alt={episodeTitle}
                      className="episode-thumbnail-image"
                      width={320}
                      height={180}
                    />
                    <div className="episode-play-overlay">
                      <div className="episode-play-button">▶</div>
                    </div>
                    {episode.watchedProgress && episode.watchedProgress > 0 && (
                      <div className="episode-progress">
                        <div 
                          className="episode-progress-bar" 
                          data-progress={`${episode.watchedProgress}%`}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="episode-info">
                    <div className="episode-number">{episodeTitle}</div>
                    <div className="episode-filename">{fileName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const CategoryRow = ({ title, items, type = 'default', isShowGroup = false, onCategoryClick }: { 
    title: string; 
    items: any[]; 
    type?: string;
    isShowGroup?: boolean;
    onCategoryClick?: () => void;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="category-row">
        <h2 
          className={`category-title ${onCategoryClick ? 'clickable' : ''}`}
          onClick={onCategoryClick}
          tabIndex={onCategoryClick ? 0 : undefined}
          role={onCategoryClick ? 'button' : undefined}
          aria-label={onCategoryClick ? `View all ${title}` : undefined}
          onKeyDown={(e) => {
            if (onCategoryClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onCategoryClick();
            }
          }}
        >
          {title} ({items.length})
        </h2>
        <div className={`content-slider ${type}`}>
          {items.slice(0, 20).map((item, index) => {
            let videoTitle: string;
            let onClickAction: () => void;
            let videoPath: string;
            let thumbnail: string | undefined;
            let watchedProgress: number | undefined;
            let seasonEpisode: string;
            
            if (isShowGroup) {
              // This is a grouped TV show
              videoTitle = item.title;
              onClickAction = () => {
                setSelectedShow(item.title);
                setSelectedShowData(item);
              };
              videoPath = item.firstEpisode.path;
              thumbnail = item.thumbnail;
              watchedProgress = item.firstEpisode.watchedProgress;
              seasonEpisode = `${item.seasons} Season${item.seasons !== 1 ? 's' : ''} • ${item.episodeCount} Episodes`;
            } else {
              // This is an individual video
              const video = item as Video;
              videoTitle = video.title || video.path?.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
              onClickAction = () => onVideoSelect(video.path);
              videoPath = video.path;
              thumbnail = video.thumbnail;
              watchedProgress = video.watchedProgress;
              seasonEpisode = video.season && video.episode ? `S${video.season}E${video.episode}` : '';
            }
            
            return (
              <div 
                key={videoPath || index} 
                className={`content-card ${type}`}
                onClick={onClickAction}
                tabIndex={0}
                role="button"
                aria-label={`${isShowGroup ? 'Open' : 'Play'} ${videoTitle}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClickAction();
                  }
                }}
              >
                <div className="card-image">
                  <LazyImage
                    src={thumbnail ? toFileUrl(thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
                    alt={videoTitle}
                    className="content-thumbnail"
                    width={type === 'hero' ? 400 : 280}
                    height={type === 'hero' ? 225 : 157}
                  />
                  <div className="play-overlay">
                    <div className="play-button">{isShowGroup ? '▶' : '▶'}</div>
                  </div>
                  {watchedProgress && watchedProgress > 0 && (
                    <div className="progress-indicator">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" data-progress={`${watchedProgress}%`}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-info">
                  <div className="card-title">{videoTitle}</div>
                  {seasonEpisode && <div className="card-episode">{seasonEpisode}</div>}
                  {!isShowGroup && item.year && <div className="card-year">{item.year}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Show category view
  if (currentView === 'category') {
    return (
      <CategoryView
        title={categoryData.title}
        items={categoryData.items}
        isShowGroup={categoryData.isShowGroup}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  // Show detail view or main library
  if (selectedShowData) {
    return <ShowDetailView show={selectedShowData} onBack={() => {
      setSelectedShow(null);
      setSelectedShowData(null);
    }} />;
  }

  const featuredVideo = continueWatching[0] || movies[0] || tvShows[0]?.firstEpisode || homeMedia[0] || fallbackVideos[0];

  // Page-specific content filtering
  const getPageContent = () => {
    switch (currentPage) {
      case 'tv':
        return {
          title: 'TV Shows',
          featuredVideo: tvShows[0]?.firstEpisode || continueWatching.find(v => v.contentType === 'tv-show') || null,
          rows: [
            { title: 'Continue Watching TV', items: continueWatching.filter(v => v.contentType === 'tv-show'), type: 'continue', isShowGroup: false },
            { title: 'Popular TV Shows', items: tvShows, type: 'default', isShowGroup: true },
            { title: 'Recently Added TV', items: tvShows.slice(0, 10), type: 'default', isShowGroup: true }
          ]
        };
      case 'movies':
        return {
          title: 'Movies',
          featuredVideo: movies[0] || continueWatching.find(v => v.contentType === 'movie') || null,
          rows: [
            { title: 'Continue Watching Movies', items: continueWatching.filter(v => v.contentType === 'movie'), type: 'continue', isShowGroup: false },
            { title: 'Popular Movies', items: movies, type: 'default', isShowGroup: false },
            { title: 'Recently Added Movies', items: movies.slice(0, 10), type: 'default', isShowGroup: false }
          ]
        };
      case 'my-list':
        return {
          title: 'My List',
          featuredVideo: videos.find(v => v.isPrivate === true) || continueWatching[0] || null,
          rows: [
            { title: 'Continue Watching', items: continueWatching, type: 'continue', isShowGroup: false },
            { title: 'My Favorites', items: videos.filter(v => v.isFavorite === true), type: 'default', isShowGroup: false },
            { title: 'Watch Later', items: videos.filter(v => !v.watchedProgress || v.watchedProgress === 0), type: 'default', isShowGroup: false }
          ]
        };
      case 'home':
      default:
        return {
          title: 'Home',
          featuredVideo: continueWatching[0] || movies[0] || tvShows[0]?.firstEpisode || homeMedia[0] || null,
          rows: [
            { title: 'Continue Watching', items: continueWatching, type: 'continue', isShowGroup: false },
            { title: 'Movies', items: movies, type: 'default', isShowGroup: false },
            { title: 'TV Shows', items: tvShows, type: 'default', isShowGroup: true },
            { title: 'Home Videos', items: homeMedia, type: 'default', isShowGroup: false },
            ...(allVideosVisible ? [{ title: 'All Videos', items: fallbackVideos, type: 'default' as const, isShowGroup: false }] : [])
          ]
        };
    }
  };

  const pageContent = getPageContent();

  return (
    <div className={`streaming-interface ${coverStyle === 'vertical' ? 'vertical-covers' : ''} ${layoutDensity}-layout`}>
      {/* Show message if no videos at all */}
      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h2>No videos found</h2>
          <p>Add some videos to your library to see them here in theater mode</p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          {pageContent.featuredVideo && (
            <div className="hero-section">
              <div className="hero-background">
                <LazyImage
                  src={pageContent.featuredVideo.thumbnail ? toFileUrl(pageContent.featuredVideo.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1zaXplPSI0OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5GZWF0dXJlZDwvdGV4dD48L3N2Zz4='}
                  alt="Featured content"
                  className="hero-image"
                  width={1920}
                  height={1080}
                />
                <div className="hero-gradient"></div>
              </div>
              <div className="hero-content">
                <h1 className="hero-title">{pageContent.featuredVideo.title || pageContent.featuredVideo.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '')}</h1>
                {pageContent.featuredVideo.year && <div className="hero-year">{pageContent.featuredVideo.year}</div>}
                <div className="hero-actions">
                  <button 
                    className="hero-play-btn"
                    onClick={() => onVideoSelect(pageContent.featuredVideo.path)}
                  >
                    ▶ Play
                  </button>
                  <button className="hero-info-btn">ⓘ More Info</button>
                </div>
              </div>
            </div>
          )}

          {/* Content Rows */}
          <div className="content-rows">
            {pageContent.rows.map((row, index) => (
              <CategoryRow
                key={index}
                title={row.title}
                items={row.items}
                type={row.type}
                isShowGroup={row.isShowGroup}
                onCategoryClick={row.type !== 'continue' ? () => {
                  setCurrentView('category');
                  setCategoryData({ title: row.title, items: row.items, isShowGroup: row.isShowGroup || false });
                } : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Settings Page Component
const SettingsPage = ({ 
  settings, 
  setSettings, 
  saveSettings, 
  userProfile, 
  onBack,
  rescanStartupFolders
}: {
  settings: any;
  setSettings: (settings: any) => void;
  saveSettings: (settings: any) => Promise<void>;
  userProfile: UserProfile | null;
  onBack: () => void;
  rescanStartupFolders: (currentSettings: any) => Promise<void>;
}) => {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-button" onClick={onBack}>← Back to Library</button>
        <h1 className="settings-title">Settings</h1>
      </div>
      
      <div className="settings-content">
        {/* User Profile Section */}
        <div className="settings-section">
          <h3>👤 User Profile</h3>
          <div className="setting-item">
            <label htmlFor="profile-name">Name</label>
            <input 
              type="text" 
              id="profile-name" 
              defaultValue={userProfile?.name || ''} 
              placeholder="Enter your name"
            />
          </div>
          <div className="setting-item">
            <label htmlFor="profile-info">About</label>
            <textarea 
              id="profile-info" 
              defaultValue={userProfile?.info || ''} 
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
        </div>

        {/* Playback Section */}
        <div className="settings-section">
          <h3>▶️ Playback</h3>
          <div className="setting-item">
            <label htmlFor="autoplay">Auto-play next video</label>
            <input type="checkbox" id="autoplay" defaultChecked={settings.autoplay || false} />
          </div>
          <div className="setting-item">
            <label htmlFor="loop">Loop playback</label>
            <input type="checkbox" id="loop" defaultChecked={settings.loop || false} />
          </div>
          <div className="setting-item">
            <label htmlFor="volume">Default volume</label>
            <input type="range" id="volume" min="0" max="100" defaultValue={settings.volume || 70} />
          </div>
        </div>

        {/* Library Controls Section */}
        <div className="settings-section">
          <h3>📚 Library Controls</h3>
          <div className="setting-item">
            <label htmlFor="streaming-mode">Theater interface</label>
            <input type="checkbox" id="streaming-mode" defaultChecked={settings.streamingMode || false} />
            <span className="setting-description">Cinematic interface with content categorization</span>
          </div>
          <div className="setting-item">
            <label htmlFor="auto-detect-series">Auto-detect TV series</label>
            <input type="checkbox" id="auto-detect-series" defaultChecked={settings.autoDetectSeries !== false} />
            <span className="setting-description">Automatically group episodes into series based on naming patterns</span>
          </div>
          <div className="setting-item">
            <label htmlFor="hide-incompatible-formats">Hide incompatible formats</label>
            <input type="checkbox" id="hide-incompatible-formats" defaultChecked={settings.hideIncompatibleFormats !== false} />
            <span className="setting-description">Only show supported video formats (MP4, MKV, MOV, WMV, FLV, M2TS)</span>
          </div>
          <div className="setting-item">
            <label htmlFor="sort-order">Default sort order</label>
            <select id="sort-order" defaultValue={settings.sortOrder || "name-asc"}>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="date-asc">Date Added (Oldest First)</option>
              <option value="date-desc">Date Added (Newest First)</option>
              <option value="size-asc">File Size (Smallest First)</option>
              <option value="size-desc">File Size (Largest First)</option>
              <option value="modified-asc">Last Modified (Oldest First)</option>
              <option value="modified-desc">Last Modified (Newest First)</option>
            </select>
          </div>
          <div className="setting-item">
            <label htmlFor="filter-unwatched">Show only unwatched</label>
            <input type="checkbox" id="filter-unwatched" defaultChecked={settings.filterUnwatched || false} />
            <span className="setting-description">Hide videos that have been watched</span>
          </div>
        </div>

        {/* File & Folder Management Section */}
        <div className="settings-section">
          <h3>📁 File & Folder Management</h3>
          <div className="setting-item">
            <label>Marked Files & Folders</label>
            <p className="setting-description">
              Mark files or folders as favorites, watched, or hidden. Marked items will be highlighted in the library.
            </p>
            <div className="marked-items-list">
              {(settings.markedItems || []).map((item: any, index: number) => (
                <div key={index} className="marked-item">
                  <span className={`marked-type ${item.type}`}>{item.type}</span>
                  <span className="marked-path" title={item.path}>{item.path.split(/[/\\]/).pop()}</span>
                  <span className="marked-tags">
                    {item.tags?.map((tag: string) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </span>
                  <button 
                    type="button" 
                    className="remove-marked-btn"
                    onClick={async () => {
                      const currentItems = settings.markedItems || [];
                      const newItems = currentItems.filter((_: any, i: number) => i !== index);
                      const updatedSettings = { ...settings, markedItems: newItems };
                      setSettings(updatedSettings);
                      await saveSettings(updatedSettings);
                    }}
                    title="Remove mark"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="marked-item add-new">
                <button 
                  type="button" 
                  className="add-marked-btn"
                  onClick={async () => {
                    try {
                      const result = await api.selectFileOrFolder();
                      if (result) {
                        const currentItems = settings.markedItems || [];
                        const newItem = {
                          path: result.path,
                          type: result.type, // 'file' or 'folder'
                          tags: ['favorite'],
                          markedAt: new Date().toISOString()
                        };
                        const newItems = [...currentItems, newItem];
                        const updatedSettings = { ...settings, markedItems: newItems };
                        setSettings(updatedSettings);
                        await saveSettings(updatedSettings);
                      }
                    } catch (error) {
                      console.error('Error selecting file/folder:', error);
                    }
                  }}
                  title="Add file or folder"
                >
                  + Add File/Folder
                </button>
              </div>
            </div>
          </div>
          <div className="setting-item">
            <label>Excluded Folders</label>
            <p className="setting-description">
              These folders will be completely excluded from library scans and won't appear in search results.
            </p>
            <div className="excluded-folders-list">
              {(settings.excludedFolders || []).map((folder: string, index: number) => (
                <div key={index} className="excluded-folder-item">
                  <input 
                    type="text" 
                    value={folder} 
                    readOnly
                    className="excluded-folder-input"
                    title={`Excluded folder: ${folder}`}
                  />
                  <button 
                    type="button" 
                    className="remove-excluded-btn"
                    onClick={async () => {
                      const currentFolders = settings.excludedFolders || [];
                      const newFolders = currentFolders.filter((_: string, i: number) => i !== index);
                      const updatedSettings = { ...settings, excludedFolders: newFolders };
                      setSettings(updatedSettings);
                      await saveSettings(updatedSettings);
                    }}
                    title="Remove exclusion"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="excluded-folder-item">
                <input 
                  type="text" 
                  placeholder="Select a folder to exclude..."
                  readOnly
                  className="excluded-folder-input"
                  title="Click + to exclude a folder"
                />
                <button 
                  type="button" 
                  className="add-excluded-btn"
                  onClick={async () => {
                    try {
                      const folderPath = await api.selectDirectory();
                      if (folderPath) {
                        const currentFolders = settings.excludedFolders || [];
                        // Check if folder is already excluded
                        if (!currentFolders.includes(folderPath)) {
                          const newFolders = [...currentFolders, folderPath];
                          const updatedSettings = { ...settings, excludedFolders: newFolders };
                          setSettings(updatedSettings);
                          await saveSettings(updatedSettings);
                        } else {
                          alert('This folder is already excluded.');
                        }
                      }
                    } catch (error) {
                      console.error('Error selecting excluded folder:', error);
                    }
                  }}
                  title="Exclude folder"
                >
                  +
                </button>
              </div>
            </div>
            <small className="setting-help">Excluded folders will not be scanned for videos</small>
          </div>
        </div>

        {/* Library Settings Section */}
        <div className="settings-section">
          <h3>🗂️ Library Settings</h3>
          <div className="setting-item">
            <label htmlFor="auto-scan">Auto-scan on startup</label>
            <input type="checkbox" id="auto-scan" defaultChecked={settings.autoScan || false} />
          </div>
          <div className="setting-item">
            <label htmlFor="startup-folders">Startup folders</label>
            <div className="folders-list">
              {(settings.startupFolders || []).map((folder: string, index: number) => (
                <div key={index} className="folder-item">
                  <input 
                    type="text" 
                    id={`folder-${index}`}
                    value={folder} 
                    readOnly
                    className="folder-input"
                    title={`Startup folder ${index + 1}: ${folder}`}
                  />
                  <button 
                    type="button" 
                    className="remove-folder-btn"
                    onClick={async () => {
                      const currentFolders = settings.startupFolders || [];
                      const newFolders = currentFolders.filter((_: string, i: number) => i !== index);
                      const updatedSettings = { ...settings, startupFolders: newFolders };
                      setSettings(updatedSettings);
                      await saveSettings(updatedSettings);
                    }}
                    title="Remove this folder"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="folder-item">
                <input 
                  type="text" 
                  id="new-startup-folder" 
                  placeholder="Select a folder to add..."
                  readOnly
                  className="folder-input"
                  title="Click + to add a new startup folder"
                />
                <button 
                  type="button" 
                  className="add-folder-btn"
                  onClick={async () => {
                    try {
                      const folderPath = await api.selectDirectory();
                      if (folderPath) {
                        const currentFolders = settings.startupFolders || [];
                        const newFolders = [...currentFolders, folderPath];
                        const updatedSettings = { ...settings, startupFolders: newFolders };
                        setSettings(updatedSettings);
                        await saveSettings(updatedSettings);
                        const input = document.getElementById('new-startup-folder') as HTMLInputElement;
                        if (input) {
                          input.value = '';
                        }
                      }
                    } catch (error) {
                      console.error('Error selecting startup folder:', error);
                    }
                  }}
                  title="Add folder"
                >
                  +
                </button>
              </div>
            </div>
            <small className="setting-help">These folders will be automatically scanned when the app starts (if auto-scan is enabled)</small>
          </div>
          <div className="setting-item">
            <label htmlFor="cache-thumbnails">Cache thumbnails</label>
            <input type="checkbox" id="cache-thumbnails" defaultChecked={settings.cacheThumbnails !== false} />
          </div>
          <div className="setting-item">
            <label htmlFor="card-size">Video card size</label>
            <select id="card-size" defaultValue={settings.cardSize || "medium"}>
              <option value="small">Small (200px)</option>
              <option value="medium">Medium (280px)</option>
              <option value="large">Large (360px)</option>
              <option value="extra-large">Extra Large (440px)</option>
              <option value="giant">Giant (520px)</option>
              <option value="massive">Massive (600px)</option>
            </select>
            <span className="setting-description">Adjust the size of video cards in the library</span>
          </div>
          <div className="setting-item">
            <label htmlFor="card-spacing">Card spacing</label>
            <select id="card-spacing" defaultValue={settings.cardSpacing || "normal"}>
              <option value="tight">Tight (12px)</option>
              <option value="compact">Compact (16px)</option>
              <option value="normal">Normal (20px)</option>
              <option value="comfortable">Comfortable (28px)</option>
              <option value="loose">Loose (36px)</option>
            </select>
            <span className="setting-description">Adjust spacing between video cards</span>
          </div>
          <div className="setting-item">
            <label htmlFor="thumbnail-percentage">Thumbnail position (%)</label>
            <div className="range-container">
              <input
                type="range"
                id="thumbnail-percentage"
                min="10"
                max="90"
                step="5"
                value={settings.thumbnailPercentage || 50}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  setSettings({ ...settings, thumbnailPercentage: newValue });
                }}
                title={`Current: ${settings.thumbnailPercentage || 50}%`}
              />
              <span className="range-value">{settings.thumbnailPercentage || 50}%</span>
            </div>
            <span className="setting-description">Position in video to capture thumbnail (10-90%)</span>
          </div>
          <div className="setting-item">
            <label htmlFor="thumbnail-jitter">Thumbnail jitter (seconds)</label>
            <input
              type="number"
              id="thumbnail-jitter"
              min="0"
              max="60"
              step="1"
              defaultValue={settings.thumbnailJitter || 0}
            />
            <span className="setting-description">Randomize thumbnail timing by up to this many seconds</span>
          </div>
        </div>

        {/* Cache Management Section */}
        <div className="settings-section">
          <h3>🗃️ Cache Management</h3>
          <div className="setting-item">
            <div>
              <label>Thumbnail Cache</label>
              <p className="cache-description">
                Thumbnails are automatically cached to improve performance. Clear cache to free up disk space.
              </p>
            </div>
            <button 
              className="secondary-btn clear-cache-btn"
              onClick={async () => {
                try {
                  const success = await api.clearThumbnailCache();
                  if (success) {
                    alert('Thumbnail cache cleared successfully!');
                  } else {
                    alert('Failed to clear thumbnail cache.');
                  }
                } catch (error) {
                  console.error('Error clearing cache:', error);
                  alert('Error clearing thumbnail cache.');
                }
              }}
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="secondary-btn" onClick={onBack}>
          Back to Library
        </button>
        <button 
          className="primary-btn" 
          onClick={async () => {
            // Collect current form values and save
            const form = document.querySelector('.settings-content') as HTMLElement;
            if (form) {
              const newSettings: any = {};
              const checkboxes = form.querySelectorAll('input[type="checkbox"]');
              checkboxes.forEach((cb: any) => {
                // Convert hyphenated IDs to camelCase
                const settingKey = cb.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                newSettings[settingKey] = cb.checked;
                console.log(`Setting ${settingKey} (${cb.id}):`, cb.checked);
              });
              const selects = form.querySelectorAll('select');
              selects.forEach((sel: any) => {
                const settingKey = sel.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                newSettings[settingKey] = sel.value;
              });
              const ranges = form.querySelectorAll('input[type="range"]');
              ranges.forEach((range: any) => {
                const settingKey = range.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                newSettings[settingKey] = parseInt(range.value);
              });
              const numberInputs = form.querySelectorAll('input[type="number"]');
              numberInputs.forEach((num: any) => {
                const settingKey = num.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                newSettings[settingKey] = parseInt(num.value) || 0;
              });
              const inputs = form.querySelectorAll('input[type="text"], textarea');
              inputs.forEach((input: any) => {
                if (input.id === 'profile-name') {
                  newSettings.userProfile = {
                    ...newSettings.userProfile,
                    name: input.value.trim(),
                    onboardingComplete: true
                  };
                } else if (input.id === 'profile-info') {
                  newSettings.userProfile = {
                    ...newSettings.userProfile,
                    info: input.value.trim(),
                    onboardingComplete: true
                  };
                } else if (input.id === 'startup-folder') {
                  // Legacy support - convert to startupFolders array
                  if (input.value.trim()) {
                    newSettings.startupFolders = [input.value.trim()];
                  }
                  console.log('Saving legacy startup folder:', input.value.trim());
                } else if (input.id === 'new-startup-folder') {
                  // Skip the new folder input
                } else {
                  // For other text inputs, convert to camelCase
                  const settingKey = input.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                  newSettings[settingKey] = input.value.trim();
                }
              });
              
              // Handle folder inputs
              const folderInputs = form.querySelectorAll('input[id^="folder-"]');
              const folders = Array.from(folderInputs)
                .map(input => (input as HTMLInputElement).value.trim())
                .filter(value => value.length > 0);
              newSettings.startupFolders = folders;
              console.log('Saving startup folders:', folders);
              
              // Handle excluded folders
              const excludedFolderInputs = form.querySelectorAll('input[class*="excluded-folder-input"]');
              const excludedFolders = Array.from(excludedFolderInputs)
                .map(input => (input as HTMLInputElement).value.trim())
                .filter(value => value.length > 0);
              newSettings.excludedFolders = excludedFolders;
              console.log('Saving excluded folders:', excludedFolders);
              
              const thumbnailChanged = newSettings.thumbnailPercentage !== settings.thumbnailPercentage || newSettings.thumbnailJitter !== settings.thumbnailJitter;
              if (thumbnailChanged) {
                await api.clearThumbnailCache();
                await rescanStartupFolders(newSettings);
              }
              
              saveSettings(newSettings);
              console.log('Final settings to save:', newSettings);
            }
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

// Search Modal Component
const SearchModal = ({ 
  isOpen, 
  onClose, 
  videos, 
  onVideoSelect, 
  searchTerm, 
  setSearchTerm 
}: {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  onVideoSelect: (path: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) => {
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter videos based on search term and filters
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVideos([]);
      return;
    }

    let filtered = videos.filter(video => {
      const fileName = video.path.split(/[/\\]/).pop()?.toLowerCase() || '';
      const title = video.title?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      // Text search
      const matchesText = fileName.includes(searchLower) || 
                        title.includes(searchLower) || 
                        video.path.toLowerCase().includes(searchLower);

      if (!matchesText) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'favorites' && !video.isFavorite) return false;
        if (selectedCategory === 'watched' && (!video.watchedProgress || video.watchedProgress < 90)) return false;
        if (selectedCategory === 'unwatched' && video.watchedProgress && video.watchedProgress > 0) return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'movie' && video.contentType !== 'movie') return false;
        if (selectedType === 'tv-show' && video.contentType !== 'tv-show') return false;
        if (selectedType === 'home-media' && video.contentType !== 'home-media') return false;
      }

      return true;
    });

    // Sort by relevance (title matches first, then filename matches)
    filtered.sort((a, b) => {
      const aTitle = a.title?.toLowerCase() || '';
      const bTitle = b.title?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      const aTitleMatch = aTitle.includes(searchLower);
      const bTitleMatch = bTitle.includes(searchLower);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      return 0;
    });

    setFilteredVideos(filtered.slice(0, 50)); // Limit results
  }, [searchTerm, videos, selectedCategory, selectedType]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <div className="search-modal-input-wrapper">
            <div className="search-modal-icon">
              <SearchIcon />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              className="search-modal-input"
              placeholder="Search videos, movies, TV shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {searchTerm && (
              <button 
                className="search-modal-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button className="search-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="search-modal-filters">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              title="Filter by category"
            >
              <option value="all">All Videos</option>
              <option value="favorites">Favorites</option>
              <option value="watched">Watched</option>
              <option value="unwatched">Unwatched</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              title="Filter by content type"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv-show">TV Shows</option>
              <option value="home-media">Home Videos</option>
            </select>
          </div>
        </div>

        <div className="search-modal-results">
          {searchTerm.trim() === '' ? (
            <div className="search-modal-empty">
              <div className="search-modal-empty-icon">
                <MovieIcon />
              </div>
              <h3>Search Your Library</h3>
              <p>Find movies, TV shows, and videos by title, filename, or keywords</p>
              <div className="search-modal-tips">
                <div className="tip">
                  <strong>Quick Tips:</strong>
                </div>
                <div className="tip">• Search by movie/show title</div>
                <div className="tip">• Use keywords like "action", "comedy", "drama"</div>
                <div className="tip">• Filter by favorites, watched, or type</div>
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="search-modal-empty">
              <div className="search-modal-empty-icon">
                <SearchIcon />
              </div>
              <h3>No Results Found</h3>
              <p>Try different keywords or adjust your filters</p>
            </div>
          ) : (
            <>
              <div className="search-results-header">
                <span>{filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="search-results-grid">
                {filteredVideos.map((video, index) => {
                  const fileName = video.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || '';
                  const displayTitle = video.title || fileName;
                  
                  return (
                    <div 
                      key={video.path} 
                      className="search-result-item"
                      onClick={() => {
                        onVideoSelect(video.path);
                        onClose();
                      }}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onVideoSelect(video.path);
                          onClose();
                        }
                      }}
                    >
                      <div className="search-result-thumbnail">
                        <LazyImage
                          src={video.thumbnail ? toFileUrl(video.thumbnail) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEzNSIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='}
                          alt={displayTitle}
                          className="search-result-image"
                          width={240}
                          height={135}
                        />
                        <div className="search-result-play-overlay">
                          <div className="search-result-play-button">▶</div>
                        </div>
                        {video.watchedProgress && video.watchedProgress > 0 && (
                          <div className="search-result-progress">
                            <div 
                              className="search-result-progress-bar"
                              data-progress={`${video.watchedProgress}%`}
                            ></div>
                          </div>
                        )}
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-title">{displayTitle}</div>
                        <div className="search-result-meta">
                          {video.contentType === 'movie' && video.year && (
                            <span className="search-result-year">{video.year}</span>
                          )}
                          {video.contentType === 'tv-show' && video.season && video.episode && (
                            <span className="search-result-episode">S{video.season}E{video.episode}</span>
                          )}
                          <span className="search-result-type">{video.contentType?.replace('-', ' ') || 'home video'}</span>
                        </div>
                        {video.isFavorite && (
                          <div className="search-result-favorite">⭐ Favorite</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
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
  api.minimizeWindow();
};

const maximizeWindow = () => {
  api.maximizeWindow();
};

const closeWindow = () => {
  api.closeWindow();
};

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Hash routing for MultiPlayer
  const [route, setRoute] = useState(window.location.hash.replace('#', '') || '/');

  React.useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Advanced search parsing
  const parseSearchQuery = (query: string) => {
    const filters: any = {
      text: '',
      resolution: null,
      format: null,
      year: null,
      type: null
    };

    // Parse resolution syntax: <1080>, <4k>, <2060>, etc.
    const resolutionMatch = query.match(/<(\d{3,4}|4k|8k)>/i);
    if (resolutionMatch) {
      const res = resolutionMatch[1].toLowerCase();
      if (res === '4k') filters.resolution = '2160';
      else if (res === '8k') filters.resolution = '4320';
      else filters.resolution = res;
      query = query.replace(resolutionMatch[0], '').trim();
    }

    // Parse format syntax: [mp4], [mkv], etc.
    const formatMatch = query.match(/\[(\w+)\]/i);
    if (formatMatch) {
      filters.format = formatMatch[1].toLowerCase();
      query = query.replace(formatMatch[0], '').trim();
    }

    // Parse year syntax: (2020), (2015-2020), etc.
    const yearMatch = query.match(/\((\d{4}(?:-\d{4})?)\)/);
    if (yearMatch) {
      filters.year = yearMatch[1];
      query = query.replace(yearMatch[0], '').trim();
    }

    // Parse type syntax: {movie}, {tv}, {home}
    const typeMatch = query.match(/\{(movie|tv|home)\}/i);
    if (typeMatch) {
      filters.type = typeMatch[1].toLowerCase();
      query = query.replace(typeMatch[0], '').trim();
    }

    filters.text = query;
    return filters;
  };

  // Generate search suggestions
  const generateSuggestions = (query: string, videos: Video[]) => {
    if (!query || query.length < 2) return [];

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    videos.forEach(video => {
      const fileName = video.path.split(/[/\\]/).pop()?.toLowerCase() || '';
      const title = video.title?.toLowerCase() || '';
      const year = video.year?.toString() || '';

      // Add filename matches
      if (fileName.includes(lowerQuery)) {
        suggestions.add(fileName);
      }

      // Add title matches
      if (title.includes(lowerQuery)) {
        suggestions.add(video.title || '');
      }

      // Add year matches
      if (year.includes(lowerQuery)) {
        suggestions.add(year);
      }

      // Add format suggestions
      const extension = video.path.split('.').pop()?.toLowerCase();
      if (extension && extension.includes(lowerQuery)) {
        suggestions.add(`[${extension}]`);
      }

      // Add resolution suggestions based on filename patterns
      if (lowerQuery.includes('1080') || lowerQuery.includes('hd')) {
        suggestions.add('<1080>');
      }
      if (lowerQuery.includes('2160') || lowerQuery.includes('4k')) {
        suggestions.add('<4k>');
      }
      if (lowerQuery.includes('4320') || lowerQuery.includes('8k')) {
        suggestions.add('<8k>');
      }

      // Add type suggestions
      if (video.contentType === 'movie' && (lowerQuery.includes('movie') || lowerQuery.includes('film'))) {
        suggestions.add('{movie}');
      }
      if (video.contentType === 'tv-show' && lowerQuery.includes('tv')) {
        suggestions.add('{tv}');
      }
      if (video.contentType === 'home-media' && lowerQuery.includes('home')) {
        suggestions.add('{home}');
      }
    });

    return Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
  };

  // Enhanced search filtering
  const matchesSearchFilters = (video: Video, filters: any) => {
    const fileName = video.path.split(/[/\\]/).pop()?.toLowerCase() || '';
    const title = video.title?.toLowerCase() || '';
    const fullPath = video.path.toLowerCase();

    // Text search
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      if (!fileName.includes(searchText) && !title.includes(searchText) && !fullPath.includes(searchText)) {
        return false;
      }
    }

    // Resolution filter
    if (filters.resolution) {
      const hasResolution = (fileName.includes(filters.resolution) ||
                           (fileName.includes('p') && fileName.includes(filters.resolution))) ||
                           (filters.resolution === '2160' && (fileName.includes('4k') || fileName.includes('2160'))) ||
                           (filters.resolution === '4320' && (fileName.includes('8k') || fileName.includes('4320')));
      if (!hasResolution) return false;
    }

    // Format filter
    if (filters.format) {
      const extension = video.path.split('.').pop()?.toLowerCase();
      if (extension !== filters.format) return false;
    }

    // Year filter
    if (filters.year) {
      if (filters.year.includes('-')) {
        // Year range: (2015-2020)
        const [start, end] = filters.year.split('-').map((y: string) => parseInt(y));
        if (!video.year || video.year < start || video.year > end) return false;
      } else {
        // Single year: (2020)
        if (!video.year || video.year !== parseInt(filters.year)) return false;
      }
    }

    // Type filter
    if (filters.type) {
      const typeMap: any = {
        'movie': 'movie',
        'tv': 'tv-show',
        'home': 'home-media'
      };
      if (video.contentType !== typeMap[filters.type]) return false;
    }

    return true;
  };
  const [isLoading, setIsLoading] = useState(false);
  const [videoKey, setVideoKey] = useState(0); // For triggering video element re-animation
  const [viewMode, setViewMode] = useState<'grid'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>({ startupFolders: [], streamingMode: false, folderCategories: {} });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'tv' | 'movies' | 'my-list' | 'settings'>('home');

  // Auto-detect content type based on filename and folder structure
  const detectContentType = (filePath: string): 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media' => {
    const fileName = filePath.toLowerCase();
    const folderPath = filePath.toLowerCase();
    
    // TV Show patterns - expanded
    if (fileName.match(/s\d{1,2}e\d{1,2}|season\s*\d+|episode\s*\d+|\d{1,2}x\d{1,2}/i) ||
        folderPath.includes('tv') || folderPath.includes('series') || folderPath.includes('shows') ||
        fileName.match(/\b(ep|episode)\s*\d+\b/i) ||
        fileName.match(/\bseason\s*\d+\s*episode\s*\d+\b/i) ||
        fileName.match(/\b(s\d+)\s*(e\d+)\b/i)) {
      return 'tv-show';
    }
    
    // Documentary patterns
    if (fileName.includes('documentary') || fileName.includes('docu') ||
        folderPath.includes('documentary') || folderPath.includes('docs') ||
        fileName.match(/\b(national.geographic|discovery|history.channel|bbc.documentary)\b/i)) {
      return 'documentary';
    }
    
    // Short film patterns
    if (fileName.includes('short') || fileName.includes('shorts') ||
        folderPath.includes('short') || folderPath.includes('shorts') ||
        fileName.match(/\b(short.film|short.movie)\b/i)) {
      return 'short';
    }
    
    // Music video patterns
    if (fileName.includes('music.video') || fileName.includes('mv') ||
        folderPath.includes('music') || folderPath.includes('videos') ||
        fileName.match(/\b(music|video|mv)\b.*\b(video|music|mv)\b/i) ||
        fileName.match(/\b(official.video|official.music.video)\b/i)) {
      return 'music-video';
    }
    
    // Movie patterns (years, movie folders, etc.) - expanded
    if (fileName.match(/\b(19|20)\d{2}\b/) || 
        folderPath.includes('movie') || folderPath.includes('film') ||
        folderPath.includes('movies') || folderPath.includes('films') ||
        fileName.match(/\b(feature.film|motion.picture)\b/i) ||
        fileName.match(/\b(dvd|bluray|blu.ray)\b/i)) {
      return 'movie';
    }
    
    // Default to home media
    return 'home-media';
  };

  // Extract video metadata from filename
  const extractVideoMetadata = React.useCallback((filePath: string) => {
    const fileName = filePath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || '';
    const contentType = detectContentType(filePath);
    
    let title = fileName;
    let season: number | undefined;
    let episode: number | undefined;
    let year: number | undefined;
    
    // Extract season/episode for TV shows
    if (contentType === 'tv-show') {
      const sMatch = fileName.match(/s(\d{1,2})e(\d{1,2})/i);
      const xMatch = fileName.match(/(\d{1,2})x(\d{1,2})/);
      const epMatch = fileName.match(/\b(ep|episode)\s*(\d+)\b/i);
      const seasonEpMatch = fileName.match(/\bseason\s*(\d+)\s*episode\s*(\d+)\b/i);
      
      if (sMatch) {
        season = parseInt(sMatch[1]);
        episode = parseInt(sMatch[2]);
        title = fileName.replace(/s\d{1,2}e\d{1,2}.*/i, '').trim();
      } else if (xMatch) {
        season = parseInt(xMatch[1]);
        episode = parseInt(xMatch[2]);
        title = fileName.replace(/\d{1,2}x\d{1,2}.*/i, '').trim();
      } else if (seasonEpMatch) {
        season = parseInt(seasonEpMatch[1]);
        episode = parseInt(seasonEpMatch[2]);
        title = fileName.replace(/\bseason\s*\d+\s*episode\s*\d+.*/i, '').trim();
      } else if (epMatch) {
        episode = parseInt(epMatch[2]);
        title = fileName.replace(/\b(ep|episode)\s*\d+.*/i, '').trim();
      }
    }
    
    // Extract year for movies and other content
    const yearMatch = fileName.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[0]);
      title = title.replace(yearMatch[0], '').trim();
    }
    
    // Clean up title - remove common separators and extra spaces
    title = title.replace(/[[\]()\-_.]/g, ' ').replace(/\s+/g, ' ').trim();
    // Remove common video file suffixes
    title = title.replace(/\b(1080p|720p|4k|hd|bluray|dvd|web|rip|h264|h265|x264|x265)\b/gi, '').trim();
    // Remove multiple spaces again
    title = title.replace(/\s+/g, ' ').trim();
    
    return { title, season, episode, year, contentType };
  }, []);

  // Load settings and user profile on component mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await api.loadSettings();
        console.log('Loaded settings:', loadedSettings);
        
        // Ensure startupFolders is always an array
        if (!loadedSettings.startupFolders) {
          loadedSettings.startupFolders = [];
        }
        
        // Migrate from old single startupFolder to new startupFolders array
        if (loadedSettings.startupFolder && !loadedSettings.startupFolders) {
          loadedSettings.startupFolders = [loadedSettings.startupFolder];
          delete loadedSettings.startupFolder;
          console.log('Migrated startupFolder to startupFolders:', loadedSettings.startupFolders);
        }
        
        // Check if user profile exists
        if (loadedSettings.userProfile) {
          setUserProfile(loadedSettings.userProfile);
        } else {
          // Show onboarding if no profile exists
          setShowOnboarding(true);
        }

        const scanFolders = async () => {
          const allVideos: any[] = [];
          
          for (const folder of loadedSettings.startupFolders) {
            // Skip excluded folders
            if (loadedSettings.excludedFolders && loadedSettings.excludedFolders.includes(folder)) {
              console.log('Skipping excluded folder:', folder);
              continue;
            }
            
            try {
              console.log('Auto-scanning folder:', folder);
              const vids = await api.scanVideos(folder, { thumbnailPercentage: loadedSettings.thumbnailPercentage, thumbnailJitter: loadedSettings.thumbnailJitter });
              console.log(`Auto-scan found ${vids.length} videos in ${folder}`);
              
              // Filter out videos from excluded subfolders
              const filteredVids = (Array.isArray(vids) ? vids : []).filter((vid: any) => {
                if (typeof vid === 'string') {
                  // Check if video path is in an excluded folder
                  return !loadedSettings.excludedFolders?.some((excludedFolder: string) => 
                    vid.startsWith(excludedFolder)
                  );
                }
                return !loadedSettings.excludedFolders?.some((excludedFolder: string) => 
                  vid.path?.startsWith(excludedFolder)
                );
              });
              
              const normalized = filteredVids.map((v: any, idx: number) => {
                if (typeof v === 'string') {
                  const metadata = extractVideoMetadata(v);
                  return { 
                    path: v, 
                    thumbnail: '', 
                    watchedProgress: idx % 3 === 0 ? Math.floor(Math.random() * 100) : 0,
                    isPrivate: false, // Default to not private
                    category: 'general',
                    ...metadata
                  };
                }
                return { 
                  ...v, 
                  isPrivate: v.isPrivate ?? false,
                  category: v.category ?? 'general',
                  contentType: v.contentType ?? 'home-media'
                };
              });
              allVideos.push(...normalized);
            } catch (error) {
              console.error('Error auto-scanning folder:', folder, error);
            }
          }
          
          console.log('Total videos from all folders:', allVideos.length);
          
          // Apply saved favorites and content types
          const videosWithSavedData = allVideos.map(video => {
            // Apply saved favorite status
            const savedFavorite = loadedSettings.favorites?.find((fav: any) => fav.path === video.path);
            const isFavorite = savedFavorite ? true : (video.isFavorite ?? false);
            
            // Apply saved content type
            const savedContentType = loadedSettings.contentTypes?.find((ct: any) => ct.path === video.path);
            const contentType = savedContentType ? savedContentType.contentType : video.contentType;
            
            return {
              ...video,
              isFavorite,
              contentType
            };
          });
          
          setVideos(videosWithSavedData);
        };
        
        // Auto-scan startup folders if they exist (regardless of autoScan setting)
        if (loadedSettings.startupFolders && loadedSettings.startupFolders.length > 0) {
          console.log('Scanning startup folders:', loadedSettings.startupFolders);
          scanFolders();
        } else if (loadedSettings.autoScan === true) {
          console.log('Auto-scan enabled but no startup folders configured');
        } else {
          console.log('No startup folders configured. autoScan:', loadedSettings.autoScan);
        }
        
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        // Show onboarding on error too
        setShowOnboarding(true);
      }
    };
    loadSettings();
  }, [extractVideoMetadata]);

  const saveSettings = React.useCallback(async (newSettings: any) => {
    try {
      const success = await api.saveSettings(newSettings);
      if (success) {
        setSettings(newSettings);
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    setShowOnboarding(false);
    
    // Save user profile to settings
    const updatedSettings = { ...settings, userProfile: profile };
    await saveSettings(updatedSettings);
  };

  const rescanStartupFolders = React.useCallback(async (currentSettings: any) => {
    const allVideos: any[] = [];
    
    for (const folder of currentSettings.startupFolders) {
      // Skip excluded folders
      if (currentSettings.excludedFolders && currentSettings.excludedFolders.includes(folder)) {
        console.log('Skipping excluded folder:', folder);
        continue;
      }
      
      try {
        console.log('Re-scanning folder:', folder);
        const vids = await api.scanVideos(folder, { 
          thumbnailPercentage: currentSettings.thumbnailPercentage,
          thumbnailJitter: currentSettings.thumbnailJitter 
        });
        console.log(`Re-scan found ${vids.length} videos in ${folder}`);
        
        // Filter out videos from excluded subfolders
        const filteredVids = (Array.isArray(vids) ? vids : []).filter((vid: any) => {
          if (typeof vid === 'string') {
            // Check if video path is in an excluded folder
            return !currentSettings.excludedFolders?.some((excludedFolder: string) => 
              vid.startsWith(excludedFolder)
            );
          }
          return !currentSettings.excludedFolders?.some((excludedFolder: string) => 
            vid.path?.startsWith(excludedFolder)
          );
        });
        
        const normalized = filteredVids.map((v: any, idx: number) => {
          if (typeof v === 'string') {
            const metadata = extractVideoMetadata(v);
            return { 
              path: v, 
              thumbnail: '', 
              watchedProgress: idx % 3 === 0 ? Math.floor(Math.random() * 100) : 0,
              isPrivate: false, // Default to not private
              category: 'general',
              ...metadata
            };
          }
          return { 
            ...v, 
            isPrivate: v.isPrivate ?? false,
            category: v.category ?? 'general',
            contentType: v.contentType ?? 'home-media'
          };
        });
        allVideos.push(...normalized);
      } catch (error) {
        console.error('Error re-scanning folder:', folder, error);
      }
    }
    
    console.log('Total videos from re-scan:', allVideos.length);
    
    // Apply saved favorites and content types
    const videosWithSavedData = allVideos.map(video => {
      // Apply saved favorite status
      const savedFavorite = currentSettings.favorites?.find((fav: any) => fav.path === video.path);
      const isFavorite = savedFavorite ? true : (video.isFavorite ?? false);
      
      // Apply saved content type
      const savedContentType = currentSettings.contentTypes?.find((ct: any) => ct.path === video.path);
      const contentType = savedContentType ? savedContentType.contentType : video.contentType;
      
      return {
        ...video,
        isFavorite,
        contentType
      };
    });
    
    setVideos(videosWithSavedData);
  }, [extractVideoMetadata]);

  const updateVideoContentType = React.useCallback((path: string, newContentType: 'movie' | 'tv-show' | 'documentary' | 'short' | 'music-video' | 'home-media') => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.path === path 
          ? { ...video, contentType: newContentType } 
          : video
      )
    );
    
    // Save content types to settings
    const contentTypes = videos
      .filter(video => video.path === path || video.contentType !== 'home-media')
      .map(video => ({
        path: video.path,
        contentType: video.path === path ? newContentType : video.contentType
      }));
    
    const updatedSettings = { ...settings, contentTypes };
    saveSettings(updatedSettings);
  }, [videos, settings, saveSettings]);

  // Function to play a video by setting it as selected
  const playVideo = React.useCallback((filePath: string) => {
    setSelectedVideo(filePath);
  }, []);

  // Handle file opening from Windows file associations
  React.useEffect(() => {
    const handleFileOpen = (filePath: string) => {
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

    // Set up the event listener using the preload API
    api.onOpenFile(handleFileOpen);

    // Cleanup is handled by the preload API
  }, [playVideo]);

  const selectDirectory = async () => {
    try {
      setIsLoading(true);
      const dir = await api.selectDirectory();
      if (dir) {
        console.log('Selected directory:', dir);
        const vids = await api.scanVideos(dir, { thumbnailPercentage: settings.thumbnailPercentage, thumbnailJitter: settings.thumbnailJitter });
        console.log('Received videos:', vids);
        const normalized = (Array.isArray(vids) ? vids : []).map((v: any, idx: number) => {
          if (typeof v === 'string') {
            const metadata = extractVideoMetadata(v);
            return { 
              path: v, 
              thumbnail: '', 
              watchedProgress: idx % 3 === 0 ? Math.floor(Math.random() * 100) : 0,
              isPrivate: false, // Default to not private
              category: 'general',
              ...metadata
            };
          }
          return { 
            ...v, 
            isPrivate: v.isPrivate ?? false,
            category: v.category ?? 'general',
            contentType: v.contentType ?? 'home-media'
          };
        });
        console.log('Normalized videos:', normalized.length, normalized[0]);
        
        // Apply saved favorites and content types
        const videosWithSavedData = normalized.map(video => {
          // Apply saved favorite status
          const savedFavorite = settings.favorites?.find((fav: any) => fav.path === video.path);
          const isFavorite = savedFavorite ? true : (video.isFavorite ?? false);
          
          // Apply saved content type
          const savedContentType = settings.contentTypes?.find((ct: any) => ct.path === video.path);
          const contentType = savedContentType ? savedContentType.contentType : video.contentType;
          
          return {
            ...video,
            isFavorite,
            contentType
          };
        });
        
        setVideos(videosWithSavedData);
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
      const success = await api.deleteVideo(path);
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
      const filePath = await api.openFileDialog();
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
      const drive: string | null = await api.chooseDiscDrive();
      if (!drive) {
        return;
      }
  // Scanning disc
      const result: any = await api.scanDisc(drive);
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
        const outPath: string | null = await api.convertDvdTitle(vobs);
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
      await api.showInExplorer(filePath);
    } catch (error) {
      console.error('Error showing in explorer:', error);
    }
  };

  const filteredVideos = videos.filter(video => {
    // Apply search term filter with advanced syntax
    if (searchTerm) {
      const filters = parseSearchQuery(searchTerm);
      if (!matchesSearchFilters(video, filters)) {
        return false;
      }
    }

    // Apply excluded folders filter
    if (settings.excludedFolders) {
      const isExcluded = settings.excludedFolders.some((excludedFolder: string) =>
        video.path.startsWith(excludedFolder)
      );
      if (isExcluded) return false;
    }

    // Apply video format compatibility filter
    if (settings.hideIncompatibleFormats !== false) {
      const supportedExtensions = ['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'];
      const fileExtension = video.path.toLowerCase().substring(video.path.lastIndexOf('.'));
      if (!supportedExtensions.includes(fileExtension)) {
        return false;
      }
    }

    // Apply unwatched filter
    if (settings.filterUnwatched && video.watchedProgress && video.watchedProgress > 0) {
      return false;
    }

    // Apply short videos filter (if we had duration data)
    // if (settings.hideShortVideos && video.duration && video.duration < 300) {
    //   return false;
    // }

    return true;
  });

  const getPageFilteredVideos = (page: string) => {
    let pageFiltered = filteredVideos;

    switch (page) {
      case 'tv':
        pageFiltered = filteredVideos.filter(video => video.contentType === 'tv-show');
        break;
      case 'movies':
        pageFiltered = filteredVideos.filter(video => video.contentType === 'movie');
        break;
      case 'my-list':
        // Show videos marked as favorites, private, or in progress
        pageFiltered = filteredVideos.filter(video => 
          video.isFavorite === true || 
          video.isPrivate === true || 
          (video.watchedProgress && video.watchedProgress > 0)
        );
        break;
      case 'home':
      default:
        pageFiltered = filteredVideos;
        break;
    }

    return pageFiltered;
  };

  const getPageSortedVideos = (page: string) => {
    const pageFiltered = getPageFilteredVideos(page);
    return [...pageFiltered].sort((a, b) => {
      const sortOrder = settings.sortOrder || 'name-asc';
      const [field, direction] = sortOrder.split('-');
      
      let comparison = 0;
      
      switch (field) {
        case 'name':
          const nameA = a.path.split(/[/\\]/).pop()?.toLowerCase() || '';
          const nameB = b.path.split(/[/\\]/).pop()?.toLowerCase() || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'date':
          // For now, sort by path as we don't have date info
          comparison = a.path.localeCompare(b.path);
          break;
        case 'size':
          // For now, sort by path as we don't have size info
          comparison = a.path.localeCompare(b.path);
          break;
        case 'modified':
          // For now, sort by path as we don't have modified date info
          comparison = a.path.localeCompare(b.path);
          break;
        default:
          comparison = a.path.localeCompare(b.path);
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
  };

  return (
    <div className="App">
      {route === '/multi-player' ? (
        <MultiPlayer />
      ) : (
        <>
          {/* Onboarding Screen */}
          {showOnboarding && (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          )}

          {/* Main App Content */}
          {!showOnboarding && (
            <>
              <header className="App-header">
                <div className="header-left">
                  <div className="logo">
                    <div className="logo-icon">▶</div>
                    <h1>EwPlayer</h1>
                  </div>
                  {/* Primary Navigation */}
                  <nav className="primary-nav">
                    <button 
                      className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('home')}
                    >
                      Home
                    </button>
                    <button 
                      className={`nav-link ${currentPage === 'tv' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('tv')}
                    >
                      TV
                    </button>
                    <button 
                      className={`nav-link ${currentPage === 'movies' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('movies')}
                    >
                      Movies
                    </button>
                    <button 
                      className={`nav-link ${currentPage === 'my-list' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('my-list')}
                    >
                      My List
                    </button>
                  </nav>
                </div>
                <div className="search-container">
                  <button 
                    className="search-icon-btn"
                    onClick={() => setIsSearchModalOpen(true)}
                    title="Search videos"
                  >
                    <SearchIcon />
                  </button>
                </div>
                <div className="header-actions">
                  <button 
                    className="settings-btn"
                    onClick={() => setShowSettings(true)}
                    title={userProfile ? `${userProfile.name}'s Settings` : "Settings"}
                  >
                    <SettingsIcon />
                  </button>
                </div>
                <div className="window-controls">
                  <button className="window-btn minimize-btn" onClick={minimizeWindow}>−</button>
                  <button className="window-btn maximize-btn" onClick={maximizeWindow}>□</button>
                  <button className="window-btn close-btn" onClick={closeWindow}>×</button>
                </div>
              </header>
          <main className={`main-content ${selectedVideo ? 'with-video' : 'no-video'}`}>
            {selectedVideo ? (
              <Player
                selectedVideo={selectedVideo}
                videos={videos}
                filteredVideos={filteredVideos}
                userProfile={userProfile}
                videoKey={videoKey}
                onVideoSelect={playVideo}
                onBackToLibrary={() => setSelectedVideo(null)}
                onDeleteVideo={deleteVideo}
                onShowInExplorer={showInExplorer}
              />
            ) : settings.theaterMode ? (
              <StreamingInterface 
                videos={getPageFilteredVideos(currentPage)}
                userProfile={userProfile}
                onVideoSelect={playVideo}
                settings={settings}
                currentPage={currentPage}
              />
            ) : (
              <Library
                videos={videos}
                filteredVideos={getPageFilteredVideos(currentPage)}
                sortedVideos={getPageSortedVideos(currentPage)}
                userProfile={userProfile}
                viewMode={viewMode}
                setViewMode={setViewMode}
                sortBy={sortBy}
                setSortBy={setSortBy}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onVideoSelect={playVideo}
                onOpenDisc={openDisc}
                onSelectDirectory={selectDirectory}
                onOpenSingleFile={openSingleFile}
                onShowInExplorer={showInExplorer}
                onDeleteVideo={deleteVideo}
                setVideos={setVideos}
                onUpdateContentType={updateVideoContentType}
                cardSize={settings.cardSize || 'medium'}
                cardSpacing={settings.cardSpacing || 'normal'}
                currentPage={currentPage}
                saveSettings={saveSettings}
                settings={settings}
              />
            )}
          </main>

          {/* Settings Panel */}
          {showSettings && (
            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
              saveSettings={saveSettings}
              userProfile={userProfile}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Search Modal */}
          <SearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            videos={videos}
            onVideoSelect={(path) => {
              playVideo(path);
              setIsSearchModalOpen(false);
            }}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
