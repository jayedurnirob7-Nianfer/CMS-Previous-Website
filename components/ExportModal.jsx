'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function ExportModal({ onClose, allData, baseFilteredData, processedData, activeTab, activeSearchTags, searchTerm }) {
  const [exportOption, setExportOption] = useState('no_website');
  const [selectedTag, setSelectedTag] = useState('');

  // Extract all unique tags for tag-based export
  const availableTags = React.useMemo(() => {
    const set = new Set();
    allData.forEach(item => {
      if (item['Tags']) {
        item['Tags'].split(',').forEach(t => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [allData]);

  const handleDownload = () => {
    let exportData = [];
    let filenamePrefix = 'clients';

    switch (exportOption) {
      case 'no_website':
        exportData = allData.filter(item => !item['Client Website'] && !item['Our Domain']);
        filenamePrefix = 'no_website_included';
        break;

      case 'has_website':
        exportData = allData.filter(item => !!item['Client Website'] || !!item['Our Domain']);
        filenamePrefix = 'has_website_included';
        break;

      case 'good':
        exportData = allData.filter(item => (item['Status'] || '').toLowerCase().trim() === 'good');
        filenamePrefix = 'good_status_clients';
        break;

      case 'bad':
        exportData = allData.filter(item => (item['Status'] || '').toLowerCase().trim() === 'bad');
        filenamePrefix = 'bad_status_clients';
        break;

      case 'not_active':
        exportData = allData.filter(item => (item['Status'] || '').toLowerCase().trim() === 'not active');
        filenamePrefix = 'not_active_clients';
        break;

      case 'by_tag':
        if (!selectedTag) {
          alert('Please select or type a tag to export!');
          return;
        }
        exportData = allData.filter(item => {
          const tags = (item['Tags'] || '').toLowerCase();
          return tags.includes(selectedTag.toLowerCase());
        });
        filenamePrefix = `tag_${selectedTag.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        break;

      case 'current_view':
        exportData = processedData;
        filenamePrefix = `current_view_${activeTab.toLowerCase()}`;
        break;

      case 'all':
        exportData = allData;
        filenamePrefix = 'all_clients_database';
        break;

      default:
        exportData = allData;
    }

    if (exportData.length === 0) {
      alert(`No client records found matching the selected option!`);
      return;
    }

    const headers = ['Client Name', 'Type of website', 'Profile Name', 'Developer', 'Status', 'Deli_Last_Time', 'Client Website', 'Our Domain', 'Tags', 'Team Name', 'category'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of exportData) {
      const values = headers.map(header => {
        const val = row[header] ? String(row[header]).replace(/"/g, '""') : '';
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>⬇️ Export Clients to CSV</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Export Filter Option</label>
            <select 
              className={styles.input}
              value={exportOption}
              onChange={(e) => setExportOption(e.target.value)}
            >
              <option value="no_website">🚫 Clients Without Website Listed (Missing Links)</option>
              <option value="has_website">🌐 Clients With Website Listed</option>
              <option value="good">🟢 Good Status Clients</option>
              <option value="bad">🔴 Bad Status Clients</option>
              <option value="not_active">🟡 Not Active Status Clients</option>
              <option value="by_tag">🏷️ By Tag (Select Specific Tag)</option>
              <option value="current_view">🔍 Current Filtered Dashboard View ({processedData.length} items)</option>
              <option value="all">📦 All Database Clients ({allData.length} items)</option>
            </select>
          </div>

          {exportOption === 'by_tag' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Tag to Export</label>
              {availableTags.length > 0 ? (
                <select 
                  className={styles.input}
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                >
                  <option value="">-- Choose a Tag --</option>
                  {availableTags.map((tag, i) => (
                    <option key={i} value={tag}>{tag}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Enter tag name (e.g. E-commerce)" 
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                />
              )}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
              Export will include columns: <strong>Client Name, Type of website, Profile Name, Developer, Status, Deli Last Time, Client Website, Our Domain, Tags, Team Name</strong>.
            </p>
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className={styles.submitButton} 
              onClick={handleDownload}
              style={{ marginTop: 0, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              📥 Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
