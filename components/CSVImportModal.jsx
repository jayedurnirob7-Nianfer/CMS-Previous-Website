'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function CSVImportModal({ onClose, onImportSuccess, adminPassword }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const parseCSV = (text) => {
    // Normalize line endings
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Robust CSV line parser respecting quoted fields
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map(h => h.replace(/^"|"$/g, '').trim());

    // Flexible column matching using regex patterns
    const findCol = (patterns) => headers.findIndex(h =>
      patterns.some(p => typeof p === 'string'
        ? h.toLowerCase() === p.toLowerCase()
        : p.test(h)
      )
    );

    const nameIdx    = findCol([/^client\s*name$/i, 'name']);
    const websiteIdx = findCol([/^client\s*website$/i, /^website$/i, /^site\s*link$/i, /^link$/i, /^url$/i]);
    const domainIdx  = findCol([/^our\s*domain$/i, /^domain$/i]);
    const devIdx     = findCol([/^developer$/i, /^dev$/i]);
    const statusIdx  = findCol([/^status$/i]);
    const typeIdx    = findCol([/^type\s*of\s*website$/i, /^type$/i, /^platform$/i]);
    const profileIdx = findCol([/^profile\s*name$/i, /^profile$/i]);
    const deliIdx    = findCol([/^deli_last_time$/i, /^deli$/i, /^delivery\s*date$/i]);
    const tagsIdx    = findCol([/^tags$/i, /^tag$/i]);

    if (nameIdx === -1) {
      throw new Error(`CSV must contain a "Client Name" column.\nColumns found: ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '...' : ''}`);
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const row = parseLine(line).map(cell => cell.replace(/^"|"$/g, '').trim());
      const clientName = (row[nameIdx] || '').trim();
      if (!clientName) continue;

      rows.push({
        'Client Name':    clientName,
        'Client Website': websiteIdx !== -1 ? (row[websiteIdx] || '').trim() : '',
        'Our Domain':     domainIdx  !== -1 ? (row[domainIdx]  || '').trim() : '',
        'Developer':      devIdx     !== -1 ? (row[devIdx]     || '').trim() : '',
        'Status':         statusIdx  !== -1 ? (row[statusIdx]  || '').trim() : '',
        'Type of website':typeIdx    !== -1 ? (row[typeIdx]    || '').trim() : '',
        'Profile Name':   profileIdx !== -1 ? (row[profileIdx] || '').trim() : '',
        'Deli_Last_Time': deliIdx    !== -1 ? (row[deliIdx]    || '').trim() : '',
        'Tags':           tagsIdx    !== -1 ? (row[tagsIdx]    || '').trim() : '',
      });
    }
    return rows;
  };

  const handleFileChange = (e) => {
    setErrorMsg('');
    setSuccessMsg('');
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setErrorMsg('No valid rows found. Make sure the CSV has a "Client Name" column and at least one data row.');
          setParsedData([]);
        } else {
          setParsedData(parsed);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse CSV file.');
        setParsedData([]);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importCSV',
          password: adminPassword,
          records: parsedData
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        const msg = `✓ Updated ${result.updatedCount} clients | Added ${result.addedCount} new clients`;
        setSuccessMsg(msg);
        // Immediately refresh dashboard data
        onImportSuccess();
        // Auto-close after 2 seconds
        setTimeout(() => onClose(), 2000);
      } else {
        setErrorMsg(result.error || 'Import failed. Make sure you are logged in as admin.');
      }
    } catch (err) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const withLinksCount = parsedData.filter(r => r['Client Website']).length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>⬆️ Bulk Import / Update from CSV</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Upload the CSV file you exported and edited. Each row is matched by <strong>Client Name</strong> and the <strong>Client Website</strong> link (and other fields) are updated automatically.
          </p>

          <div
            style={{ border: '2px dashed var(--card-border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
            onClick={() => document.getElementById('csvFileInput').click()}
          >
            <input id="csvFileInput" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {file ? file.name : 'Click to select CSV file'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {parsedData.length > 0
                ? `${parsedData.length} records detected · ${withLinksCount} have website links`
                : 'Accepts .csv exported from CMS Dashboard'}
            </div>
          </div>

          {errorMsg && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {successMsg}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 'normal' }}>Dashboard is refreshing... closing shortly.</div>
            </div>
          )}

          {parsedData.length > 0 && !successMsg && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                  Preview — {parsedData.length} records
                </span>
                <span style={{ fontSize: '0.75rem', color: '#34d399' }}>
                  {withLinksCount} with website links
                </span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {parsedData.slice(0, 10).map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#ddd', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#fff', flex: '0 0 40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row['Client Name']}</span>
                    <span style={{ color: row['Client Website'] ? '#34d399' : '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {row['Client Website'] || '— no link —'}
                    </span>
                  </div>
                ))}
                {parsedData.length > 10 && (
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                    ...and {parsedData.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className={styles.logoutButton} onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={parsedData.length === 0 || isUploading || !!successMsg}
            style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
          >
            {isUploading
              ? `Uploading ${parsedData.length} records...`
              : successMsg
              ? '✓ Import Complete'
              : `Import & Update ${parsedData.length} Clients`}
          </button>
        </div>
      </div>
    </div>
  );
}
