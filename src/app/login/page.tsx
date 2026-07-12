"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { Lock, Mail, ShieldAlert, KeyRound, Truck, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean(),
  role: z.custom<UserRole>(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const PRESET_ACCOUNTS = [
  { role: 'Administrator' as UserRole, email: 'admin@transitops.com', label: 'Admin (Full Access)' },
  { role: 'Fleet Manager' as UserRole, email: 'manager@transitops.com', label: 'Fleet Manager' },
  { role: 'Dispatcher' as UserRole, email: 'dispatcher@transitops.com', label: 'Dispatcher' },
  { role: 'Safety Officer' as UserRole, email: 'safety@transitops.com', label: 'Safety Officer' },
  { role: 'Financial Analyst' as UserRole, email: 'finance@transitops.com', label: 'Financial Analyst' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, setRememberMe } = useTransitStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: 'password123',
      rememberMe: false,
      role: 'Fleet Manager',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const success = login(data.email, data.role);
      if (success) {
        setRememberMe(data.rememberMe);
        router.push('/dashboard');
      } else {
        setError('Invalid credentials or role mismatch.');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillPreset = (email: string, role: UserRole) => {
    setValue('email', email);
    setValue('role', role);
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Brand & Marketing side */}
      <div className="relative md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 flex-col justify-between overflow-hidden border-r border-slate-800/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TransitOps</span>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight text-white">
            Smart Transport <br />
            <span className="text-indigo-400">Operations Platform</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Streamline fleet operations, tracking, dispatch scheduling, automated compliance auditing, maintenance dispatch, and financial forecasting with our premium analytics suite.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold">JD</div>
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold">MC</div>
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold">LF</div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Trusted by 12,000+ dispatchers and logistics operators globally.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 TransitOps Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Login Form side */}
      <div className="flex flex-col justify-center items-center md:w-1/2 p-6 md:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Sign In</h2>
            <p className="text-slate-400 text-sm">Enter your enterprise credentials to access your console</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enterprise Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Access Clearance Role</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <select
                    {...register('role')}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm appearance-none"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                />
                Remember this terminal session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? 'Authenticating secure session...' : 'Initiate Operations Console'}
            </button>
          </form>

          {/* Presets panel for testing */}
          <div className="pt-6 border-t border-slate-800/60 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Demo Credentials (Role-based testing)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_ACCOUNTS.map((preset) => (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => handleFillPreset(preset.email, preset.role)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/40 text-left transition-all text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{preset.label}</span>
                    <span className="block text-[10px] text-slate-500">{preset.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-slate-400 group-hover:bg-indigo-500/20">
                    Auto-Fill
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
