"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

interface SidebarContextType {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  setMobileOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function ScopedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const syncWithSupabase = useTransitStore((state) => state.syncWithSupabase);
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  return (
    <ProtectedRoute>
      <SidebarContext.Provider value={{ isMobileOpen, setMobileOpen }}>
        <div className="flex h-screen w-screen overflow-hidden bg-[#fcfbfa] text-slate-800 dark:text-slate-200 transition-colors duration-200">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto bg-[#fcfbfa] p-4 md:p-6 scrollbar-thin">
              {children}
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </ProtectedRoute>
  );
}
