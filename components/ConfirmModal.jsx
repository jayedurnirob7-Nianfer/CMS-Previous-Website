import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 className={styles.title}>{title || 'Confirm Action'}</h2>
        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
          {message || 'Are you sure you want to proceed?'}
        </p>
        <div className={styles.buttonGroup} style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            className={styles.submitButton} 
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{ 
              backgroundColor: '#ef4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minWidth: '100px',
              marginTop: '0' // Override the default margin-top from .submitButton
            }}
          >
            {isDeleting ? (
              <svg className={styles.spinner} style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .opacity-25 { opacity: 0.25; }
        .opacity-75 { opacity: 0.75; }
      `}</style>
    </div>
  );
}
