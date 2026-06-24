'use client';
import React, { useState } from 'react';
import styles from './Modal.module.css';

export default function AuthModal({ onClose, onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onLogin(password);
    if (!success) {
      setError('Invalid password');
    }
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Admin Login</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div style={{color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem'}}>{error}</div>}
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              autoFocus
            />
          </div>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
