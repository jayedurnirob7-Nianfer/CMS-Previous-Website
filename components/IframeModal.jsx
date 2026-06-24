import React from 'react';
import styles from './Modal.module.css';

export default function IframeModal({ url, onClose }) {
  const secureUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.fullScreenModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={styles.liveIndicator} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' }}></div>
            <h2>Live Preview</h2>
            <a href={secureUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent)', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold' }}>
              ↗ Open in new tab (if preview fails)
            </a>
          </div>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.iframeContainer} style={{ width: '100%', height: 'calc(100vh - 120px)', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <iframe 
            src={secureUrl} 
            title="Website Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
