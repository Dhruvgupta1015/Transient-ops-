"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitStore } from '@/lib/store/transitStore';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const currentUser = useTransitStore((state) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Loading TransitOps System...
        </span>
      </div>
    </div>
  );
}
