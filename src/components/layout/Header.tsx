"use client";

import { useState, useEffect } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { Bell, Search, Sun, Moon, Check, ShieldAlert, Key, HelpCircle } from 'lucide-react';

export function Header() {
  const { notifications, markNotificationRead, markAllNotificationsRead, currentUser } = useTransitStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Sync theme on mount
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 px-6 flex items-center justify-between shrink-0 select-none relative z-20 transition-colors duration-200">
      {/* Search Input */}
      <div className="relative w-72 max-w-sm hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Global system search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-800 dark:text-slate-200 transition-all"
        />
      </div>

      {/* Title block on mobile */}
      <div className="sm:hidden font-bold text-sm tracking-tight">
        TransitOps
      </div>

      {/* Action items */}
      <div className="flex items-center gap-4">
        {/* Toggle Theme */}
        <button
          onClick={toggleDarkMode}
          className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all"
          title="Toggle system theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl z-40 overflow-hidden text-xs">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">System Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={10} />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400">
                      No active notifications.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-3 transition-colors ${
                          notif.read ? 'bg-transparent' : 'bg-indigo-50/20 dark:bg-indigo-950/10'
                        } flex items-start gap-2.5`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          notif.type.includes('Expiry') ? 'bg-amber-500/10 text-amber-500' :
                          notif.type.includes('Breakdown') ? 'bg-red-500/10 text-red-500' :
                          'bg-indigo-500/10 text-indigo-500'
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
                                className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                              >
                                Mark as read
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
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="text-right hidden md:block">
            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none mb-1">
              {currentUser?.fullName}
            </h5>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">
              {currentUser?.role}
            </span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-indigo-600/10 uppercase">
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
