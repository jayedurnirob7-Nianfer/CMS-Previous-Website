'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function Modal({ onClose, onSubmit, initialData, activeTab, availableProfiles = [] }) {
  const [formData, setFormData] = useState({
    'sheet': (activeTab && activeTab !== 'All') ? activeTab : 'Wordpress',
    'Profile Name': initialData ? initialData['Profile Name'] || '' : '',
    'Type of website': initialData ? initialData['Type of website'] || '' : '',
    'Client Name': initialData ? initialData['Client Name'] || '' : '',
    'Our Domain': initialData ? initialData['Our Domain'] || '' : '',
    'Client Website': initialData ? initialData['Client Website'] || '' : '',
    'Tags': initialData ? initialData['Tags'] || '' : '',
    'Status': initialData ? initialData['Status'] || '' : '',
    'Team Name': initialData ? initialData['Team Name'] || '' : '',
    'Developer': initialData ? initialData['Developer'] || '' : ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialData ? 'Edit Website' : 'Add New Website'}</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Platform / Tab *</label>
            <select name="sheet" className={styles.input} value={formData['sheet']} onChange={handleChange}>
              <option value="Wordpress">Wordpress</option>
              <option value="WIX">WIX</option>
              <option value="Shopify">Shopify</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Profile Name</label>
            <select name="Profile Name" className={styles.input} value={formData['Profile Name']} onChange={handleChange}>
              <option value="">Select a profile</option>
              {availableProfiles.map((profile, i) => (
                <option key={i} value={profile}>{profile}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Client Name *</label>
            <input required type="text" name="Client Name" className={styles.input} value={formData['Client Name']} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Type of website</label>
            <input type="text" name="Type of website" className={styles.input} value={formData['Type of website']} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Team Name</label>
            <input type="text" name="Team Name" className={styles.input} value={formData['Team Name']} onChange={handleChange} placeholder="e.g. Alpha Team" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Developer</label>
            <input type="text" name="Developer" className={styles.input} value={formData['Developer']} onChange={handleChange} placeholder="e.g. John Doe" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Our Domain</label>
            <input type="url" name="Our Domain" className={styles.input} value={formData['Our Domain']} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Client Website</label>
            <input type="url" name="Client Website" className={styles.input} value={formData['Client Website']} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tags (comma separated)</label>
            <input type="text" name="Tags" className={styles.input} value={formData['Tags']} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Status</label>
            <select name="Status" className={styles.input} value={formData['Status']} onChange={handleChange}>
              <option value=""></option>
              <option value="Good">Good</option>
              <option value="Not active">Not active</option>
              <option value="BAD">BAD</option>
            </select>
          </div>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Website'}
          </button>
        </form>
      </div>
    </div>
  );
}
