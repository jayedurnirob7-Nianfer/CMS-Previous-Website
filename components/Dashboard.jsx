'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './Dashboard.module.css';
import Modal from './Modal';
import AuthModal from './AuthModal';
import SettingsModal from './SettingsModal';
import ImportModal from './ImportModal';
import IframeModal from './IframeModal';
import ConfirmModal from './ConfirmModal';

const API_URL = 'https://script.google.com/macros/s/AKfycbzQTOF3LNIr3wOyvEzNvlUMXa3PeWQl80tHlwaqYnXf1rRF09BLAO8VydmmARi8XdxniA/exec';

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

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTags, setActiveSearchTags] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState('total');
  const [previewUrlModal, setPreviewUrlModal] = useState(null);

  const [activeTab, setActiveTab] = useState('All');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [siteName, setSiteName] = useState('CMS Dashboard');
  const [availableProfiles, setAvailableProfiles] = useState(['thestudioxx_fiverr', 'sketchmuse_fiverr']);
  const [kamSheetId, setKamSheetId] = useState('');
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const savedPassword = localStorage.getItem('cms_admin_password');
    if (savedPassword) {
      setAdminPassword(savedPassword);
      setIsAdmin(true);
    }
    fetchSettings();
    fetchAllData(false); // Initial load (not silent)

    // Silent background polling every 60 seconds to avoid Google Apps Script rate limits
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}?action=getSettings&t=${Date.now()}`);
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowTopBar(false); // Scrolled down
      } else if (currentScrollY < lastScrollY) {
        setShowTopBar(true); // Scrolled up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  const fetchAllData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=getAllData&t=${Date.now()}`);
      const result = await response.json();
      if (Array.isArray(result)) {
        setAllData(result);
      } else {
        setAllData([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      if (!isSilent) {
        alert(`Failed to load data. Error: ${error.message}`);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleAddData = async (newData) => {
    const payload = editingItem 
      ? { ...newData, action: 'update', rowIndex: editingItem.rowIndex, oldSheet: editingItem.category }
      : { ...newData, action: 'create', sheet: newData.sheet || activeTab };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchAllData(); 
        setIsModalOpen(false);
        setEditingItem(null);
      } else {
        alert("Error saving data: " + result.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert(`Failed to save data. Error: ${error.message}`);
    }
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
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'delete', sheet: itemToDelete.category, rowIndex: itemToDelete.rowIndex, password: adminPassword })
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchAllData();
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

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleCopyLink = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleExportCSV = () => {
    if (processedData.length === 0) {
      alert("No data to export!");
      return;
    }
    
    const headers = ['Client Name', 'Type of website', 'Profile Name', 'Developer', 'Status', 'Deadline Status', 'Client Website', 'Our Domain', 'Tags'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of processedData) {
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
    link.setAttribute("download", `cms_export_${new Date().toISOString().slice(0,10)}.csv`);
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

    filteredDataForStats.forEach(item => {
      if (!item['Client Website'] && !item['Our Domain']) missingLinks++;
      const status = (item['Status'] || '').toLowerCase();
      if (status.includes('good')) goodStatus++;
    });

    return { total, missingLinks, goodStatus };
  }, [filteredDataForStats]);

  const processedData = useMemo(() => {
    let data = filteredDataForStats;
    if (activeStatFilter === 'good') {
      data = data.filter(item => (item['Status'] || '').toLowerCase().includes('good'));
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

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [processedData]);

// Stats are now calculated above processedData

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
            {isAdmin ? (
              <>
                <button 
                  className={styles.loginButton} 
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  disabled={isImporting}
                  onClick={() => {
                    if (!kamSheetId) {
                      alert("Please set your KAM Auto-Sync Sheet ID in the Admin Settings first!");
                      setIsSettingsModalOpen(true);
                    } else {
                      handleImport(kamSheetId);
                    }
                  }}
                >
                  {isImporting ? (
                    <>
                      <div className={styles.spinner} style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      Importing...
                    </>
                  ) : (
                    "Import From KAM"
                  )}
                </button>
                <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className={styles.loginButton} onClick={() => setIsAuthModalOpen(true)}>Admin Login</button>
            )}
            {isAdmin && (
              <button className={styles.exportButton} onClick={handleExportCSV} title="Export to CSV">
                ⬇️ Export
              </button>
            )}
            <button className={styles.addButton} onClick={openAddModal}>
              + Add Website
            </button>
          </div>
        </header>

        <div className={styles.controlsContainer}>
          {!searchTerm && (
            <div className={styles.tabsContainer}>
              {['All', 'Wordpress', 'WIX', 'Shopify'].map(tab => (
                <button 
                  key={tab} 
                  className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
          <div className={styles.filterContainer}>
            <select 
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="good">Good</option>
              <option value="bad">Bad</option>
              <option value="not_active">Not Active</option>
              <option value="missing_client_name">Client Name Not Found</option>
              <option value="missing_client">Client Website Not Found</option>
              <option value="no_website">No Website Included</option>
              <option value="has_client_website">Client Website Included</option>
              {isAdmin && <option value="duplicates">⚠️ Show Duplicates</option>}
            </select>
            <div className={styles.searchWrapper}>
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
                  &times;
                </button>
              )}
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

          <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div 
              className={styles.statCard} 
              style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: activeStatFilter === 'total' ? '2px solid var(--accent)' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: activeStatFilter === 'total' ? 'translateY(-2px)' : 'none', boxShadow: activeStatFilter === 'total' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none' }}
              onClick={() => setActiveStatFilter('total')}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Results</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{stats.total}</div>
            </div>
            <div 
              className={styles.statCard} 
              style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: activeStatFilter === 'good' ? '2px solid var(--success)' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: activeStatFilter === 'good' ? 'translateY(-2px)' : 'none', boxShadow: activeStatFilter === 'good' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none' }}
              onClick={() => setActiveStatFilter('good')}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Good Status</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.goodStatus}</div>
            </div>
            <div 
              className={styles.statCard} 
              style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: activeStatFilter === 'missing' ? '2px solid #fbbf24' : '1px solid var(--card-border)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s ease', transform: activeStatFilter === 'missing' ? 'translateY(-2px)' : 'none', boxShadow: activeStatFilter === 'missing' ? '0 4px 12px rgba(251, 191, 36, 0.2)' : 'none' }}
              onClick={() => setActiveStatFilter('missing')}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Missing Websites</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{stats.missingLinks}</div>
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
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
                  key={clientName} 
                  data-card="true"
                  className={`${styles.card} ${group.length > 1 ? styles.cardWide : ''} ${isExpanded ? styles.expandedCard : ''}`}
                  onClick={() => setExpandedCard(isExpanded ? null : clientName)}
                  style={{ cursor: isExpanded ? 'default' : 'pointer' }}
                >
                  <div className={`${styles.cardContent} ${isExpanded ? styles.scrollableContent : ''}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.clientName}>{clientName}</h3>
                    </div>
                    
                    <div className={`${styles.details} ${group.length > 1 ? styles.detailsGrid : ''}`}>
                      {group.map((item, i) => {
                        const hasNoWebsite = !item['Client Website'] && !item['Our Domain'];
                        const isOrderDone = (item['Deadline Status'] || '').toLowerCase().includes('order done');
                        const needsWebsite = isOrderDone && !item['Client Website'];
                        const validUrl = item['Client Website'] || item['Our Domain'];
                        const previewUrl = getPreviewUrl(validUrl);
                        
                        return (
                          <div key={i} className={`${styles.websiteStackItem} ${needsWebsite ? styles.flashingWarning : ''}`}>
                            <div className={styles.internalPreviewContainer} style={{ group: 'hover' }}>
                              {previewUrl ? (
                                <>
                                  <Image 
                                    src={previewUrl} 
                                    alt="Website Preview" 
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className={styles.internalPreviewImage}
                                  />
                                  <div className={styles.previewOverlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setPreviewUrlModal(validUrl); }}
                                      style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                                    >
                                      👁️ Live Preview
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className={styles.noPreview}>No preview available</div>
                              )}
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
                                {item['Status'] && (
                                  <span className={`${styles.status} ${getStatusClass(item['Status'])}`}>
                                    {item['Status']}
                                  </span>
                                )}
                              </div>
                              <div className={styles.stackActions}>
                                <button className={styles.editButton} onClick={(e) => { e.stopPropagation(); openEditModal(item); }} title="Edit Entry">
                                  <EditIcon />
                                </button>
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

                    {(() => {
                      const allTags = Array.from(new Set(
                        group.flatMap(item => 
                          item['Tags'] ? item['Tags'].split(',').map(t => t.trim()).filter(Boolean) : []
                        )
                      ));
                      
                      if (allTags.length === 0) return null;
                      
                      return (
                        <div className={styles.tagsContainer} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          {allTags.map((tag, i) => (
                            <span key={i} className={styles.tag}>{tag}</span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })
          )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {isModalOpen && (
        <Modal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }} 
          onSubmit={handleAddData} 
          initialData={editingItem}
          activeTab={activeTab}
          availableProfiles={availableProfiles}
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
          currentProfiles={availableProfiles}
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
                  <h2 className={styles.sidePanelTitle}>{expandedCard}</h2>
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
                        {previewUrl && (
                          <div className={styles.panelImageContainer}>
                            <Image 
                              src={previewUrl} 
                              alt="Website Preview" 
                              fill
                              sizes="(max-width: 768px) 100vw, 400px"
                              className={styles.panelImage}
                            />
                            <div className={styles.panelOverlay}>
                              <button 
                                onClick={() => setPreviewUrlModal(validUrl)}
                                className={styles.panelPreviewBtn}
                              >
                                👁️ Live Preview
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className={styles.panelDetails}>
                          <div className={styles.panelBadges}>
                            <span className={styles.categoryBadge}>{item.category}</span>
                            {item['Type of website'] && (
                              <span className={styles.type}>{item['Type of website']}</span>
                            )}
                            {item['Status'] && (
                              <span className={`${styles.status} ${getStatusClass(item['Status'])}`}>
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
                          
                          {item['Tags'] && (
                            <div className={styles.panelTags}>
                              {item['Tags'].split(',').map((t, idx) => t.trim() ? <span key={idx} className={styles.tag}>{t.trim()}</span> : null)}
                            </div>
                          )}
                          
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
    </div>
  );
}
