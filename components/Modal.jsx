'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function Modal({
  onClose,
  onSubmit,
  initialData,
  activeTab,
  availableProfiles = [],
  availableTeams = [],
  availableDevelopers = []
}) {
  const [formData, setFormData] = useState({
    'sheet': initialData ? (initialData.category || initialData['sheet'] || 'Wordpress') : ((activeTab && activeTab !== 'All') ? activeTab : 'Wordpress'),
    'Profile Name': initialData ? initialData['Profile Name'] || '' : '',
    'Type of website': initialData ? initialData['Type of website'] || '' : '',
    'Client Name': initialData ? initialData['Client Name'] || '' : '',
    'Our Domain': initialData ? initialData['Our Domain'] || '' : '',
    'Client Website': initialData ? initialData['Client Website'] || '' : '',
    'Tags': initialData ? initialData['Tags'] || '' : '',
    'Status': initialData ? initialData['Status'] || '' : '',
    'Team Name': initialData ? initialData['Team Name'] || '' : '',
    'Developer': initialData ? initialData['Developer'] || '' : '',
    'Deli_Last_Time': initialData ? initialData['Deli_Last_Time'] || '' : ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTeam, setIsCustomTeam] = useState(false);
  const [isCustomDeveloper, setIsCustomDeveloper] = useState(false);

  // Derive unique combined team options including initial team if custom
  const teamsOptions = React.useMemo(() => {
    const set = new Set(availableTeams);
    if (formData['Team Name'] && !set.has(formData['Team Name'])) {
      set.add(formData['Team Name']);
    }
    return Array.from(set);
  }, [availableTeams, formData]);

  // Derive unique combined developer options including initial dev if custom
  const devsOptions = React.useMemo(() => {
    const set = new Set(availableDevelopers);
    if (formData['Developer'] && !set.has(formData['Developer'])) {
      set.add(formData['Developer']);
    }
    return Array.from(set);
  }, [availableDevelopers, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomTeam(true);
      setFormData(prev => ({ ...prev, 'Team Name': '' }));
    } else {
      setIsCustomTeam(false);
      setFormData(prev => ({ ...prev, 'Team Name': val }));
    }
  };

  const handleDevSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomDeveloper(true);
      setFormData(prev => ({ ...prev, 'Developer': '' }));
    } else {
      setIsCustomDeveloper(false);
      setFormData(prev => ({ ...prev, 'Developer': val }));
    }
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
              <option value="Document">Document</option>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label}>Team Name</label>
              {isCustomTeam && (
                <button type="button" className={styles.switchButton} onClick={() => setIsCustomTeam(false)}>
                  ← Select existing team
                </button>
              )}
            </div>
            {isCustomTeam ? (
              <input
                type="text"
                name="Team Name"
                className={styles.input}
                value={formData['Team Name']}
                onChange={handleChange}
                placeholder="Enter team name"
                autoFocus
              />
            ) : (
              <select
                name="Team Name"
                className={styles.input}
                value={formData['Team Name']}
                onChange={handleTeamSelectChange}
              >
                <option value="">Select a team</option>
                {teamsOptions.map((team, i) => (
                  <option key={i} value={team}>{team}</option>
                ))}
                <option value="__custom__">+ Add Custom Team...</option>
              </select>
            )}
          </div>

          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label}>Developer</label>
              {isCustomDeveloper && (
                <button type="button" className={styles.switchButton} onClick={() => setIsCustomDeveloper(false)}>
                  ← Select existing developer
                </button>
              )}
            </div>
            {isCustomDeveloper ? (
              <input
                type="text"
                name="Developer"
                className={styles.input}
                value={formData['Developer']}
                onChange={handleChange}
                placeholder="Enter developer name"
                autoFocus
              />
            ) : (
              <select
                name="Developer"
                className={styles.input}
                value={formData['Developer']}
                onChange={handleDevSelectChange}
              >
                <option value="">Select a developer</option>
                {devsOptions.map((dev, i) => (
                  <option key={i} value={dev}>{dev}</option>
                ))}
                <option value="__custom__">+ Add Custom Developer...</option>
              </select>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Deli Last Time</label>
            <input type="text" name="Deli_Last_Time" className={styles.input} value={formData['Deli_Last_Time']} onChange={handleChange} placeholder="e.g. 24 Hours / Delivery time" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Our Domain</label>
            <input type="text" name="Our Domain" className={styles.input} value={formData['Our Domain']} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Client Website</label>
            <input type="text" name="Client Website" className={styles.input} value={formData['Client Website']} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tags</label>
            <input type="text" name="Tags" className={styles.input} value={formData['Tags']} onChange={handleChange} placeholder="e.g. E-commerce, Real Estate, Portfolio (comma separated)" />
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
