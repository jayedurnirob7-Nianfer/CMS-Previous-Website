'use client';

import React, { useState, useMemo } from 'react';
import styles from './NoticeBoard.module.css';

export default function NoticeBoard({
  notices = [],
  activeTab = 'All',
  isAdmin = false,
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  onReorderNotices,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const filteredNotices = useMemo(() => {
    const currentTab = activeTab || 'All';
    return notices.filter(n => n.category === currentTab || n.category === 'Global');
  }, [notices, activeTab]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleMove = (index, direction) => {
    if (!onReorderNotices) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredNotices.length) return;

    const listCopy = [...filteredNotices];
    const [movedItem] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, movedItem);

    const reorderedItems = listCopy.map((item, idx) => ({
      id: item._id,
      order: idx,
    }));

    onReorderNotices(reorderedItems, listCopy);
  };

  const getBadgeClass = (category) => {
    switch (category) {
      case 'Wordpress':
        return styles.badgeWordpress;
      case 'WIX':
        return styles.badgeWIX;
      case 'Shopify':
        return styles.badgeShopify;
      case 'Global':
        return styles.badgeGlobal;
      default:
        return styles.badgeAll;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>📌</span>
          <h3 className={styles.title}>Important Notices & Quick Links</h3>
        </div>

        {isAdmin && (
          <button className={styles.addButton} onClick={onAddNotice}>
            + Add Notice
          </button>
        )}
      </div>

      <div className={styles.body}>
        {filteredNotices.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.25rem 0' }}>
            No active notices or resource links posted yet for {activeTab === 'All' ? 'this dashboard' : activeTab}.
          </div>
        ) : (
          filteredNotices.map((notice, index) => {
            const linkCopyKey = `link-${notice._id}`;
            const isLinkCopied = copiedKey === linkCopyKey;

            return (
              <div key={notice._id} className={styles.noticeCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    {notice.isPinned && <span className={styles.pinIcon} title="Pinned notice">📌</span>}
                    {notice.title}
                  </div>
                  <div className={styles.headerRight}>
                    <span className={`${styles.categoryBadge} ${getBadgeClass(notice.category)}`}>
                      {notice.category}
                    </span>
                    {isAdmin && (
                      <div className={styles.adminControls}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          style={{ opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                        >
                          ▲ Move Up
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === filteredNotices.length - 1}
                          title="Move Down"
                          style={{ opacity: index === filteredNotices.length - 1 ? 0.3 : 1, cursor: index === filteredNotices.length - 1 ? 'not-allowed' : 'pointer' }}
                        >
                          ▼ Move Down
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => onEditNotice(notice)}
                          title="Edit Notice"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => onDeleteNotice(notice._id)}
                          title="Delete Notice"
                          style={{ color: '#f87171' }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  {notice.content}
                </div>

                {notice.link && (
                  <div className={styles.mainLinkBox}>
                    <div className={styles.mainLinkLeft}>
                      <span className={styles.linkIcon}>🔗</span>
                      <a
                        href={notice.link.startsWith('http') ? notice.link : `https://${notice.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.mainLinkText}
                        title={notice.link}
                      >
                        {notice.link}
                      </a>
                    </div>
                    <button
                      className={`${styles.copyLinkBtn} ${isLinkCopied ? styles.copySuccess : ''}`}
                      onClick={() => handleCopy(notice.link, linkCopyKey)}
                      title="Copy URL"
                    >
                      {isLinkCopied ? '✓ Copied' : '📋 Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
