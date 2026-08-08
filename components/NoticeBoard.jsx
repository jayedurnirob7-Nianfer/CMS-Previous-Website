'use client';

import React, { useState, useMemo } from 'react';
import styles from './NoticeBoard.module.css';

export default function NoticeBoard({
  notices = [],
  activeTab = 'All',
  isAdmin = false,
  searchTerm = '',
  activeSearchTags = [],
  onAddNotice,
  onEditNotice,
  onSilentAssignTab,
  onDeleteNotice,
  onReorderNotices,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const filteredNotices = useMemo(() => {
    const currentTab = activeTab || 'All';
    let list = notices;
    if (currentTab !== 'Document') {
      list = notices.filter(n => n.category === currentTab || n.category === 'Global');
    }

    if (searchTerm.trim() || activeSearchTags.length > 0) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(n => {
        const title = (n.title || '').toLowerCase();
        const content = (n.content || '').toLowerCase();
        const link = (n.link || '').toLowerCase();
        const category = (n.category || '').toLowerCase();

        const matchesTags = activeSearchTags.length === 0 || activeSearchTags.some(tag => {
          const t = tag.toLowerCase();
          return title.includes(t) || content.includes(t) || category.includes(t);
        });

        const matchesText = !term || (
          title.includes(term) || 
          content.includes(term) || 
          link.includes(term) || 
          category.includes(term)
        );

        return matchesTags && matchesText;
      });
    }

    return list;
  }, [notices, activeTab, searchTerm, activeSearchTags]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const isDragAllowed = isAdmin && activeTab === 'Document';

  const handleDragStart = (e, index) => {
    if (!isDragAllowed) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    if (!isDragAllowed) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    if (!isDragAllowed) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const listCopy = [...filteredNotices];
    const [movedItem] = listCopy.splice(draggedIndex, 1);
    listCopy.splice(targetIndex, 0, movedItem);

    const reorderedItems = listCopy.map((item, idx) => ({
      id: item._id,
      order: idx,
    }));

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (onReorderNotices) {
      onReorderNotices(reorderedItems, listCopy);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      case 'Document':
        return styles.badgeDocument;
      default:
        return styles.badgeAll;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>{activeTab === 'Document' ? '📄' : '📌'}</span>
          <h3 className={styles.title}>
            {activeTab === 'Document' ? 'Document & Resource Hub (All Tabs)' : 'Important Notices & Quick Links'}
          </h3>
        </div>

        {isAdmin && activeTab === 'Document' && (
          <button className={styles.addButton} onClick={onAddNotice}>
            + Upload Document / Notice
          </button>
        )}
      </div>

      <div className={styles.body}>
        {filteredNotices.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '0.5rem 0', textAlign: activeTab === 'Document' ? 'center' : 'left' }}>
            {(searchTerm || activeSearchTags.length > 0)
              ? `🔍 No documents or resource links found matching your search.`
              : (activeTab === 'Document' 
                  ? '📄 No documents or resource links uploaded yet.' 
                  : `No active notices or resource links posted yet for ${activeTab === 'All' ? 'this dashboard' : activeTab}.`)}
          </div>
        ) : (
          filteredNotices.map((notice, index) => {
            const linkCopyKey = `link-${notice._id}`;
            const isLinkCopied = copiedKey === linkCopyKey;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={notice._id}
                draggable={isDragAllowed}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`${styles.noticeCard} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    {isDragAllowed && (
                      <span className={styles.dragHandle} title="Click & drag to reorder item">
                        ⠿
                      </span>
                    )}
                    {notice.title}
                  </div>
                  <div className={styles.headerRight}>
                    {isAdmin && activeTab === 'Document' ? (
                      <>
                        <div className={styles.tabAssignContainer}>
                          <span className={styles.tabAssignLabel}>🎯 Tab:</span>
                          <select
                            value={notice.category || 'Global'}
                            onChange={(e) => {
                              const newCategory = e.target.value;
                              if (onSilentAssignTab) {
                                onSilentAssignTab({
                                  id: notice._id,
                                  title: notice.title,
                                  category: newCategory,
                                  content: notice.content,
                                  link: notice.link,
                                  isPinned: notice.isPinned
                                });
                              }
                            }}
                            className={styles.tabAssignSelect}
                            title="Change target tab for this notice/document"
                          >
                            <option value="Global">🌐 Global (Every Tab)</option>
                            <option value="All">⚡ 'All' Tab Only</option>
                            <option value="Wordpress">🅏 WordPress Tab Only</option>
                            <option value="WIX">⬢ WIX Tab Only</option>
                            <option value="Shopify">🛍️ Shopify Tab Only</option>
                          </select>
                        </div>

                        <div className={styles.adminControls}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => onEditNotice(notice)}
                            title="Edit Document / Notice"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className={styles.iconBtn}
                            onClick={() => onDeleteNotice(notice._id)}
                            title="Delete Document / Notice"
                            style={{ color: '#f87171' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className={`${styles.categoryBadge} ${getBadgeClass(notice.category)}`}>
                        {notice.category}
                      </span>
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
