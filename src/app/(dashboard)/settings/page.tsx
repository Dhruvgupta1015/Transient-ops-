"use client";

import { useState } from 'react';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { Settings, Shield, Database, Download, RefreshCw, Terminal, Check } from 'lucide-react';

export default function SettingsPage() {
  const { 
    currentUser, 
    login, 
    auditLogs, 
    resetStore, 
    logAction 
  } = useTransitStore();

  const [activeRole, setActiveRole] = useState<UserRole>(currentUser?.role || 'Administrator');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as UserRole;
    setActiveRole(role);
    login(currentUser?.email || 'admin@transitops.com', role);
    setSuccessMsg(`Access clearance changed to: ${role}. Layout shell updated.`);
    logAction('Clearance Modification', `Changed active session role to ${role}`);
  };

  // Compile and download state as JSON backup
  const handleBackupDatabase = () => {
    const storeState = localStorage.getItem('transitops-storage-v1');
    if (!storeState) {
      alert('Error: Storage cache empty. Please make some operational changes first.');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(storeState);
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `transitops_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logAction('System Backup', 'Exported database state JSON backup file');
    setSuccessMsg('Operational database backed up. JSON payload downloaded.');
  };

  const handleDatabaseReset = () => {
    if (confirm('CAUTION: This will purge all active logs, registrations and custom trips, resetting the local storage to initial mock seed records. Proceed?')) {
      resetStore();
      setSuccessMsg('Platform database restored to initial seed configurations.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Settings & Utilities</h2>
          <p className="text-xs text-muted-foreground">Manage RBAC credentials, audit logs, and local state backup registries.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Left Column: Config Panel */}
        <div className="space-y-6">
          {/* RBAC Session Switcher */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Shield size={14} className="text-indigo-500" /> Active Session Authorization</h3>
            <p className="text-[11px] text-slate-400">Change your active clearance level to evaluate the application page gating and locking permissions rules.</p>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Access Clearance Level</label>
              <select
                value={activeRole}
                onChange={handleRoleChange}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="Administrator">Administrator (Full System Access)</option>
                <option value="Fleet Manager">Fleet Manager (Vehicles, Drivers, Maintenance)</option>
                <option value="Dispatcher">Dispatcher (Trips, Boards, Maps)</option>
                <option value="Safety Officer">Safety Officer (Driver Scores, Certifications)</option>
                <option value="Financial Analyst">Financial Analyst (Expenses, Fuel Log costs, Reports)</option>
              </select>
            </div>
          </div>

          {/* Backup and Restore */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Database size={14} className="text-indigo-500" /> Database Administration</h3>
            <p className="text-[11px] text-slate-400">Export active database logs as local JSON backups, or reset cache logs back to original seed data.</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBackupDatabase}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <Download size={14} />
                Backup Data Cache
              </button>
              <button
                onClick={handleDatabaseReset}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer"
              >
                <RefreshCw size={14} />
                Reset database
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Trail Console */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 flex flex-col h-[75vh]">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Terminal size={14} className="text-indigo-500" /> System Audit Trail Shell</h3>
            <p className="text-[11px] text-slate-400">Chronological transaction record of all operations completed in current sessions.</p>
          </div>
          
          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-2 select-text divide-y divide-slate-800/40">
            {auditLogs.map((log) => (
              <div key={log.id} className="pt-2 flex justify-between gap-4">
                <div>
                  <span className="text-indigo-400 font-semibold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="ml-2 font-bold text-white uppercase">{log.action}:</span>
                  <span className="ml-2 text-slate-300 leading-relaxed">{log.entity}</span>
                </div>
                <span className="text-slate-500 shrink-0 font-bold">{log.userEmail.split('@')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
