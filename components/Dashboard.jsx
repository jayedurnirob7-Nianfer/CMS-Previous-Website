'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './Dashboard.module.css';
import Modal from './Modal';
import AuthModal from './AuthModal';
import SettingsModal from './SettingsModal';
import ImportModal from './ImportModal';
import IframeModal from './IframeModal';
import ConfirmModal from './ConfirmModal';
import CSVImportModal from './CSVImportModal';
import NoticeBoard from './NoticeBoard';
import NoticeModal from './NoticeModal';
import ExportModal from './ExportModal';

const API_URL = '/api/data';

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

function PreviewThumbnail({ clientWebsite, ourDomain, onLivePreview }) {
  const candidateUrls = useMemo(() => {
    const list = [];
    if (clientWebsite && String(clientWebsite).trim()) list.push(String(clientWebsite).trim());
    if (ourDomain && String(ourDomain).trim()) list.push(String(ourDomain).trim());
    return list;
  }, [clientWebsite, ourDomain]);

  const allProviders = useMemo(() => {
    const providers = [];
    candidateUrls.forEach(url => {
      let formatted = url;
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = 'https://' + formatted;
      }
      const encoded = encodeURIComponent(formatted);

      providers.push({
        src: `https://api.microlink.io/?url=${encoded}&screenshot=true&meta=false&embed=screenshot.url`,
        targetUrl: formatted,
        name: 'Microlink'
      });
      providers.push({
        src: `https://s0.wp.com/mshots/v1/${encoded}?w=600&h=800`,
        targetUrl: formatted,
        name: 'WordPress mshots'
      });
      providers.push({
        src: `https://mini.s-shot.ru/1024x768/JPEG/600/Z100/?${encoded}`,
        targetUrl: formatted,
        name: 'S-Shot'
      });
    });
    return providers;
  }, [candidateUrls]);

  const [providerIndex, setProviderIndex] = useState(0);

  useEffect(() => {
    setProviderIndex(0);
  }, [candidateUrls]);

  if (allProviders.length === 0 || providerIndex >= allProviders.length) {
    return <div className={styles.noPreview}>No preview available</div>;
  }

  const currentProvider = allProviders[providerIndex];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={currentProvider.src}
        alt="Website Preview"
        loading="lazy"
        decoding="async"
        className={styles.internalPreviewImage}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        onError={() => {
          setProviderIndex(prev => prev + 1);
        }}
      />
      <div 
        className={styles.previewOverlay} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s' }} 
        onMouseEnter={e => e.currentTarget.style.opacity = 1} 
        onMouseLeave={e => e.currentTarget.style.opacity = 0}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onLivePreview(currentProvider.targetUrl); }}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          👁️ Live Preview
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTags, setActiveSearchTags] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState('total');
  const [previewUrlModal, setPreviewUrlModal] = useState(null);

  const [notices, setNotices] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  const [activeTab, setActiveTab] = useState('All');
  
const ALL_DEFAULT_PROFILES = [
  'thestudioxx_fiverr',
  'graphixnest_fiverr',
  'Coppercart_fiverr',
  'pixelora_studio_fiverr',
  'Hypercanvas',
  'ink_byte_studio_fiverr',
  'Verispace_fiverr',
  'snaplify',
  'orbitnexa_fiverr',
  'sketchmuse_fiverr',
  'vectorslide',
  'Cloudnoval',
  'gridmorph',
  'prism_path',
  'socio_vista_fiverr',
  'Vanilawix_fiverr'
];

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [siteName, setSiteName] = useState('CMS Dashboard');
  const [availableProfiles, setAvailableProfiles] = useState(ALL_DEFAULT_PROFILES);
  const [kamSheetId, setKamSheetId] = useState('');
  const [showTopBar, setShowTopBar] = useState(true);
  const lastScrollYRef = useRef(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const fullProfilesList = useMemo(() => {
    const profileSet = new Set([...ALL_DEFAULT_PROFILES, ...availableProfiles]);
    allData.forEach(item => {
      if (item['Profile Name'] && String(item['Profile Name']).trim()) {
        profileSet.add(String(item['Profile Name']).trim());
      }
    });
    return Array.from(profileSet).sort();
  }, [availableProfiles, allData]);

  const availableTeams = useMemo(() => {
    const defaultTeams = ['Eclipse_PXL', 'Point Zero', 'Proxify', 'Shopify', 'Vertex_PXL', 'Wordpress_PXL'];
    const teamSet = new Set(defaultTeams);
    allData.forEach(item => {
      if (item['Team Name'] && String(item['Team Name']).trim()) {
        teamSet.add(String(item['Team Name']).trim());
      }
    });
    return Array.from(teamSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [allData]);

  const availableDevelopers = useMemo(() => {
    const devSet = new Set();
    allData.forEach(item => {
      if (item['Developer'] && String(item['Developer']).trim()) {
        devSet.add(String(item['Developer']).trim());
      }
    });
    return Array.from(devSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [allData]);

  useEffect(() => {
    const savedPassword = localStorage.getItem('cms_admin_password');
    if (savedPassword) {
      setAdminPassword(savedPassword);
      setIsAdmin(true);
    }

    // Instant 0ms load from localStorage cache
    const cachedData = localStorage.getItem('cms_cached_data');
    let hasCache = false;
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllData(parsed);
          setLoading(false);
          hasCache = true;
        }
      } catch (e) {}
    }

    fetchSettings();
    fetchAllData(hasCache); // Silent fetch if cached data already rendered
    fetchNotices();

    // Silent background polling every 60 seconds to avoid Google Apps Script rate limits
    const interval = setInterval(() => {
      fetchAllData(true);
      fetchNotices();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    }
  };

  const handleSaveNotice = async (noticeData, keepModalClosed = false) => {
    try {
      const isEdit = !!noticeData.id;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/notices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData),
      });
      const data = await res.json();
      if (res.ok) {
        if (!keepModalClosed) {
          setIsNoticeModalOpen(false);
          setEditingNotice(null);
        }
        fetchNotices();
      } else {
        alert('Failed to save notice: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      console.error('Error saving notice:', err);
      alert('Failed to save notice: ' + err.message);
    }
  };

  const handleDeleteNotice = (id) => {
    setNoticeToDelete(id);
  };

  const executeDeleteNotice = async () => {
    if (!noticeToDelete) return;
    try {
      const res = await fetch(`/api/notices?id=${noticeToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotices();
      } else {
        alert('Failed to delete notice.');
      }
    } catch (err) {
      console.error('Error deleting notice:', err);
    } finally {
      setNoticeToDelete(null);
    }
  };

  const handleReorderNotices = async (reorderedItems, optimisticList) => {
    if (optimisticList) {
      setNotices(prev => {
        const orderMap = new Map(reorderedItems.map(item => [item.id, item.order]));
        const updated = prev.map(n => orderMap.has(n._id) ? { ...n, order: orderMap.get(n._id) } : n);
        return updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });
    }
    try {
      await fetch('/api/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', items: reorderedItems }),
      });
      fetchNotices();
    } catch (err) {
      console.error('Error reordering notices:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}?action=getSettings`);
      const result = await response.json();
      if (result.siteName) {
        setSiteName(result.siteName);
      }
      if (result.profiles) {
        setAvailableProfiles(result.profiles);
      }
      if (result.kamSheetId !== undefined) {
        setKamSheetId(result.kamSheetId);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchAllData = async (isSilent = false, forceFresh = false) => {
    if (!isSilent && allData.length === 0) setLoading(true);
    // Safety net: never stay stuck in loading state longer than 30 seconds
    const safetyTimer = setTimeout(() => setLoading(false), 30000);
    try {
      const url = forceFresh
        ? `${API_URL}?action=getAllData&fresh=true&_t=${Date.now()}`
        : `${API_URL}?action=getAllData`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();
      if (Array.isArray(result)) {
        setAllData(result);
        try { localStorage.setItem('cms_cached_data', JSON.stringify(result)); } catch(e) {}
      } else if (result.error) {
        console.error('API error:', result.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (!isSilent && allData.length === 0) {
        alert(`Failed to load data: ${error.message}`);
      }
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAllData(false, true),
        fetchNotices(),
        fetchSettings()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };


  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
            setShowTopBar(false);
          } else if (currentScrollY < lastScrollYRef.current) {
            setShowTopBar(true);
          }
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If clicking inside the panel, do nothing
      if (e.target.closest(`.${styles.sidePanel}`)) return;
      // If clicking a card, do nothing (let the card's onClick handle it)
      if (e.target.closest('[data-card="true"]')) return;
      // Otherwise, close the panel
      setExpandedCard(null);
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpandedCard(null);
        setPreviewUrlModal(null);
        setIsModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);



  const handleAddData = async (newData) => {
    const isEdit = !!editingItem;
    const itemData = {
      ...newData,
      category: newData.sheet || newData.category || 'Wordpress',
      rowIndex: editingItem ? editingItem.rowIndex : (newData._id || Date.now().toString())
    };

    // 1. Instant 0ms optimistic UI update
    setAllData(prev => {
      if (isEdit) {
        return prev.map(item => (item.rowIndex === editingItem.rowIndex || item._id === editingItem._id) ? { ...item, ...itemData } : item);
      } else {
        return [{ ...itemData, _id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev];
      }
    });

    // 2. Close modal instantly
    setIsModalOpen(false);
    setEditingItem(null);

    // 3. Persist to MongoDB in background
    const payload = isEdit 
      ? { ...newData, action: 'update', rowIndex: editingItem.rowIndex, oldSheet: editingItem.category }
      : { ...newData, action: 'create', sheet: newData.sheet || activeTab };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchAllData(true, false); // Silent background sync
      } else {
        console.error("Error saving data:", result.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    if (!isAdmin) return;
    setItemToDelete(item);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', sheet: itemToDelete.category, rowIndex: itemToDelete.rowIndex, password: adminPassword })
      });
      const result = await response.json();
      if (result.status === 'success') {
        await fetchAllData(false, true); // Force fresh fetch from server
      } else {
        alert("Error deleting: " + result.error);
        if (result.error === "Invalid password") handleLogout();
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete.");
    } finally {
      setItemToDelete(null);
    }
  };

  const handleLogin = async (password) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateSettings', password })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setAdminPassword(password);
        setIsAdmin(true);
        localStorage.setItem('cms_admin_password', password);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAdminPassword('');
    localStorage.removeItem('cms_admin_password');
  };

  const handleImport = async (sourceId) => {
    setIsImporting(true);
    try {
      const payload = {
        action: 'importData',
        sourceId: sourceId,
        password: adminPassword
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        if (result.inconsistencies && result.inconsistencies.length > 0) {
          alert(`Import complete!\nUpdated existing: ${result.updated} rows.\nAdded new: ${result.added} rows.\nSkipped (irrelevant/banned): ${result.skipped} rows.\n\n⚠️ INCONSISTENCIES FOUND:\n- ` + result.inconsistencies.slice(0, 15).join('\n- ') + (result.inconsistencies.length > 15 ? `\n...and ${result.inconsistencies.length - 15} more` : ''));
        } else {
          alert(`Import complete!\nUpdated existing: ${result.updated} rows.\nAdded new: ${result.added} rows.\nSkipped (irrelevant/banned): ${result.skipped} rows.`);
        }
        fetchAllData();
        fetchSettings();
      } else {
        throw new Error(result.error || 'Failed to import data');
      }
    } catch (error) {
      alert("Error importing data: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveSettings = async (settings) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'updateSettings', 
          password: adminPassword,
          newSiteName: settings.newSiteName,
          newPassword: settings.newPassword || undefined,
          newProfiles: settings.newProfiles
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setSiteName(settings.newSiteName);
        if (settings.newProfiles) setAvailableProfiles(settings.newProfiles);
        if (settings.newKamSheetId !== undefined) setKamSheetId(settings.newKamSheetId);
        if (settings.newPassword) {
          setAdminPassword(settings.newPassword);
          localStorage.setItem('cms_admin_password', settings.newPassword);
        }
        setIsSettingsModalOpen(false);
        alert("Settings saved successfully!");
      } else {
        alert("Error saving settings: " + result.error);
      }
    } catch (error) {
      console.error("Settings error:", error);
      alert("Failed to save settings.");
    }
  };



  const handleCopyLink = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleExportCSV = () => {
    // Filter specifically for "No Website Included" records (missing both Client Website and Our Domain)
    let exportData = processedData.filter(item => !item['Client Website'] && !item['Our Domain']);

    // If active filters yield no results, search across all items in current active tab
    if (exportData.length === 0) {
      let source = allData;
      if (activeTab !== 'All') {
        source = source.filter(item => item.category === activeTab);
      }
      exportData = source.filter(item => !item['Client Website'] && !item['Our Domain']);
    }
    
    if (exportData.length === 0) {
      alert("No websites with missing links found to export!");
      return;
    }
    
    const headers = ['Client Name', 'Type of website', 'Profile Name', 'Developer', 'Status', 'Deli_Last_Time', 'Client Website', 'Our Domain', 'Tags'];
    
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
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `no_website_included_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const duplicateUrlCounts = useMemo(() => {
    const counts = {};
    allData.forEach(item => {
      if (item['Client Website']) {
        const url = String(item['Client Website']).trim().toLowerCase();
        if (url) counts[url] = (counts[url] || 0) + 1;
      }
    });
    return counts;
  }, [allData]);

  const applyStatusFilter = (data) => {
    if (filterStatus === 'all') return data;
    return data.filter(item => {
      const status = (item['Status'] || '').toLowerCase().trim();
      const hasClientWebsite = !!item['Client Website'];
      const hasOurDomain = !!item['Our Domain'];
      
      switch (filterStatus) {
        case 'good': return status === 'good';
        case 'bad': return status === 'bad';
        case 'not_active': return status === 'not active';
        case 'missing_client': return !hasClientWebsite && hasOurDomain;
        case 'no_website': return !hasClientWebsite && !hasOurDomain;
        case 'has_client_website': return hasClientWebsite;
        case 'missing_client_name': return !item['Client Name'] || String(item['Client Name']).trim() === '';
        case 'duplicates': {
          if (!hasClientWebsite) return false;
          const url = String(item['Client Website']).trim().toLowerCase();
          return duplicateUrlCounts[url] > 1;
        }
        default: return true;
      }
    });
  };

  const baseFilteredData = useMemo(() => {
    let sourceData = allData;
    if (activeTab !== 'All') {
      sourceData = sourceData.filter(item => item.category === activeTab);
    }
    return applyStatusFilter(sourceData);
  }, [allData, activeTab, filterStatus]);

  const allAvailableTags = useMemo(() => {
    const activeTagsSet = new Set();
    const inactiveTagsSet = new Set();
    
    // Active tags are strictly those that exist in the currently filtered view
    baseFilteredData.forEach(item => {
      if (item['Tags']) {
        item['Tags'].split(',').forEach(t => {
           const trimmed = t.trim();
           if (trimmed) activeTagsSet.add(trimmed);
        });
      }
    });

    // Inactive tags are all other tags in the database
    allData.forEach(item => {
      if (item['Tags']) {
        item['Tags'].split(',').forEach(t => {
           const trimmed = t.trim();
           if (trimmed && !activeTagsSet.has(trimmed)) {
             inactiveTagsSet.add(trimmed);
           }
        });
      }
    });
    
    let combinedTags = [
      ...Array.from(activeTagsSet).sort(),
      ...Array.from(inactiveTagsSet).sort()
    ];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      combinedTags.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        // 1. Exact match gets highest priority
        const aExact = aLower === lowerSearch;
        const bExact = bLower === lowerSearch;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // 2. Starts with gets second priority
        const aStarts = aLower.startsWith(lowerSearch);
        const bStarts = bLower.startsWith(lowerSearch);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // 3. Includes gets third priority
        const aIncludes = aLower.includes(lowerSearch);
        const bIncludes = bLower.includes(lowerSearch);
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;
        
        // 4. Leave others in alphabetical order
        return 0;
      });
    }

    return combinedTags;
  }, [baseFilteredData, allData, searchTerm]);

  const filteredDataForStats = useMemo(() => {
    if (!searchTerm && activeSearchTags.length === 0) return baseFilteredData;
    
    return baseFilteredData.filter(item => {
      const tagString = (item['Tags'] || '').toLowerCase();
      const searchString = `${item['Client Name'] || ''} ${item['Type of website'] || ''} ${item['Tags'] || ''} ${item['Our Domain'] || ''} ${item['Client Website'] || ''} ${item['Profile Name'] || ''} ${item['Team Name'] || ''} ${item['Developer'] || ''}`.toLowerCase();
      const matchesTags = activeSearchTags.length === 0 || activeSearchTags.some(tag => tagString.includes(tag.toLowerCase()));
      const matchesText = !searchTerm || searchString.includes(searchTerm.toLowerCase());
      
      return matchesTags && matchesText;
    });
  }, [baseFilteredData, searchTerm, activeSearchTags]);

  const stats = useMemo(() => {
    let total = filteredDataForStats.length;
    let missingLinks = 0;
    let goodStatus = 0;
    let badStatus = 0;
    let notActiveStatus = 0;

    filteredDataForStats.forEach(item => {
      if (!item['Client Website'] && !item['Our Domain']) missingLinks++;
      const status = (item['Status'] || '').toLowerCase();
      if (status.includes('good')) goodStatus++;
      else if (status.includes('bad')) badStatus++;
      else if (status.includes('not active')) notActiveStatus++;
    });

    return { total, missingLinks, goodStatus, badStatus, notActiveStatus };
  }, [filteredDataForStats]);

  const statusCounts = useMemo(() => {
    let sourceData = allData;
    if (activeTab !== 'All') {
      sourceData = sourceData.filter(item => item.category === activeTab);
    }
    let good = 0;
    let bad = 0;
    let notActive = 0;
    let missingWebsites = 0;
    let hasWebsite = 0;

    sourceData.forEach(item => {
      const s = (item['Status'] || '').toLowerCase().trim();
      if (s.includes('good')) good++;
      else if (s.includes('bad')) bad++;
      else if (s.includes('not active')) notActive++;

      const hasClientWebsite = !!item['Client Website'];
      const hasOurDomain = !!item['Our Domain'];
      if (!hasClientWebsite && !hasOurDomain) missingWebsites++;
      if (hasClientWebsite) hasWebsite++;
    });

    return {
      all: sourceData.length,
      good,
      bad,
      notActive,
      missingWebsites,
      hasWebsite
    };
  }, [allData, activeTab]);

  const processedData = useMemo(() => {
    let data = filteredDataForStats;
    if (activeStatFilter === 'good') {
      data = data.filter(item => (item['Status'] || '').toLowerCase().includes('good'));
    } else if (activeStatFilter === 'bad') {
      data = data.filter(item => (item['Status'] || '').toLowerCase().includes('bad'));
    } else if (activeStatFilter === 'not_active') {
      data = data.filter(item => (item['Status'] || '').toLowerCase().includes('not active'));
    } else if (activeStatFilter === 'missing') {
      data = data.filter(item => !item['Client Website'] && !item['Our Domain']);
    }
    return data;
  }, [filteredDataForStats, activeStatFilter]);

  const duplicateWebsitesCount = useMemo(() => {
    if (!isAdmin) return 0;
    const urlCounts = {};
    let count = 0;
    allData.forEach(item => {
      if (item['Client Website']) {
        const url = item['Client Website'].trim().toLowerCase();
        if (url) {
          urlCounts[url] = (urlCounts[url] || 0) + 1;
          if (urlCounts[url] === 2) count++;
        }
      }
    });
    return count;
  }, [allData, isAdmin]);

  const groupedData = useMemo(() => {
    const groups = {};
    processedData.forEach((item, idx) => {
      let groupKey;
      if (filterStatus === 'duplicates') {
        groupKey = item['Client Website'] ? String(item['Client Website']).trim().toLowerCase() : `No Website - ${item.rowIndex || idx}`;
      } else {
        groupKey = item['Client Name'] ? String(item['Client Name']).trim() : `Unnamed-${item.rowIndex || idx}`;
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    
    // Hide ghost rows and partial duplicate rows if a more complete row exists
    Object.keys(groups).forEach(groupKey => {
      const items = groups[groupKey];
      if (items.length > 1 && filterStatus !== 'duplicates') {
        const cleanedItems = items.filter((item, i) => {
          return !items.some((other, j) => {
            if (i === j) return false;
            
            const iDom = (item['Our Domain'] || '').trim();
            const iWeb = (item['Client Website'] || '').trim();
            const oDom = (other['Our Domain'] || '').trim();
            const oWeb = (other['Client Website'] || '').trim();
            
            // If they have the exact same links, keep the first one
            if (iDom === oDom && iWeb === oWeb) {
               return i > j; 
            }
            
            // If `item` is missing Client Website but `other` has it, AND they share the same Domain (or item Domain is empty)
            if (iWeb === '' && oWeb !== '') {
               if (iDom === '' || iDom === oDom) return true;
            }
            
            // If `item` is missing Our Domain but `other` has it, AND they share the same Client Website
            if (iDom === '' && oDom !== '') {
               if (iWeb === '' || iWeb === oWeb) return true;
            }
            
            return false;
          });
        });
        
        if (cleanedItems.length > 0) {
          groups[groupKey] = cleanedItems;
        }
      }
    });

    return Object.entries(groups).sort((a, b) => {
      // 1. Prioritize cards with "Good" status first
      const aIsGood = a[1].some(item => (item['Status'] || '').toLowerCase().includes('good'));
      const bIsGood = b[1].some(item => (item['Status'] || '').toLowerCase().includes('good'));

      if (aIsGood && !bIsGood) return -1;
      if (!aIsGood && bIsGood) return 1;

      // 2. Prioritize cards with website links included first
      const aHasWebsite = a[1].some(item => !!item['Client Website'] || !!item['Our Domain']);
      const bHasWebsite = b[1].some(item => !!item['Client Website'] || !!item['Our Domain']);

      if (aHasWebsite && !bHasWebsite) return -1;
      if (!aHasWebsite && bHasWebsite) return 1;

      return a[0].localeCompare(b[0]);
    });
  }, [processedData]);

// Stats are now calculated above processedData

  const tabCounts = useMemo(() => {
    const sourceData = applyStatusFilter(allData);
    const counts = { All: sourceData.length, Wordpress: 0, WIX: 0, Shopify: 0, Document: 0 };
    sourceData.forEach(item => {
      if (item.category && counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    return counts;
  }, [allData, filterStatus]);

  const globalSearchCount = useMemo(() => {
    if ((!searchTerm && activeSearchTags.length === 0) || activeTab === 'All') return 0;
    
    const sourceData = applyStatusFilter(allData);
    const globalResults = sourceData.filter(item => {
      if (item.category === activeTab) return false;

      const tagString = (item['Tags'] || '').toLowerCase();
      const searchString = `${item['Client Name'] || ''} ${item['Type of website'] || ''} ${item['Tags'] || ''} ${item['Our Domain'] || ''} ${item['Client Website'] || ''} ${item['Profile Name'] || ''} ${item['Team Name'] || ''} ${item['Developer'] || ''}`.toLowerCase();
      const matchesTags = activeSearchTags.length === 0 || activeSearchTags.some(tag => tagString.includes(tag.toLowerCase()));
      const matchesText = !searchTerm || searchString.includes(searchTerm.toLowerCase());
      
      return matchesTags && matchesText;
    });
    
    const uniqueClients = new Set();
    globalResults.forEach(item => {
      const clientName = item['Client Name'] ? String(item['Client Name']).trim() : `Unnamed-${item.rowIndex || Math.random()}`;
      uniqueClients.add(clientName);
    });
    
    return uniqueClients.size;
  }, [allData, searchTerm, activeSearchTags, activeTab, filterStatus]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('good')) return styles.statusGood;
    if (s.includes('bad')) return styles.statusBad;
    return styles.statusInactive;
  };

  const getPreviewUrl = (url) => {
    if (!url) return null;
    let formattedUrl = String(url).trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    return `https://image.thum.io/get/width/600/crop/800/${formattedUrl}`;
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.stickyTop} ${!showTopBar ? styles.hiddenTop : ''}`}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 
              className={styles.title}
              onClick={() => {
                setSearchTerm('');
                setActiveSearchTags([]);
                setActiveTab('All');
                window.scrollTo(0, 0);
              }}
              style={{ cursor: 'pointer' }}
              title="Go to Home"
            >
              {siteName}
            </h1>
            {isAdmin && (
              <button className={styles.settingsButton} onClick={() => setIsSettingsModalOpen(true)} title="Settings">
                ⚙️
              </button>
            )}
          </div>

          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <button 
              className={styles.loginButton} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={isRefreshing || loading}
              onClick={handleManualRefresh}
              title="Refresh data from server"
            >
              <span style={{ display: 'inline-block', transition: 'transform 0.5s ease', transform: isRefreshing ? 'rotate(360deg)' : 'none' }}>🔄</span>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {isAdmin ? (
              <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
            ) : (
              <button className={styles.loginButton} onClick={() => setIsAuthModalOpen(true)}>Admin Login</button>
            )}
            {isAdmin && (
              <>
                <button className={styles.exportButton} onClick={() => setIsExportModalOpen(true)} title="Export clients to CSV with filter options">
                  ⬇️ Export CSV
                </button>
                <button 
                  className={styles.loginButton} 
                  onClick={() => setIsCSVImportModalOpen(true)} 
                  title="Import / Update links from CSV"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  ⬆️ Import CSV
                </button>
              </>
            )}
            <button className={styles.addButton} onClick={openAddModal}>
              + Add Website
            </button>
          </div>
        </header>

        <div className={styles.controlsContainer}>
          <div className={styles.controlPanel}>
            <div className={styles.panelRow}>
              {!searchTerm && (
                <div className={styles.segmentTrack}>
                  {[
                    { id: 'All', label: 'All', icon: '🌐' },
                    { id: 'Wordpress', label: 'WordPress', icon: '🅏' },
                    { id: 'WIX', label: 'WIX', icon: '⬢' },
                    { id: 'Shopify', label: 'Shopify', icon: '🛍️' },
                    { id: 'Document', label: 'Document', icon: '📄' }
                  ].map(tab => (
                    <button 
                      key={tab.id} 
                      className={`${styles.segmentTab} ${activeTab === tab.id ? styles.activeSegmentTab : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className={styles.tabIcon}>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className={styles.countBadge}>{tabCounts[tab.id] || 0}</span>
                    </button>
                  ))}
                </div>
              )}

              <select 
                className={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">⚡ All Status</option>
                <option value="good">🟢 Good ({statusCounts.good})</option>
                <option value="bad">🔴 Bad ({statusCounts.bad})</option>
                <option value="not_active">🟡 Not Active ({statusCounts.notActive})</option>
                <option value="no_website">🚫 No website ({statusCounts.missingWebsites})</option>
                <option value="has_client_website">🌐 With Website ({statusCounts.hasWebsite})</option>
                <option value="missing_client_name">👤 No Client name</option>
                {isAdmin && <option value="duplicates">⚠️ Show Duplicates</option>}
              </select>
            </div>

            <div className={styles.panelRow} style={{ marginTop: '0.5rem' }}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIconPrefix}>🔍</span>
                <div className={styles.searchInner}>
                  {activeSearchTags.map(tag => (
                    <span key={tag} className={styles.activeTagPill}>
                      {tag}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSearchTags(prev => prev.filter(t => t !== tag));
                        }}
                        className={styles.removeTagBtn}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    className={styles.searchBar} 
                    placeholder={(searchTerm || activeSearchTags.length > 0) ? "Search..." : "Search by client name, domain, or type..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  />
                </div>
                {(searchTerm || activeSearchTags.length > 0) && (
                  <button 
                    className={styles.clearSearchButton}
                    onClick={() => { setSearchTerm(''); setActiveSearchTags([]); }}
                    title="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          {allAvailableTags.length > 0 && isSearchFocused && (
            <div className={styles.suggestionTagsCloud}>
              {allAvailableTags.map(tag => (
                <button 
                  key={tag} 
                  className={`${styles.suggestionChip} ${activeSearchTags.includes(tag) ? styles.suggestionChipActive : ''}`}
                  onClick={() => {
                    if (activeSearchTags.includes(tag)) {
                      setActiveSearchTags(prev => prev.filter(t => t !== tag));
                    } else {
                      setActiveSearchTags(prev => [...prev, tag]);
                    }
                  }}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading data...</div>
      ) : (
        <div>
          {globalSearchCount > 0 && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
              <p style={{ color: '#93c5fd', marginBottom: '1rem', fontWeight: '500' }}>
                {groupedData.length === 0 ? 'However, we found ' : 'We also found '}{globalSearchCount} website{globalSearchCount !== 1 ? 's' : ''} matching your search in other tabs!
              </p>
              <button 
                className={styles.submitButton}
                style={{ width: 'auto', padding: '0.75rem 1.5rem', display: 'inline-block' }}
                onClick={() => setActiveTab('All')}
              >
                Search All Tabs
              </button>
            </div>
          )}

          <NoticeBoard
            notices={notices}
            activeTab={activeTab}
            isAdmin={isAdmin}
            onAddNotice={() => {
              setEditingNotice(null);
              setIsNoticeModalOpen(true);
            }}
            onEditNotice={(notice) => {
              setEditingNotice(notice);
              setIsNoticeModalOpen(true);
            }}
            onSilentAssignTab={(noticeData) => {
              handleSaveNotice(noticeData, true);
            }}
            onDeleteNotice={handleDeleteNotice}
            onReorderNotices={handleReorderNotices}
          />

          {activeTab !== 'Document' && (
            <>
              <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div 
                  className={styles.statCard} 
                  style={{ background: 'var(--card-bg)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: activeStatFilter === 'total' && filterStatus === 'all' ? '2px solid var(--accent)' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: activeStatFilter === 'total' && filterStatus === 'all' ? 'translateY(-2px)' : 'none', boxShadow: activeStatFilter === 'total' && filterStatus === 'all' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none' }}
                  onClick={() => { setActiveStatFilter('total'); setFilterStatus('all'); }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.35rem' }}>Total Results</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{stats.total}</div>
                </div>

                <div 
                  className={styles.statCard} 
                  style={{ background: 'var(--card-bg)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: filterStatus === 'good' || activeStatFilter === 'good' ? '2px solid #10b981' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: filterStatus === 'good' || activeStatFilter === 'good' ? 'translateY(-2px)' : 'none', boxShadow: filterStatus === 'good' || activeStatFilter === 'good' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none' }}
                  onClick={() => { setFilterStatus('good'); setActiveStatFilter('total'); }}
                >
                  <div style={{ color: '#34d399', fontSize: '0.875rem', marginBottom: '0.35rem', fontWeight: '600' }}>🟢 Good Status</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#34d399' }}>{stats.goodStatus}</div>
                </div>

                <div 
                  className={styles.statCard} 
                  style={{ background: 'var(--card-bg)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: filterStatus === 'bad' || activeStatFilter === 'bad' ? '2px solid #ef4444' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: filterStatus === 'bad' || activeStatFilter === 'bad' ? 'translateY(-2px)' : 'none', boxShadow: filterStatus === 'bad' || activeStatFilter === 'bad' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none' }}
                  onClick={() => { setFilterStatus('bad'); setActiveStatFilter('total'); }}
                >
                  <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '0.35rem', fontWeight: '600' }}>🔴 Bad Status</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f87171' }}>{stats.badStatus}</div>
                </div>

                <div 
                  className={styles.statCard} 
                  style={{ background: 'var(--card-bg)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: filterStatus === 'not_active' || activeStatFilter === 'not_active' ? '2px solid #f59e0b' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: filterStatus === 'not_active' || activeStatFilter === 'not_active' ? 'translateY(-2px)' : 'none', boxShadow: filterStatus === 'not_active' || activeStatFilter === 'not_active' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none' }}
                  onClick={() => { setFilterStatus('not_active'); setActiveStatFilter('total'); }}
                >
                  <div style={{ color: '#fbbf24', fontSize: '0.875rem', marginBottom: '0.35rem', fontWeight: '600' }}>🟡 Not Active</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>{stats.notActiveStatus}</div>
                </div>

                <div 
                  className={styles.statCard} 
                  style={{ background: 'var(--card-bg)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: filterStatus === 'no_website' || activeStatFilter === 'missing' ? '2px solid #f97316' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: filterStatus === 'no_website' || activeStatFilter === 'missing' ? 'translateY(-2px)' : 'none', boxShadow: filterStatus === 'no_website' || activeStatFilter === 'missing' ? '0 4px 12px rgba(249, 115, 22, 0.2)' : 'none' }}
                  onClick={() => { setFilterStatus('no_website'); setActiveStatFilter('total'); }}
                >
                  <div style={{ color: '#fb923c', fontSize: '0.875rem', marginBottom: '0.35rem', fontWeight: '600' }}>🚫 Missing Websites</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fb923c' }}>{stats.missingLinks}</div>
                </div>
              </div>

              {isAdmin && duplicateWebsitesCount > 0 && (
                <div style={{ marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.25rem 1.5rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: '#fca5a5', margin: 0, fontWeight: '500', fontSize: '1.1rem' }}>
                    ⚠️ Found <strong style={{ color: '#ef4444' }}>{duplicateWebsitesCount}</strong> duplicate website URL(s) in your database.
                  </p>
                  <button 
                    onClick={() => {
                      setFilterStatus('duplicates');
                      setActiveTab('All');
                      setActiveStatFilter('total');
                      setSearchTerm('');
                      setActiveSearchTags([]);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                  >
                    Review & Remove Duplicates
                  </button>
                </div>
              )}

              <motion.div layout className={styles.grid}>
                <AnimatePresence>
                {groupedData.length === 0 ? (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.emptyState}>
                    <p>No websites found in {activeTab}.</p>
                  </motion.div>
                ) : (
                groupedData.map(([clientName, group], index) => {
                  const isExpanded = expandedCard === clientName;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      key={clientName} 
                      data-card="true"
                      className={`${styles.card} ${group.length > 2 ? styles.cardWide3 : (group.length > 1 ? styles.cardWide2 : '')} ${isExpanded ? styles.expandedCard : ''}`}
                      onClick={() => setExpandedCard(isExpanded ? null : clientName)}
                      style={{ cursor: isExpanded ? 'default' : 'pointer' }}
                    >
                      <div className={`${styles.cardContent} ${isExpanded ? styles.scrollableContent : ''}`}>
                        <div className={styles.cardHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div className={styles.clientAvatar}>
                              {clientName ? clientName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <h3 className={styles.clientName}>{clientName}</h3>
                            <button 
                              className={styles.copyButton} 
                              onClick={(e) => { e.stopPropagation(); handleCopyLink(clientName); }}
                              title="Copy client name"
                              style={{ padding: '0.25rem', borderRadius: '4px' }}
                            >
                              {copiedLink === clientName ? '✓' : <CopyIcon />}
                            </button>
                          </div>
                        </div>
                        
                        <div 
                          className={`${styles.details} ${group.length > 1 ? styles.detailsGrid : ''}`}
                          style={group.length > 1 ? { display: 'grid', gridTemplateColumns: `repeat(${Math.min(group.length, 3)}, minmax(0, 1fr))`, gap: '1rem', width: '100%' } : {}}
                        >
                          {group.map((item, i) => {
                            const hasNoWebsite = !item['Client Website'] && !item['Our Domain'];
                            const isOrderDone = (item['Deadline Status'] || '').toLowerCase().includes('order done');
                            const needsWebsite = isOrderDone && !item['Client Website'];
                            const validUrl = item['Client Website'] || item['Our Domain'];
                            
                            return (
                              <div key={i} className={`${styles.websiteStackItem} ${needsWebsite ? styles.flashingWarning : ''}`}>
                                <div className={styles.internalPreviewContainer}>
                                  <PreviewThumbnail 
                                    clientWebsite={item['Client Website']} 
                                    ourDomain={item['Our Domain']} 
                                    onLivePreview={(url) => setPreviewUrlModal(url)} 
                                  />
                                  <button 
                                    className={styles.floatingEditButton} 
                                    onClick={(e) => { e.stopPropagation(); openEditModal(item); }} 
                                    title="Edit Entry"
                                  >
                                    <EditIcon /> <span>Edit</span>
                                  </button>
                                </div>
                                <div className={styles.stackItemHeader}>
                                  <div className={styles.stackItemInfo}>
                                    <span className={styles.categoryBadge}>{item.category}</span>
                                    {item['Type of website'] && item['Type of website'].toLowerCase() !== item.category.toLowerCase() && (
                                      <span className={styles.type}>{item['Type of website']}</span>
                                    )}
                                    {item['Profile Name'] && (
                                      <span className={styles.profileBadge}>{item['Profile Name']}</span>
                                    )}
                                    {item['Developer'] && (
                                      <span className={styles.categoryBadge} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>DEV: {item['Developer']}</span>
                                    )}
                                    {item['Deli_Last_Time'] && (
                                      <span className={styles.categoryBadge} style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>🕒 {item['Deli_Last_Time']}</span>
                                    )}
                                    {item['Status'] && !item['Status'].toLowerCase().includes('pxl') && (
                                      <span className={`${styles.status} ${getStatusClass(item['Status'])}`}>
                                        {(item['Status'].toLowerCase().includes('good') ? '🟢 ' : (item['Status'].toLowerCase().includes('bad') ? '🔴 ' : (item['Status'].toLowerCase().includes('not active') ? '🟡 ' : '')))}
                                        {item['Status']}
                                      </span>
                                    )}
                                    {item['Tags'] && item['Tags'].trim() && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem', width: '100%' }}>
                                        {item['Tags'].split(',').map((t, tagIdx) => {
                                          const trimmedTag = t.trim();
                                          if (!trimmedTag) return null;
                                          return (
                                            <span 
                                              key={tagIdx} 
                                              className={styles.categoryBadge} 
                                              style={{ 
                                                backgroundColor: 'rgba(139, 92, 246, 0.15)', 
                                                color: '#c084fc', 
                                                borderColor: 'rgba(139, 92, 246, 0.3)',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                padding: '0.15rem 0.5rem'
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!activeSearchTags.includes(trimmedTag)) {
                                                  setActiveSearchTags(prev => [...prev, trimmedTag]);
                                                }
                                              }}
                                              title="Click tag to filter"
                                            >
                                              🏷️ {trimmedTag}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <div className={styles.stackActions}>
                                    {isAdmin && (
                                      <button className={styles.deleteButton} onClick={(e) => { e.stopPropagation(); handleDelete(item); }} title="Delete Entry">
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {!item['Client Name'] && (
                                  <div className={styles.missingLinkWarning} style={{ marginBottom: '0.5rem' }}>
                                    ⚠️ CLIENT NAME NOT FOUND
                                  </div>
                                )}

                                {hasNoWebsite && needsWebsite ? (
                                  <div className={styles.noWebsiteAlert} style={{ border: '1px solid rgba(239, 68, 68, 0.4)', animation: 'pulse 2s infinite', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                                    <div>NO WEBSITE INCLUDED</div>
                                    <div style={{ color: '#f87171', fontWeight: 'bold' }}>🚨 ORDER DONE - INPUT THE WEBSITE</div>
                                  </div>
                                ) : hasNoWebsite ? (
                                  <div className={styles.noWebsiteAlert}>
                                    NO WEBSITE INCLUDED
                                  </div>
                                ) : !item['Client Website'] && (
                                  <div className={styles.missingLinkWarning}>
                                    ⚠️ CLIENT WEBSITE NOT FOUND
                                  </div>
                                )}

                                {needsWebsite && !hasNoWebsite && (
                                  <div className={styles.missingLinkWarning} style={{ animation: 'pulse 1s infinite', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                    🚨 ORDER DONE - INPUT THE WEBSITE
                                  </div>
                                )}
                                
                                {item['Client Website'] && (
                                <div className={`${styles.linkRow} ${styles.primaryLinkRow}`}>
                                  <div className={styles.linkInfo}>
                                    <span className={styles.linkLabel}>Client Website</span>
                                    <a href={item['Client Website']} target="_blank" rel="noreferrer" className={styles.link} onClick={e => e.stopPropagation()}>
                                      {item['Client Website'].replace(/^https?:\/\//, '')}
                                    </a>
                                  </div>
                                  <button 
                                    className={styles.copyButton} 
                                    onClick={(e) => { e.stopPropagation(); handleCopyLink(item['Client Website']); }}
                                    title="Copy link"
                                  >
                                    {copiedLink === item['Client Website'] ? '✓' : <CopyIcon />}
                                  </button>
                                </div>
                              )}
                              
                              {item['Our Domain'] && (
                                <div className={styles.linkRow}>
                                  <div className={styles.linkInfo}>
                                    <span className={styles.linkLabel}>Our Domain</span>
                                    <a href={item['Our Domain']} target="_blank" rel="noreferrer" className={styles.link} onClick={e => e.stopPropagation()}>
                                      {item['Our Domain'].replace(/^https?:\/\//, '')}
                                    </a>
                                  </div>
                                  <button 
                                    className={styles.copyButton} 
                                    onClick={(e) => { e.stopPropagation(); handleCopyLink(item['Our Domain']); }}
                                    title="Copy link"
                                  >
                                    {copiedLink === item['Our Domain'] ? '✓' : <CopyIcon />}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      )}{isModalOpen && (
        <Modal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }} 
          onSubmit={handleAddData} 
          initialData={editingItem}
          activeTab={activeTab}
          availableProfiles={fullProfilesList}
          availableTeams={availableTeams}
          availableDevelopers={availableDevelopers}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLogin}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveSettings}
          currentSiteName={siteName}
          currentProfiles={fullProfilesList}
          currentKamSheetId={kamSheetId}
        />
      )}

      {/* Side Panel Drawer */}
      <AnimatePresence>
        {expandedCard && groupedData.find(g => g[0] === expandedCard) && (() => {
          const group = groupedData.find(g => g[0] === expandedCard)[1];
          return (
            <>
              {/* Overlay covering entire screen on all devices */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.mobileOverlay}
                onClick={() => setExpandedCard(null)}
              />
              {/* Centered Modal Wrapper */}
              <div className={styles.lightboxWrapper}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 30 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={styles.sidePanel}
                >
                <div className={styles.sidePanelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h2 className={styles.sidePanelTitle}>{expandedCard}</h2>
                    <button 
                      className={styles.copyButton} 
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(expandedCard); }}
                      title="Copy client name"
                      style={{ padding: '0.35rem', borderRadius: '6px' }}
                    >
                      {copiedLink === expandedCard ? '✓' : <CopyIcon />}
                    </button>
                  </div>
                  <button className={styles.closeButton} onClick={() => setExpandedCard(null)}>
                    ✕
                  </button>
                </div>
                <div className={styles.sidePanelContent}>
                  {group.map((item, i) => {
                    const validUrl = item['Client Website'] || item['Our Domain'];
                    const previewUrl = getPreviewUrl(validUrl);
                    
                    return (
                      <div key={i} className={styles.panelItem}>
                          <div className={styles.panelImageContainer}>
                            <PreviewThumbnail 
                              clientWebsite={item['Client Website']} 
                              ourDomain={item['Our Domain']} 
                              onLivePreview={(url) => setPreviewUrlModal(url)} 
                            />
                          </div>
                        
                        <div className={styles.panelDetails}>
                          <div className={styles.panelBadges}>
                            <span className={styles.categoryBadge}>{item.category}</span>
                            {item['Type of website'] && (
                              <span className={styles.type}>{item['Type of website']}</span>
                            )}
                            {item['Developer'] && (
                              <span className={styles.categoryBadge} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>DEV: {item['Developer']}</span>
                            )}
                            {item['Deli_Last_Time'] && (
                              <span className={styles.categoryBadge} style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>🕒 {item['Deli_Last_Time']}</span>
                            )}
                            {item['Status'] && !item['Status'].toLowerCase().includes('pxl') && (
                              <span className={`${styles.status} ${getStatusClass(item['Status'])}`}>
                                {(item['Status'].toLowerCase().includes('good') ? '🟢 ' : (item['Status'].toLowerCase().includes('bad') ? '🔴 ' : (item['Status'].toLowerCase().includes('not active') ? '🟡 ' : '')))}
                                {item['Status']}
                              </span>
                            )}
                          </div>
                          
                          {item['Profile Name'] && (
                            <div className={styles.panelRow}><strong>Profile:</strong> {item['Profile Name']}</div>
                          )}
                          {item['Team Name'] && (
                            <div className={styles.panelRow}><strong>Team:</strong> {item['Team Name']}</div>
                          )}
                          {item['Developer'] && (
                            <div className={styles.panelRow}><strong>Dev:</strong> {item['Developer']}</div>
                          )}
                          {item['Deli_Last_Time'] && (
                            <div className={styles.panelRow}><strong>Deli Last Time:</strong> {item['Deli_Last_Time']}</div>
                          )}
                          {item['Tags'] && item['Tags'].trim() && (
                            <div className={styles.panelRow} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <strong>Tags:</strong>
                              {item['Tags'].split(',').map((t, tagIdx) => {
                                const trimmedTag = t.trim();
                                if (!trimmedTag) return null;
                                return (
                                  <span 
                                    key={tagIdx} 
                                    className={styles.categoryBadge} 
                                    style={{ 
                                      backgroundColor: 'rgba(139, 92, 246, 0.15)', 
                                      color: '#c084fc', 
                                      borderColor: 'rgba(139, 92, 246, 0.3)',
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!activeSearchTags.includes(trimmedTag)) {
                                        setActiveSearchTags(prev => [...prev, trimmedTag]);
                                      }
                                    }}
                                    title="Click tag to filter"
                                  >
                                    🏷️ {trimmedTag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          
                          <div className={styles.panelLinks}>
                            {item['Client Website'] && (
                              <div className={styles.linkRow}>
                                <div className={styles.linkInfo}>
                                  <span className={styles.linkLabel}>Client Website</span>
                                  <a href={item['Client Website']} target="_blank" rel="noreferrer" className={styles.link}>
                                    {item['Client Website'].replace(/^https?:\/\//, '')}
                                  </a>
                                </div>
                                <button className={styles.copyButton} onClick={() => handleCopyLink(item['Client Website'])}>
                                  {copiedLink === item['Client Website'] ? '✓' : <CopyIcon />}
                                </button>
                              </div>
                            )}
                            {item['Our Domain'] && (
                              <div className={styles.linkRow}>
                                <div className={styles.linkInfo}>
                                  <span className={styles.linkLabel}>Our Domain</span>
                                  <a href={item['Our Domain']} target="_blank" rel="noreferrer" className={styles.link}>
                                    {item['Our Domain'].replace(/^https?:\/\//, '')}
                                  </a>
                                </div>
                                <button className={styles.copyButton} onClick={() => handleCopyLink(item['Our Domain'])}>
                                  {copiedLink === item['Our Domain'] ? '✓' : <CopyIcon />}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className={styles.panelActions}>
                            <button className={styles.editButtonPanel} onClick={() => openEditModal(item)}>
                              <EditIcon /> Edit Details
                            </button>
                            {isAdmin && (
                              <button className={styles.deleteButtonPanel} onClick={() => handleDelete(item)}>
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </motion.div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>

      {previewUrlModal && (
        <IframeModal 
          url={previewUrlModal} 
          onClose={() => setPreviewUrlModal(null)} 
        />
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Website"
        message="Are you sure you want to delete this website? This cannot be undone."
      />

      <ConfirmModal
        isOpen={!!noticeToDelete}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={executeDeleteNotice}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
      />

      {isCSVImportModalOpen && (
        <CSVImportModal 
          onClose={() => setIsCSVImportModalOpen(false)}
          onImportSuccess={() => fetchAllData(false, true)}
          adminPassword={adminPassword}
        />
      )}

      {isNoticeModalOpen && (
        <NoticeModal
          onClose={() => {
            setIsNoticeModalOpen(false);
            setEditingNotice(null);
          }}
          onSubmit={handleSaveNotice}
          initialData={editingNotice}
          activeTab={activeTab}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          allData={allData}
          baseFilteredData={baseFilteredData}
          processedData={processedData}
          activeTab={activeTab}
          activeSearchTags={activeSearchTags}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
}
