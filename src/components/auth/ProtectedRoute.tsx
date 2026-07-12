"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { ShieldAlert, LogIn } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useTransitStore((state) => state.currentUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, mounted, router, pathname]);

  if (!mounted) return null;

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="p-8 max-w-md w-full glass-panel rounded-2xl text-center space-y-6 shadow-2xl">
          <div className="inline-flex p-4 rounded-full bg-slate-900 text-slate-400">
            <LogIn size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Authentication Required</h2>
          <p className="text-slate-400 text-sm">
            Please log in to access the TransitOps Operational Board.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-white transition-all shadow-md"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="p-8 max-w-md w-full glass-panel rounded-2xl space-y-6 shadow-xl border border-red-500/10">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-red-500">Access Denied</h2>
          <p className="text-muted-foreground text-sm">
            Your current role <strong className="text-foreground">{currentUser.role}</strong> does not have authorization to view this section.
          </p>
          <p className="text-xs text-muted-foreground">
            Contact your system administrator if you believe this is an error.
          </p>
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center py-2 px-4 bg-slate-800 text-slate-100 font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
