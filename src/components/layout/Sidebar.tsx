"use client";

import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  CalendarRange, 
  Wrench, 
  Droplet, 
  Receipt, 
  FileSpreadsheet, 
  BarChart3, 
  FolderLock, 
  Settings, 
  LogOut,
  Lock,
  Menu
} from 'lucide-react';
import Link from 'next/link';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  allowedRoles: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
  { name: 'Vehicles', href: '/vehicles', icon: Truck, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'] },
  { name: 'Drivers', href: '/drivers', icon: Users, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'] },
  { name: 'Trips', href: '/trips', icon: Map, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher'] },
  { name: 'Dispatch Board', href: '/dispatch', icon: CalendarRange, allowedRoles: ['Administrator', 'Dispatcher'] },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, allowedRoles: ['Administrator', 'Fleet Manager'] },
  { name: 'Fuel Logs', href: '/fuel', icon: Droplet, allowedRoles: ['Administrator', 'Fleet Manager', 'Financial Analyst'] },
  { name: 'Expenses', href: '/expenses', icon: Receipt, allowedRoles: ['Administrator', 'Financial Analyst'] },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet, allowedRoles: ['Administrator', 'Fleet Manager', 'Financial Analyst'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, allowedRoles: ['Administrator', 'Fleet Manager', 'Financial Analyst', 'Safety Officer'] },
  { name: 'Documents', href: '/documents', icon: FolderLock, allowedRoles: ['Administrator', 'Safety Officer', 'Fleet Manager'] },
  { name: 'Settings', href: '/settings', icon: Settings, allowedRoles: ['Administrator'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useTransitStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentRole = currentUser?.role || 'Fleet Manager';

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-300">
      {/* Platform Branding */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight block leading-none">TransitOps</span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Platform Console</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
        {SIDEBAR_ITEMS.map((item) => {
          const hasAccess = item.allowedRoles.includes(currentRole);
          const isActive = pathname.startsWith(item.href);

          if (!hasAccess) {
            return (
              <div 
                key={item.name}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 bg-slate-900/40 border border-transparent cursor-not-allowed text-xs font-medium select-none group"
                title={`Access denied for ${currentRole}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-slate-700" />
                  <span>{item.name}</span>
                </div>
                <Lock size={12} className="text-slate-700" />
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 border ${
                isActive 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 mb-3">
          <div className="h-9 w-9 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">{currentUser?.fullName || 'User'}</h4>
            <span className="text-[10px] font-medium text-slate-400 block truncate">{currentUser?.role || 'Operator'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>Exit Workspace</span>
        </button>
      </div>
    </aside>
  );
}
