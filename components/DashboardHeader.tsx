
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Settings,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileCode,
  Share2,
  LogOut,
  User,
  Shield,
  Plus,
  Upload,
  Sun,
  Moon,
  Loader2,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Copy,
  Braces
} from 'lucide-react';
import { Button } from './Button';
import { apiService } from '../services/api';
import { AnalyticsData } from '../types';

interface HeaderProps {
  onUploadClick: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  analyticsData?: AnalyticsData | null;
  username: string;
}

export const DashboardHeader: React.FC<HeaderProps> = ({ onUploadClick, onLogout, isDarkMode, toggleTheme, analyticsData, username }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Health check on mount and every 30 seconds
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthy = await apiService.healthCheck();
        setIsHealthy(healthy);
      } catch {
        setIsHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const iconButtonStyles = "p-2 sm:p-2.5 bg-surface-light/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-xl sm:rounded-2xl text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:bg-primary/10 transition-all duration-300 shadow-sm border border-border-light/50 dark:border-border-dark/50 active:scale-95 theme-transition ring-1 ring-inset ring-white/10 dark:ring-white/5";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: string) => {
    setExportStatus('loading');
    setExportMessage('');
    setIsExportOpen(false);
    
    try {
      if (format === 'PDF') {
        await apiService.downloadReport();
        setExportStatus('success');
        setExportMessage('PDF report downloaded successfully!');
      } else if (format === 'JSON') {
        if (!analyticsData) {
          throw new Error('No data available');
        }
        const jsonStr = JSON.stringify(analyticsData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${analyticsData.dataset_id || 'data'}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportStatus('success');
        setExportMessage('JSON exported successfully!');
      } else if (format === 'Clipboard') {
        if (!analyticsData) {
          throw new Error('No data available');
        }
        const jsonStr = JSON.stringify(analyticsData, null, 2);
        await navigator.clipboard.writeText(jsonStr);
        setExportStatus('success');
        setExportMessage('Analytics data copied to clipboard!');
      } else if (format === 'CSV') {
        setExportStatus('success');
        setExportMessage('CSV export coming soon!');
      } else if (format === 'Excel') {
        setExportStatus('success');
        setExportMessage('Excel export coming soon!');
      }
    } catch (error) {
      setExportStatus('error');
      setExportMessage('Failed to export. Please try again.');
      console.error('Export error:', error);
    }
    
    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      setExportStatus('idle');
      setExportMessage('');
    }, 3000);
  };

  const exportOptions = [
    { label: 'Download PDF Report', icon: <FileText size={16} />, format: 'PDF' },
    { label: 'Export as JSON', icon: <Braces size={16} />, format: 'JSON' },
    { label: 'Copy to Clipboard', icon: <Copy size={16} />, format: 'Clipboard' },
    { label: 'Export to CSV', icon: <FileCode size={16} />, format: 'CSV' },
    { label: 'Export to Excel', icon: <FileSpreadsheet size={16} />, format: 'Excel' },
  ];

  return (
    <header className="w-full flex items-center justify-between py-3 sm:py-4 mb-2 sm:mb-4 relative z-50">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/90 backdrop-blur-md rounded-lg sm:rounded-xl flex items-center justify-center text-black font-black text-lg sm:text-xl italic shadow-md border border-white/20">
          C
        </div>
        <h2 className="text-lg sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tighter">Dashboard</h2>
        {/* Health Status Indicator */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
          isHealthy === null 
            ? 'bg-textMuted-light/10 dark:bg-textMuted-dark/10 text-textMuted-light dark:text-textMuted-dark border-border-light/30 dark:border-border-dark/30'
            : isHealthy 
              ? 'bg-success/10 text-success border-success/30' 
              : 'bg-danger/10 text-danger border-danger/30'
        }`}>
          {isHealthy === null ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isHealthy ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          <span className="hidden md:inline">{isHealthy === null ? 'Checking...' : isHealthy ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Quick Upload Button */}
        <Button 
          variant="primary" 
          size="sm" 
          icon={<Upload size={18} />} 
          onClick={onUploadClick} 
          className="rounded-2xl font-bold mr-2 hidden md:inline-flex"
        >
          Upload CSV
        </Button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button 
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-surface-light/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-xl sm:rounded-2xl text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:bg-primary/10 transition-all duration-300 shadow-sm border border-border-light/50 dark:border-border-dark/50 active:scale-95 font-bold text-xs sm:text-sm theme-transition ring-1 ring-inset ring-white/10 dark:ring-white/5"
          >
            <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={14} className="sm:w-4 sm:h-4 transition-transform duration-300 ${isExportOpen ? 'rotate-180' : ''}" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
              <div className="p-2">
                {exportOptions.map((option) => (
                  <button
                    key={option.format}
                    onClick={() => handleExport(option.format)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark hover:bg-primary/10 transition-all rounded-2xl group text-left"
                  >
                    <span className="text-textMuted-light dark:text-textMuted-dark group-hover:text-primary transition-colors">
                      {option.icon}
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block h-8 w-px bg-border-light/50 dark:bg-border-dark/50 mx-1" />

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={iconButtonStyles}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className={`${iconButtonStyles} relative`} aria-label="Notifications">
          <Bell size={18} className="sm:w-5 sm:h-5" />
          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-danger rounded-full border-2 border-surface-light dark:border-surface-dark" />
        </button>

        {/* Settings / User Profile Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={iconButtonStyles} 
            aria-label="Settings"
          >
            <Settings size={18} className="sm:w-5 sm:h-5" />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
              <div className="p-5 border-b border-border-light/30 dark:border-border-dark/30 bg-muted-light/30 dark:bg-muted-dark/30">
                <div className="flex items-center gap-3 mb-1">
                   <div className="w-10 h-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center text-black font-bold border border-white/20">{username.charAt(0).toUpperCase()}</div>
                   <div>
                     <p className="text-sm font-black text-textPrimary-light dark:text-textPrimary-dark">{username}</p>
                     <p className="text-xs text-textMuted-light dark:text-textMuted-dark">User</p>
                   </div>
                </div>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark hover:bg-primary/10 transition-all rounded-2xl group text-left">
                  <User size={16} />
                  Account Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark hover:bg-primary/10 transition-all rounded-2xl group text-left">
                  <Shield size={16} />
                  Privacy & Security
                </button>
                <div className="h-px bg-border-light/30 dark:bg-border-dark/30 my-1 mx-2" />
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-danger hover:bg-danger/10 transition-all rounded-2xl text-left"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Status Toast Notification */}
      {exportStatus !== 'idle' && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border animate-in slide-in-from-bottom-4 fade-in duration-300 ${
          exportStatus === 'loading' 
            ? 'bg-surface-light/90 dark:bg-surface-dark/90 border-primary/30' 
            : exportStatus === 'success' 
              ? 'bg-success/10 dark:bg-success/20 border-success/30' 
              : 'bg-danger/10 dark:bg-danger/20 border-danger/30'
        }`}>
          {exportStatus === 'loading' && (
            <Loader2 size={20} className="text-primary animate-spin" />
          )}
          {exportStatus === 'success' && (
            <CheckCircle size={20} className="text-success" />
          )}
          {exportStatus === 'error' && (
            <XCircle size={20} className="text-danger" />
          )}
          <span className={`text-sm font-bold ${
            exportStatus === 'loading' 
              ? 'text-textPrimary-light dark:text-textPrimary-dark' 
              : exportStatus === 'success' 
                ? 'text-success' 
                : 'text-danger'
          }`}>
            {exportStatus === 'loading' ? 'Generating PDF report...' : exportMessage}
          </span>
        </div>
      )}
    </header>
  );
};
