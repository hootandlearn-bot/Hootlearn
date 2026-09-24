import { FileText, Play, DownloadCloud, Lock } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import './ResourceGrid.css';

const ResourceCard = ({ res, onOpen, getActionDetails }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const action = getActionDetails(res.actionType);
  const urlWithoutQuery = res.fileUrl ? res.fileUrl.split('?')[0].toLowerCase() : '';
  const isWord = urlWithoutQuery.endsWith('.doc') || urlWithoutQuery.endsWith('.docx');
  const isPdf = urlWithoutQuery.endsWith('.pdf');
  const isVideo = res.actionType === 'video' || res.actionType === 'Watch Video' || urlWithoutQuery.endsWith('.mp4');
  const isImage = urlWithoutQuery.endsWith('.jpg') || urlWithoutQuery.endsWith('.jpeg') || urlWithoutQuery.endsWith('.png') || urlWithoutQuery.endsWith('.gif') || urlWithoutQuery.endsWith('.webp');
  
  const hasPdfPreview = isPdf;
  const isMissing = !res.fileUrl;

  const actionLabel = isMissing ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: '600' }}>
      <FileText size={14} /> Coming Soon
    </span>
  ) : action.label;

  return (
    <div ref={ref} className="rg-card" onClick={() => onOpen(res)}>
      <div className={`rg-cover ${isWord ? 'word-bg' : isPdf ? 'pdf-bg' : isVideo ? 'video-bg' : 'default-bg'}`}>
        {isImage && res.fileUrl && inView ? (
          <img 
            src={res.fileUrl} 
            alt={res.title}
            className="rg-pdf-preview" 
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        ) : (
          <>
            <span className="rg-spine" />
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isWord && <FileText size={64} className="rg-icon" style={{ opacity: 0.95, color: '#ffffff' }} />}
              {isPdf && <BookOpen size={64} className="rg-icon" style={{ opacity: 0.95, color: '#ffffff' }} />}
              {isVideo && <Play size={64} className="rg-icon" style={{ opacity: 0.95, color: '#ffffff' }} />}
              {isMissing && <FileText size={64} className="rg-icon" style={{ opacity: 0.5, color: '#ffffff' }} />}
              
              {isWord && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -35%)', color: '#1D4ED8', fontWeight: '900', fontSize: '26px', background: 'white', padding: '0px 6px', borderRadius: '4px' }}>W</div>
              )}
            </div>
            
            {/* Top Right Action Icon */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.75)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)' }}>
              {isMissing ? <FileText size={18} /> : action.icon && <div style={{ transform: 'scale(0.5)', display: 'flex' }}>{action.icon}</div>}
            </div>
          </>
        )}
      </div>
      <div className="rg-info">
        <span className="rg-cat">{res.category}</span>
        <h4 className="rg-title">{res.title}</h4>
        <span className="rg-action">{actionLabel}</span>
      </div>
    </div>
  );
};

const ResourceGrid = ({ resources, onOpen }) => {
  if (resources.length === 0) {
    return (
      <div className="rg-empty">
        <p>No resources found in this section yet.</p>
      </div>
    );
  }

  const getActionDetails = (actionType) => {
    switch (actionType) {
      case 'download':
        return { label: 'Download PDF →', icon: <DownloadCloud size={48} className="rg-icon" /> };
      case 'video':
        return { label: 'Watch Video →', icon: <Play size={48} className="rg-icon" /> };
      case 'flipbook':
      default:
        return { label: 'Read Book →', icon: <FileText size={48} className="rg-icon" /> };
    }
  };

  return (
    <div className="rg-grid">
      {resources.map((res) => (
        <ResourceCard key={res.id} res={res} onOpen={onOpen} getActionDetails={getActionDetails} />
      ))}
    </div>
  );
};

export default ResourceGrid;
