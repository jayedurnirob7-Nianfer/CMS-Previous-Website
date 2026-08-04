'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function IframeModal({ url, onClose }) {
  const secureUrl = url ? (url.startsWith('http') ? url : `https://${url}`) : '';
  const formattedUrl = secureUrl.replace(/^https?:\/\//, '');
  const encodedUrl = encodeURIComponent(secureUrl);

  const [viewMode, setViewMode] = useState('iframe'); // 'iframe' | 'screenshot'
  const [providerIndex, setProviderIndex] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);

  const providers = [
    { id: 0, name: 'Backup 1 (Thum)', src: `https://image.thum.io/get/width/1280/crop/900/${formattedUrl}` },
    { id: 1, name: 'Backup 2 (mShots)', src: `https://s0.wp.com/mshots/v1/${encodedUrl}?w=1280&h=960` },
    { id: 2, name: 'Backup 3 (Microlink)', src: `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&embed=screenshot.url` },
    { id: 3, name: 'Backup 4 (S-Shot)', src: `https://mini.s-shot.ru/1280x960/JPEG/1280/Z100/?${encodedUrl}` }
  ];

  const currentProvider = providers[providerIndex];

  const handleProviderSelect = (idx) => {
    setProviderIndex(idx);
    setImgLoading(true);
    setViewMode('screenshot');
  };

  const handleImgError = () => {
    // Automatically try the next provider on error
    if (providerIndex < providers.length - 1) {
      setProviderIndex(prev => prev + 1);
    } else {
      setImgLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.fullScreenModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.liveIndicator} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }}></div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Preview: {formattedUrl}</h2>

            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('iframe')}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'iframe' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.825rem'
                }}
              >
                🌐 Live Site
              </button>

              {providers.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderSelect(idx)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: (viewMode === 'screenshot' && providerIndex === idx) ? '#6366f1' : 'rgba(255,255,255,0.08)',
                    color: (viewMode === 'screenshot' && providerIndex === idx) ? '#fff' : '#cbd5e1',
                    cursor: 'pointer',
                    fontWeight: (viewMode === 'screenshot' && providerIndex === idx) ? 'bold' : 'normal',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📸 {p.name}
                </button>
              ))}
            </div>

            <a 
              href={secureUrl} 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '0.85rem', color: '#60a5fa', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.15)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.3)' }}
            >
              ↗ Open in new tab
            </a>
          </div>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.iframeContainer} style={{ width: '100%', height: 'calc(100vh - 130px)', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          {viewMode === 'iframe' ? (
            <iframe 
              src={secureUrl} 
              title="Website Preview"
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '1rem' }}>
              {imgLoading && (
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span>Loading {currentProvider.name}...</span>
                </div>
              )}

              <img 
                key={currentProvider.src}
                src={currentProvider.src} 
                alt={`${currentProvider.name} Backup Preview`} 
                onLoad={() => setImgLoading(false)}
                onError={handleImgError}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  maxHeight: '100%',
                  objectFit: 'contain', 
                  borderRadius: '6px', 
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  display: imgLoading ? 'none' : 'block'
                }}
              />

              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
