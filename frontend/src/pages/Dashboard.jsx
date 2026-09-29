import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, Mail, Briefcase, Video, GraduationCap, LogOut, Search, Folder, Menu, LayoutGrid, List } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ResourceGrid from '../components/ResourceGrid';
import PdfViewer from '../components/PdfViewer';
import './Dashboard.css';

const ICON_MAP = {
  BookOpen: <BookOpen size={20} />,
  Calendar: <Calendar size={20} />,
  Mail: <Mail size={20} />,
  Briefcase: <Briefcase size={20} />,
  Video: <Video size={20} />,
  GraduationCap: <GraduationCap size={20} />,
  Folder: <Folder size={20} />
};

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || '';
  const activeFolderId = searchParams.get('folder') || null;
  const [viewMode, setViewMode] = useState('grid');

  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState({});
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    if (!token) {
      navigate('/login?redirect=/dashboard');
      return;
    }

    // Fetch live resources
    const fetchLiveResources = async () => {
      try {
        const catRes = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(cats);
          if (cats.length > 0 && !activeSection) setSearchParams({ section: cats[0].slug });
        }

        const folRes = await fetch(`${import.meta.env.VITE_API_URL}/api/folders`);
        if (folRes.ok) {
          setFolders(await folRes.json());
        }

        let res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (res.status === 401 || res.status === 403) {
          const errorData = await res.json();
          if (errorData.code === 'TOKEN_EXPIRED' && token) {
            try {
              const refreshRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                sessionStorage.setItem('userToken', refreshData.token);
                // Retry fetch with new token
                res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
                  headers: { 'Authorization': `Bearer ${refreshData.token}` }
                });
                if (!res.ok) throw new Error('Retry failed');
              } else {
                throw new Error('Refresh failed');
              }
            } catch (err) {
              alert('Session expired. Please log in again.');
              sessionStorage.removeItem('userToken');
              navigate('/login');
              return;
            }
          } else {
            alert(errorData.error || 'Session expired. Please log in again.');
            sessionStorage.removeItem('userToken');
            navigate('/login');
            return;
          }
        }

        const data = await res.json();
        
        // Group them by category
        const grouped = data.reduce((acc, resource) => {
          if (!acc[resource.category]) acc[resource.category] = [];
          
          if (resource.actionType === 'video' && resource.fileUrl) {
            resource.videoUrl = resource.fileUrl;
          }
          
          acc[resource.category].push(resource);
          return acc;
        }, {});
        
        setResources(grouped);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchLiveResources();

    // Global Anti-Piracy logic (ENABLED FOR PROD)
    const clearClipboard = () => {
      try {
        navigator.clipboard.writeText('Screenshots and copying are strictly prohibited on this platform.').catch(() => {});
      } catch (err) {}
    };

    const handleInteraction = () => {
      setIsObscured(false);
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        clearClipboard();
      }
      // Catch PrintScreen, Mac Command+Shift+3/4/5, Windows Win+Shift+S
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || (e.metaKey && e.shiftKey)) {
        setIsObscured(true);
        clearClipboard();
      } else {
        setIsObscured(false);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        setIsObscured(true);
        clearClipboard();
      }
    };

    const handleDragStart = (e) => e.preventDefault();
    
    const handleBlur = () => {
      setIsObscured(true);
      clearClipboard();
    };
    const handleFocus = () => setIsObscured(false);
    const handleVisibilityChange = () => {
      if (document.hidden) setIsObscured(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const allResources = Object.values(resources).flat();
  
  const currentCategoryResources = resources[activeSection] || [];
  
  let activeResources;
  let visibleFolders = [];

  let sourceResources = allResources;
  if (activeFolderId) {
    sourceResources = currentCategoryResources.filter(r => r.folderId === activeFolderId);
  } else if (activeSection) {
    sourceResources = currentCategoryResources;
  }

  if (searchQuery.trim() !== '') {
    activeResources = sourceResources.filter(res => res.title.toLowerCase().includes(searchQuery.toLowerCase()));
  } else {
    if (activeFolderId) {
      activeResources = currentCategoryResources.filter(r => r.folderId === activeFolderId);
    } else {
      activeResources = currentCategoryResources.filter(r => !r.folderId);
      visibleFolders = folders.filter(f => f.categorySlug === activeSection);
    }
  }

  const sections = categories.map(c => ({
    id: c.slug,
    label: c.name,
    icon: ICON_MAP[c.icon] || <Folder size={20} />
  }));
  const currentSectionDetails = sections.find(s => s.id === activeSection);
  const currentFolderDetails = folders.find(f => f.id === activeFolderId);
  
  const displayTitle = searchQuery.trim() !== '' 
    ? 'Search Results' 
    : activeFolderId && currentFolderDetails
      ? currentFolderDetails.name
      : `${currentSectionDetails?.label || 'Library'}`;

  const handleResourceClick = (res) => {
    if (!sessionStorage.getItem('userToken')) {
      navigate('/login?redirect=/dashboard');
      return;
    }
    
    // If fileUrl is missing, it means the admin hasn't uploaded a file for this resource yet.
    if (!res.fileUrl) {
      alert("This resource is not available yet (file missing).");
      return;
    }

    if (res.actionType === 'video') {
      setSelectedVideo(res);
    } else {
      setSelectedPdf(res);
    }
  };

  const handleFolderClick = (folderId) => {
    setSearchParams({ section: activeSection, folder: folderId });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <>
      {isObscured && (
        <div className="global-security-shield">
          <h2>🚨 Security Alert</h2>
          <p>Recording or screenshot is disabled and piracy is not allowed.</p>
        </div>
      )}
      <div className={`dash-layout ${isObscured ? 'obscured' : ''}`} onContextMenu={(e) => e.preventDefault()}>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
        )}
        
        {/* Sidebar Navigation */}
        <Sidebar 
          sections={sections} 
          activeSection={activeSection} 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onSelect={(id) => { 
            setSearchParams({ section: id }); 
            setSearchQuery(''); 
            setIsMobileMenuOpen(false);
          }} 
          isLoggedIn={!!sessionStorage.getItem('userToken')}
          onLogout={handleLogout}
          onLogin={() => navigate('/login?redirect=/dashboard')}
        />

        {/* Main Content Area */}
        <div className="dash-main">
          <header className="dash-header">
            <div className="dash-header-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="mobile-menu-btn" 
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={24} />
                </button>
                <h2>{displayTitle}</h2>
              </div>
              <p>{searchQuery.trim() !== '' ? `Showing all resources matching "${searchQuery}"` : 'Select a book or document to read.'}</p>
            </div>
            <div className="dash-header-right">
              <div className="view-toggle-wrapper">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
              <div className="dash-search-box">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {sessionStorage.getItem('userToken') ? (
                <button onClick={handleLogout} className="student-logout-btn">
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <button onClick={() => navigate('/login?redirect=/dashboard')} className="student-logout-btn" style={{background: '#3b82f6', color: 'white'}}>
                  Login to Access
                </button>
              )}
            </div>
          </header>

          <div className="dash-content">
            {activeFolderId && !searchQuery.trim() && (
              <button onClick={() => setSearchParams({ section: activeSection })} className="back-btn" style={{ marginBottom: '20px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                ⬅ Back to {currentSectionDetails?.label}
              </button>
            )}

            {visibleFolders.length > 0 && !searchQuery.trim() && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '1.2rem' }}>Folders</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {visibleFolders.map(f => (
                    <div key={f.id} onClick={() => handleFolderClick(f.id)} style={{ padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} className="folder-card">
                      <Folder size={28} color="#3b82f6" />
                      <span style={{ fontWeight: '500', color: '#334155' }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeResources.length > 0 || searchQuery.trim()) && (
              <div>
                {visibleFolders.length > 0 && <h3 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '1.2rem' }}>Files</h3>}
                <ResourceGrid resources={activeResources} onOpen={handleResourceClick} viewMode={viewMode} />
              </div>
            )}
            
            {activeResources.length === 0 && visibleFolders.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <Folder size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>No resources found in this section.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF / Document Modal Overlay */}
      {selectedPdf && (
        <div className="pdf-modal-overlay" onClick={() => setSelectedPdf(null)}>
          <div className="pdf-modal-content" onClick={e => e.stopPropagation()}>
            {/* If it's a regular document or image, show the outer header. If PDF, PdfViewer handles it. */}
            {(() => {
              if (!selectedPdf.fileUrl) return null;
              const urlWithoutQuery = selectedPdf.fileUrl.split('?')[0].toLowerCase();
              const isPdf = !urlWithoutQuery.endsWith('.doc') && !urlWithoutQuery.endsWith('.docx') && !urlWithoutQuery.match(/\.(jpeg|jpg|gif|png|webp)$/i);
              
              return (
                <>
                  {!isPdf && (
                    <div className="pdf-modal-header">
                      <h3>{selectedPdf.title}</h3>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {selectedPdf.actionType === 'download' && (
                          <a 
                            href={selectedPdf.fileUrl} 
                            download={selectedPdf.title}
                            target="_blank"
                            rel="noreferrer"
                            className="pdf-download-btn"
                          >
                            ⬇ Download
                          </a>
                        )}
                        <button className="pdf-close-btn" onClick={() => setSelectedPdf(null)}>✕</button>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ flex: 1, position: 'relative' }}>
                    {urlWithoutQuery.endsWith('.doc') || urlWithoutQuery.endsWith('.docx') ? (
                      <iframe 
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedPdf.fileUrl)}`} 
                        width="100%" 
                        height="100%" 
                        frameBorder="0"
                        title="Word Document Viewer"
                      >
                        This is an embedded <a target="_blank" href="http://office.com" rel="noreferrer">Microsoft Office</a> document.
                      </iframe>
                    ) : urlWithoutQuery.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                        <img src={selectedPdf.fileUrl} alt={selectedPdf.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                    ) : (
                      <PdfViewer 
                        documentData={selectedPdf} 
                        onClose={() => setSelectedPdf(null)} 
                      />
                    )}
                  </div>
                </>
              );
            })()}
            
            {!selectedPdf.fileUrl && (
              <div style={{ flex: 1, position: 'relative' }}>
                <div className="pdf-viewer-placeholder">
                  <p>📄 Coming Soon!</p>
                  <span>This sample doesn't have a file attached yet.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div className="pdf-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="pdf-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', height: 'auto', background: '#0f172a', border: 'none' }}>
            <div className="pdf-modal-header" style={{ borderBottom: '1px solid #1e293b', color: 'white' }}>
              <h3>{selectedVideo.title}</h3>
              <button className="pdf-close-btn" style={{ color: 'white', background: '#334155' }} onClick={() => setSelectedVideo(null)}>✕</button>
            </div>
            <div style={{ padding: '20px', background: 'black', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <video 
                src={selectedVideo.videoUrl} 
                controls 
                controlsList="nodownload" 
                onContextMenu={(e) => e.preventDefault()} 
                autoPlay 
                style={{ width: '100%', borderRadius: '8px' }} 
                onError={(e) => {
                  console.error("Video Error: ", e.target.error);
                  alert("Failed to load video. Please ensure the file is an .mp4 format and the network connection is stable.");
                }}
              >
                Your browser does not support playing this video.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
