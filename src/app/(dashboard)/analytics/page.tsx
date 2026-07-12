"use client";

import { useState } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { Award, TrendingUp, Sparkles, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ReportModal } from '@/components/reports/ReportModal';

const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend), { ssr: false });
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });

export default function AnalyticsPage() {
  const { vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses } = useTransitStore();
  const [showReportModal, setShowReportModal] = useState(false);

  // 1. Calculate individual vehicle ROI rank
  const vehicleRoiData = vehicles.map((v) => {
    const vTrips = trips.filter(t => t.vehicleId === v.id);
    const vFuel = fuelLogs.filter(f => f.vehicleId === v.id);
    const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id);
    const vExp = expenses.filter(e => e.vehicleId === v.id);

    const rev = vTrips.filter(t => t.status === 'Completed' || t.status === 'Dispatched').reduce((sum, t) => sum + (t.revenue ?? 0), 0);
    const cost = vFuel.reduce((sum, f) => sum + f.fuelCost, 0) + 
                 vMaint.reduce((sum, m) => sum + (m.actualCost ?? m.estimatedCost), 0) + 
                 vExp.reduce((sum, e) => sum + e.amount, 0);

    const roi = v.acquisitionCost + cost > 0 ? Math.round((rev / (v.acquisitionCost + cost)) * 100) : 0;
    return { name: v.registrationNumber, ROI: roi };
  }).sort((a, b) => b.ROI - a.ROI);

  // 2. Driver safety score analysis
  const driverPerformanceList = drivers.map((d) => {
    const dTrips = trips.filter(t => t.driverId === d.id && t.status === 'Completed').length;
    return {
      name: d.name,
      score: d.safetyScore,
      tripsCount: dTrips,
      level: d.safetyScore >= 90 ? 'Elite' : d.safetyScore >= 75 ? 'Standard' : 'Needs Retraining'
    };
  }).sort((a, b) => b.score - a.score);

  // 3. Operational cost trend (Revenue vs Fuel vs Maintenance)
  const monthlyOpsData = [
    { month: 'Jan', Revenue: 5400, Fuel: 1800, Maintenance: 1200 },
    { month: 'Feb', Revenue: 6200, Fuel: 2100, Maintenance: 850 },
    { month: 'Mar', Revenue: 7100, Fuel: 2200, Maintenance: 1400 },
    { month: 'Apr', Revenue: 8500, Fuel: 2600, Maintenance: 900 },
    { month: 'May', Revenue: 9200, Fuel: 2900, Maintenance: 1100 },
    { month: 'Jun', Revenue: trips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + (t.revenue ?? 0), 0) || 8900, Fuel: fuelLogs.reduce((sum, f) => sum + f.fuelCost, 0) || 2800, Maintenance: maintenanceLogs.reduce((sum, m) => sum + (m.actualCost ?? m.estimatedCost), 0) || 1200 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-[#eaebf0] pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Advanced Platform Analytics</h2>
          <p className="text-xs text-slate-400 font-medium">Evaluate asset returns, operational cost trends, and driver safety index scores.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
          >
            <Download size={13} />
            <span>Download Complete Analysis</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 text-xs font-semibold flex items-center gap-1">
            <Sparkles size={13} />
            Predictive Models Active
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Vehicle ROI rank chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm">Asset ROI Rank Summary</h3>
            <p className="text-[10px] text-slate-400">Total freight billing revenue vs acquisition and operation costs</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleRoiData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, 'ROI']} />
                <Bar dataKey="ROI" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating cost trends */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm font-sans">Corporate Cost Trends</h3>
            <p className="text-[10px] text-slate-400">Comparing freight revenues against core operational costs (Fuel, Maintenance)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyOpsData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="$" />
                <Tooltip formatter={(val) => [`$${val}`]} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Fuel" stroke="#ef4444" strokeWidth={1.5} />
                <Line type="monotone" dataKey="Maintenance" stroke="#f59e0b" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
          <div>
            <h4 className="font-bold">Driver Performance Rating Index</h4>
            <p className="text-[10px] text-slate-400">Identifies operators requiring safety counseling or dispatch rewards.</p>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
              <th className="p-3">Operator Name</th>
              <th className="p-3">Safety Score Index</th>
              <th className="p-3">Completed Trips</th>
              <th className="p-3">Compliance Tier</th>
              <th className="p-3 text-right">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {driverPerformanceList.map((driver) => (
              <tr key={driver.name} className="hover:bg-slate-50/20">
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{driver.name}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1 font-bold">
                    <TrendingUp size={12} className={driver.score >= 90 ? 'text-emerald-500' : 'text-rose-400'} />
                    <span className={driver.score >= 90 ? 'text-emerald-500' : driver.score >= 75 ? '' : 'text-rose-500'}>{driver.score}%</span>
                  </div>
                </td>
                <td className="p-3 font-mono font-medium">{driver.tripsCount} Completed Trips</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                    driver.level === 'Elite' ? 'bg-emerald-500/10 text-emerald-500' :
                    driver.level === 'Standard' ? 'bg-indigo-500/10 text-indigo-500' :
                    'bg-rose-500/10 text-red-500'
                  }`}>
                    {driver.level}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {driver.score < 75 ? (
                    <span className="text-rose-500 font-bold flex items-center gap-1 justify-end">
                      <AlertTriangle size={11} /> Flagged
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-bold flex items-center gap-1 justify-end">
                      <ShieldCheck size={11} /> Compliant
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Report Modal */}
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />
    </div>
  );
}
