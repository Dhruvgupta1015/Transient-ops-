"use client";

import { useState, useEffect } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { Bell, Search, Sun, Moon, Check, ShieldAlert, ChevronDown, Languages, CloudSun, Menu } from 'lucide-react';
import { useSidebar } from '@/app/(dashboard)/layout';

export function Header() {
  const { notifications, markNotificationRead, markAllNotificationsRead, currentUser } = useTransitStore();
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState('Seoul Hub Operations');
  const [selectedLang, setSelectedLang] = useState('KO');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Force Day/Light Theme on mount
    document.documentElement.classList.remove('dark');
    setDarkMode(false);

    // Format current date English-style: July 12, 2026 (Sun)
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ` (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]})`;
    setCurrentTime(formattedDate);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-[#e2e8f0] dark:border-[#2a2c35] bg-white dark:bg-[#1e293b] px-4 md:px-6 flex items-center justify-between shrink-0 select-none relative z-20 transition-colors duration-200">
      
      {/* Workspace Switcher & Search */}
      <div className="flex items-center gap-2 md:gap-6">
        {/* Mobile Toggle Button */}
        <button 
          onClick={() => setMobileOpen(!isMobileOpen)}
          className="h-8 w-8 rounded-xl border border-[#e2e8f0] dark:border-[#2a2c35] flex lg:hidden items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer mr-1 transition-all"
          title="Toggle Menu"
        >
          <Menu size={16} />
        </button>

        {/* Workspace Switcher */}
        <div className="relative">
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#2a2c35] bg-[#f8fafc] dark:bg-[#2a2c35]/40 hover:bg-[#f1f5f9] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span>{selectedWorkspace}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {showWorkspaceDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowWorkspaceDropdown(false)} />
              <div className="absolute left-0 mt-1.5 w-52 bg-white dark:bg-[#20222a] border border-[#e2e8f0] dark:border-[#2a2c35] rounded-xl shadow-lg z-40 p-1 text-xs">
                {['Seoul Hub Operations', 'Busan Port Terminal', 'Incheon Logistics Depot'].map((workspace) => (
                  <button
                    key={workspace}
                    onClick={() => {
                      setSelectedWorkspace(workspace);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${
                      selectedWorkspace === workspace
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {workspace}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicles, drivers, trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#f8fafc] dark:bg-[#2a2c35]/40 border border-[#e2e8f0] dark:border-[#2a2c35] rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-800 dark:text-slate-200 transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Action items */}
      <div className="flex items-center gap-3">
        
        {/* Date & Simulated Weather */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-r border-[#e2e8f0] dark:border-[#2a2c35] pr-4">
          <span className="font-medium">{currentTime}</span>
          <div className="flex items-center gap-1 bg-[#f4eaed] dark:bg-pink-950/20 text-[#8a6a7c] dark:text-pink-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <CloudSun size={12} className="shrink-0" />
            <span>Seoul 24°C</span>
          </div>
        </div>

        {/* Notifications Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-8 w-8 rounded-xl border border-[#e2e8f0] dark:border-[#2a2c35] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all relative"
          >
            <Bell size={14} className="text-blue-500" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-[#20222a] border border-[#e2e8f0] dark:border-[#2a2c35] rounded-2xl shadow-xl z-40 overflow-hidden text-xs">
                <div className="px-4 py-3 border-b border-[#e2e8f0] dark:border-[#2a2c35] flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">System Alerts</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={10} />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400">
                      No alerts active.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-3 transition-colors ${
                          notif.read ? 'bg-transparent' : 'bg-blue-50/20 dark:bg-blue-950/10'
                        } flex items-start gap-2.5`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          notif.type.includes('Expiry') ? 'bg-amber-500/10 text-amber-500' :
                          notif.type.includes('Breakdown') ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          <ShieldAlert size={12} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-[11px] leading-normal text-slate-700 dark:text-slate-300 font-medium">
                            {notif.message}
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span>{new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {!notif.read && (
                              <button 
                                onClick={() => markNotificationRead(notif.id)}
                                className="text-blue-500 hover:text-blue-400 font-semibold cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Identity Info */}
        <div className="flex items-center gap-2.5 border-l border-[#e2e8f0] dark:border-[#2a2c35] pl-3.5">
          <div className="text-right hidden sm:block">
            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none mb-1">
              {currentUser?.fullName}
            </h5>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">
              {currentUser?.role}
            </span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm uppercase shrink-0">
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
