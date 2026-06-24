'use client';
import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function SettingsModal({ onClose, onSave, currentSiteName, currentProfiles, currentKamSheetId }) {
  const [siteName, setSiteName] = useState(currentSiteName || '');
  const [newPassword, setNewPassword] = useState('');
  const [profilesText, setProfilesText] = useState(currentProfiles ? currentProfiles.join(', ') : '');
  const [kamSheetId, setKamSheetId] = useState(currentKamSheetId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newProfiles = profilesText.split(',').map(p => p.trim()).filter(Boolean);
    await onSave({ newSiteName: siteName, newPassword, newProfiles, newKamSheetId: kamSheetId });
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Admin Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Site Name</label>
            <input 
              type="text" 
              className={styles.input} 
              value={siteName} 
              onChange={e => setSiteName(e.target.value)} 
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>New Admin Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Profile Names (comma separated)</label>
            <textarea 
              className={styles.input} 
              value={profilesText} 
              onChange={e => setProfilesText(e.target.value)} 
              placeholder="e.g. thestudioxx_fiverr, sketchmuse_fiverr"
              rows="3"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>KAM Auto-Sync Sheet ID</label>
            <input 
              type="text" 
              className={styles.input} 
              value={kamSheetId} 
              onChange={e => setKamSheetId(e.target.value)} 
              placeholder="Paste Google Sheet ID here"
            />
            <p style={{fontSize: '12px', color: '#888', marginTop: '4px'}}>
              This sheet will be automatically synced every 24 hours.
            </p>
          </div>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
