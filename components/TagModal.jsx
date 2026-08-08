'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function TagModal({ onClose, onSaveTags, item, clientName }) {
  const initialTags = (item && item['Tags']) 
    ? item['Tags'].split(',').map(t => t.trim()).filter(Boolean) 
    : [];

  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      const currentDraft = parts.pop();
      const newTagsToAdd = parts.map(t => t.trim()).filter(Boolean);
      
      if (newTagsToAdd.length > 0) {
        setTags(prev => {
          const updated = [...prev];
          newTagsToAdd.forEach(t => {
            if (!updated.includes(t)) {
              updated.push(t);
            }
          });
          return updated;
        });
      }
      setInputValue(currentDraft);
    } else {
      setInputValue(val);
    }
  };

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newTags = trimmed.split(',').map(t => t.trim()).filter(Boolean);
    const updated = [...tags];
    
    newTags.forEach(t => {
      if (!updated.includes(t)) {
        updated.push(t);
      }
    });

    setTags(updated);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Include any unsaved input in field
    let finalTags = [...tags];
    if (inputValue.trim()) {
      const extra = inputValue.trim().split(',').map(t => t.trim()).filter(Boolean);
      extra.forEach(t => {
        if (!finalTags.includes(t)) finalTags.push(t);
      });
    }

    setIsSubmitting(true);
    await onSaveTags(item, finalTags.join(', '));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className={styles.header} style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏷️</span>
            <div>
              <h2 className={styles.title} style={{ fontSize: '1.2rem', margin: 0 }}>Manage Tags</h2>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                {clientName || item?.['Client Name'] || 'Website Tags'}
              </div>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Current Tags</label>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.4rem', 
              minHeight: '48px', 
              padding: '0.75rem', 
              backgroundColor: 'rgba(0, 0, 0, 0.3)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '10px' 
            }}>
              {tags.length === 0 ? (
                <span style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No tags added yet. Type below and use comma (,) to add tags.
                </span>
              ) : (
                tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                      color: '#c084fc', 
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        lineHeight: 1,
                        padding: 0,
                        marginLeft: '2px'
                      }}
                      title="Remove tag"
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Add New Tag(s)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className={styles.input} 
                value={inputValue} 
                onChange={handleInputChange} 
                onKeyDown={handleKeyDown}
                placeholder="Type tag name (use comma , to complete tag)..."
                autoFocus
              />
              <button 
                type="button" 
                onClick={handleAddTag}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                + Add
              </button>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
              Tip: Typing a comma (,) completes the current tag and starts a new one.
            </span>
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting} style={{ marginTop: 0 }}>
              {isSubmitting ? 'Saving...' : 'Save Tags'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
