'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function IframeModal({ url, onClose }) {
  const secureUrl = url ? (url.startsWith('http') ? url : `https://${url}`) : '';
  const formattedUrl = secureUrl.replace(/^https?:\/\//, '');
  const encodedUrl = encodeURIComponent(secureUrl);

  const [activeMode, setActiveMode] = useState('direct'); // 'direct' | 'google' | 'allorigins' | 'archive' | 'snapshot'

  // Full Live Interactive Site Proxies & Mirrors
  const modes = [
    { 
      id: 'direct', 
      name: '🌐 Direct Site', 
      type: 'iframe', 
      src: secureUrl 
    },
    { 
      id: 'google', 
      name: '🚀 Live Proxy (Google)', 
      type: 'iframe', 
      src: `https://translate.google.com/translate?sl=auto&tl=en&u=${encodedUrl}` 
    },
    { 
      id: 'allorigins', 
      name: '⚡ Live Mirror (AllOrigins)', 
      type: 'iframe', 
      src: `https://api.allorigins.win/raw?url=${encodedUrl}` 
    },
    { 
      id: 'archive', 
      name: '🏛️ Archive Mirror', 
      type: 'iframe', 
      src: `https://web.archive.org/web/2/${secureUrl}` 
    },
    { 
      id: 'snapshot', 
      name: '📸 Microlink Snapshot', 
      type: 'img', 
      src: `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&embed=screenshot.url` 
    }
  ];

  const currentMode = modes.find(m => m.id === activeMode) || modes[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.fullScreenModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.liveIndicator} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }}></div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>Preview: {formattedUrl}</h2>

            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px', flexWrap: 'wrap', border: '1px solid rgba(255,255,255,0.08)' }}>
              {modes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeMode === mode.id ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                    color: activeMode === mode.id ? '#fff' : '#cbd5e1',
                    cursor: 'pointer',
                    fontWeight: activeMode === mode.id ? '700' : '600',
                    fontSize: '0.825rem',
                    transition: 'all 0.2s ease',
                    boxShadow: activeMode === mode.id ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  {mode.name}
                </button>
              ))}
            </div>

            <a 
              href={secureUrl} 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '0.825rem', color: '#38bdf8', textDecoration: 'none', background: 'rgba(56, 189, 248, 0.12)', padding: '0.4rem 0.85rem', borderRadius: '6px', fontWeight: 'bold', border: '1px solid rgba(56, 189, 248, 0.3)' }}
            >
              ↗ Open in new tab
            </a>
          </div>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.iframeContainer} style={{ width: '100%', height: 'calc(100vh - 130px)', backgroundColor: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {currentMode.type === 'iframe' ? (
            <iframe 
              key={currentMode.src}
              src={currentMode.src} 
              title={`Full Site Preview - ${currentMode.name}`}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: '#07090e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <img 
                key={currentMode.src}
                src={currentMode.src} 
                alt={`${formattedUrl} Fast Snapshot`}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  maxHeight: '100%',
                  objectFit: 'contain', 
                  borderRadius: '8px', 
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
