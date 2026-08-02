import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function IframeModal({ url, onClose }) {
  const secureUrl = url.startsWith('http') ? url : `https://${url}`;
  const [viewMode, setViewMode] = useState('iframe'); // 'iframe' | 'screenshot'

  const encodedUrl = encodeURIComponent(secureUrl);
  const screenshotFallback = `https://s0.wp.com/mshots/v1/${encodedUrl}?w=1280&h=960`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.fullScreenModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.liveIndicator} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }}></div>
            <h2>Preview: {secureUrl.replace(/^https?:\/\//, '')}</h2>

            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '6px' }}>
              <button
                onClick={() => setViewMode('iframe')}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'iframe' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                🌐 Live Site
              </button>
              <button
                onClick={() => setViewMode('screenshot')}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'screenshot' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                📸 Screenshot Backup
              </button>
            </div>

            <a href={secureUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold' }}>
              ↗ Open in new tab
            </a>
          </div>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.iframeContainer} style={{ width: '100%', height: 'calc(100vh - 120px)', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          {viewMode === 'iframe' ? (
            <iframe 
              src={secureUrl} 
              title="Website Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: '#111', display: 'flex', justifyContent: 'center' }}>
              <img 
                src={screenshotFallback} 
                alt="Website Screenshot Backup" 
                style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
