'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function NoticeModal({ onClose, onSubmit, initialData, activeTab }) {
  const [title, setTitle] = useState(initialData ? initialData.title || '' : '');
  const [category, setCategory] = useState(
    initialData ? initialData.category || 'All' : (activeTab ? activeTab : 'All')
  );
  const [content, setContent] = useState(initialData ? initialData.content || '' : '');
  const [link, setLink] = useState(initialData ? initialData.link || '' : '');
  const [isPinned, setIsPinned] = useState(initialData ? (initialData.isPinned ?? true) : true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      id: initialData ? initialData._id : undefined,
      title,
      category,
      content,
      link,
      isPinned,
    });
    setIsSubmitting(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {initialData ? 'Edit Document / Notice' : (activeTab === 'Document' ? '📄 Upload Document / Resource Link' : '📌 Add Notice / Resource Link')}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Title / Resource Name *</label>
            <input
              required
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Figma Template & Setup Guide"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Platform / Tab Target</label>
            <select
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Global">Show on Every Tab (Global)</option>
              <option value="All">All Tabs (Global)</option>
              <option value="Wordpress">Wordpress</option>
              <option value="WIX">WIX</option>
              <option value="Shopify">Shopify</option>
              <option value="Document">Document</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Details & Instructions (What it is & what to do) *</label>
            <textarea
              required
              rows={3}
              className={styles.input}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide clear details and instructions for team members..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>URL / Resource Link (Optional)</label>
            <input
              type="text"
              className={styles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="isPinnedCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="isPinnedCheck" className={styles.label} style={{ cursor: 'pointer', margin: 0 }}>
              Pin notice to top
            </label>
          </div>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving Notice...' : (initialData ? 'Update Notice' : 'Post Notice')}
          </button>
        </form>
      </div>
    </div>
  );
}
