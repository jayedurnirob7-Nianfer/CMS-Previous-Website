import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function ImportModal({ onClose, onImport }) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleImport = async (e) => {
    e.preventDefault();
    if (!sourceUrl) {
      setError("Please enter a valid Google Sheet URL.");
      return;
    }
    
    // Extract ID from URL
    const match = sourceUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    let sourceId = sourceUrl;
    if (match && match[1]) {
      sourceId = match[1];
    } else if (sourceUrl.includes('google.com')) {
      setError("Invalid Google Sheet URL format.");
      return;
    }
    
    setIsImporting(true);
    setError(null);
    try {
      await onImport(sourceId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h2 className={styles.title}>Import Data</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Paste a Google Sheet URL to automatically import data. 
          The script will scan for duplicates (Client Name, Website, Domain, Profile) and skip them.
        </p>
        
        {error && <div className={styles.error} style={{ color: 'var(--danger)', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleImport} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Source Google Sheet URL</label>
            <input 
              type="text" 
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              required
              disabled={isImporting}
            />
          </div>
          
          <button type="submit" className={styles.submitButton} disabled={isImporting}>
            {isImporting ? 'Importing... Please wait' : 'Start Import'}
          </button>
        </form>
      </div>
    </div>
  );
}
