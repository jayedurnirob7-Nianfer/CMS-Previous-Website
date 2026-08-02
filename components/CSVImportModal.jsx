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
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Helper to split CSV line respecting quotes
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
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

    const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    
    // Find key column indices
    const nameIdx = headers.findIndex(h => /client[']?s?\s*name/i.test(h) || h.toLowerCase() === 'client name');
    const websiteIdx = headers.findIndex(h => /client\s*website/i.test(h) || /website/i.test(h) || /link/i.test(h));
    const domainIdx = headers.findIndex(h => /our\s*domain/i.test(h) || /domain/i.test(h));
    const devIdx = headers.findIndex(h => /developer/i.test(h));
    const statusIdx = headers.findIndex(h => /status/i.test(h));
    const typeIdx = headers.findIndex(h => /type/i.test(h));
    const profileIdx = headers.findIndex(h => /profile/i.test(h));

    if (nameIdx === -1) {
      throw new Error('CSV must contain a "Client Name" column!');
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]).map(cell => cell.replace(/^"|"$/g, '').trim());
      const clientName = row[nameIdx];
      if (!clientName) continue;

      const rowObj = {
        'Client Name': clientName,
        'Client Website': websiteIdx !== -1 ? row[websiteIdx] || '' : '',
        'Our Domain': domainIdx !== -1 ? row[domainIdx] || '' : '',
        'Developer': devIdx !== -1 ? row[devIdx] || '' : '',
        'Status': statusIdx !== -1 ? row[statusIdx] || '' : '',
        'Type of website': typeIdx !== -1 ? row[typeIdx] || '' : '',
        'Profile Name': profileIdx !== -1 ? row[profileIdx] || '' : ''
      };
      rows.push(rowObj);
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
          setErrorMsg('No valid rows found in the CSV file.');
          setParsedData([]);
        } else {
          setParsedData(parsed);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse CSV file.');
        setParsedData([]);
      }
    };
    reader.readAsText(selectedFile);
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
        setSuccessMsg(`Successfully updated ${result.updatedCount} clients (${result.addedCount} new clients created)!`);
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1800);
      } else {
        setErrorMsg(result.error || 'Failed to import CSV.');
      }
    } catch (err) {
      setErrorMsg('Error uploading CSV: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>⬆️ Bulk Import / Update from CSV</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Upload an edited CSV file. The system will match each row by <strong>Client Name</strong> and automatically update <strong>Client Website</strong> links and details in MongoDB.
          </p>

          <div style={{ border: '2px dashed var(--card-border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer' }} onClick={() => document.getElementById('csvFileInput').click()}>
            <input 
              id="csvFileInput" 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {file ? file.name : 'Click to select or drag & drop CSV file'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Accepts .csv exported from CMS Dashboard
            </div>
          </div>

          {errorMsg && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.9rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.9rem', fontWeight: 'bold' }}>
              ✓ {successMsg}
            </div>
          )}

          {parsedData.length > 0 && !successMsg && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                  Preview: {parsedData.length} records ready to update
                </span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {parsedData.slice(0, 10).map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#ddd' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{row['Client Name']}</span>
                    <span style={{ color: row['Client Website'] ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {row['Client Website'] || 'No link added'}
                    </span>
                  </div>
                ))}
                {parsedData.length > 10 && (
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                    ...and {parsedData.length - 10} more clients
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
            disabled={parsedData.length === 0 || isUploading}
            style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
          >
            {isUploading ? 'Updating MongoDB...' : `Import & Update ${parsedData.length} Clients`}
          </button>
        </div>
      </div>
    </div>
  );
}
