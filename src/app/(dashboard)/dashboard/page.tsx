"use client";

import { useTransitStore } from '@/lib/store/transitStore';
import { 
  Truck, 
  MapPin, 
  Wrench, 
  ShieldAlert, 
  Compass, 
  TrendingUp, 
  DollarSign, 
  Droplet,
  CheckCircle,
  FileText,
  UserCheck,
  Percent,
  Clock,
  Coins
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import Recharts to bypass Next.js SSR hydration mismatches
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend), { ssr: false });

export default function DashboardPage() {
  const { vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses, auditLogs } = useTransitStore();

  // --- 14 KPI CALCULATIONS ---
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'On Trip').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'In Shop').length;
  const retiredVehicles = vehicles.filter((v) => v.status === 'Retired').length;

  const totalTrips = trips.length;
  const activeTrips = trips.filter((t) => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter((t) => t.status === 'Draft').length;
  const completedTrips = trips.filter((t) => t.status === 'Completed').length;

  const driversOnDuty = drivers.filter((d) => d.status === 'Available' || d.status === 'On Trip').length;

  // Fleet Utilization = (Active Vehicles / Total Non-Retired Vehicles) * 100
  const activeFleetSize = totalVehicles - retiredVehicles;
  const fleetUtilization = activeFleetSize > 0 ? Math.round((activeVehicles / activeFleetSize) * 100) : 0;

  // Fuel Cost
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.fuelCost, 0);

  // Maintenance Cost
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => {
    return sum + (log.actualCost !== null ? log.actualCost : log.estimatedCost);
  }, 0);

  // Revenue = Sum of trip revenues
  const totalRevenue = trips
    .filter((t) => t.status === 'Completed' || t.status === 'Dispatched')
    .reduce((sum, t) => sum + (t.revenue || 0), 0);

  // Total Expenses (Including fuel, maintenance, tolls, insurance, repairs, etc.)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Profit = Revenue - Expenses
  const profit = totalRevenue - totalExpenses;

  // Vehicle ROI = (Total Revenue / Total Acquisition Cost + Expenses) * 100
  const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + v.acquisitionCost, 0);
  const vehicleROI = totalAcquisitionCost > 0 
    ? Math.round((totalRevenue / (totalAcquisitionCost + totalExpenses)) * 100 * 10) / 10 
    : 0;

  // --- CHART DATA GENERATION ---

  // Expense categories pie data
  const expenseCategories = ['Fuel', 'Maintenance', 'Insurance', 'Toll', 'Parking', 'Repairs', 'Taxes', 'Other'];
  const expensePieData = expenseCategories.map((cat) => {
    const amt = expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat, value: amt };
  }).filter((d) => d.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];

  // Fuel efficiency / consumption per vehicle type
  const vehicleTypes = Array.from(new Set(vehicles.map((v) => v.type)));
  const fuelConsumptionData = vehicleTypes.map((type) => {
    const vehIds = vehicles.filter((v) => v.type === type).map((v) => v.id);
    const logs = fuelLogs.filter((l) => vehIds.includes(l.vehicleId));
    const qty = logs.reduce((sum, l) => sum + l.fuelQuantity, 0);
    const cost = logs.reduce((sum, l) => sum + l.fuelCost, 0);
    return { name: type, Quantity: qty, Cost: cost };
  });

  // Fleet utilization monthly trend simulation
  const utilizationTrendData = [
    { month: 'Jan', utilization: 65 },
    { month: 'Feb', utilization: 72 },
    { month: 'Mar', utilization: 68 },
    { month: 'Apr', utilization: 75 },
    { month: 'May', utilization: 82 },
    { month: 'Jun', utilization: fleetUtilization || 78 },
  ];

  // Revenue vs Operational Expenses weekly simulation
  const financialTrendData = [
    { week: 'W1', Revenue: totalRevenue * 0.15, Expenses: totalExpenses * 0.18 },
    { week: 'W2', Revenue: totalRevenue * 0.22, Expenses: totalExpenses * 0.20 },
    { week: 'W3', Revenue: totalRevenue * 0.28, Expenses: totalExpenses * 0.25 },
    { week: 'W4', Revenue: totalRevenue * 0.35, Expenses: totalExpenses * 0.37 },
  ];

  const kpis = [
    { title: 'Active Vehicles', value: activeVehicles, sub: `out of ${activeFleetSize} active`, icon: Truck, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Available Vehicles', value: availableVehicles, sub: 'ready for dispatch', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'In Maintenance', value: maintenanceVehicles, sub: 'currently in shop', icon: Wrench, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Retired Fleet', value: retiredVehicles, sub: 'decommissioned', icon: ShieldAlert, color: 'text-slate-500 bg-slate-500/10' },
    { title: 'Active Trips', value: activeTrips, sub: 'en-route tracking', icon: MapPin, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Pending Trips', value: pendingTrips, sub: 'awaiting dispatch', icon: Clock, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Completed Trips', value: completedTrips, sub: 'archived workflows', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Drivers On Duty', value: driversOnDuty, sub: 'assigned / available', icon: UserCheck, color: 'text-cyan-500 bg-cyan-500/10' },
    { title: 'Fleet Utilization', value: `${fleetUtilization}%`, sub: 'active vs capacity', icon: Percent, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Fuel Cost', value: `$${totalFuelCost.toLocaleString()}`, sub: 'logged fuel bills', icon: Droplet, color: 'text-rose-500 bg-rose-500/10' },
    { title: 'Maintenance Cost', value: `$${totalMaintenanceCost.toLocaleString()}`, sub: 'repair bills', icon: Wrench, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'freight billing', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Operating Profit', value: `$${profit.toLocaleString()}`, sub: 'net margin', icon: Coins, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Vehicle ROI', value: `${vehicleROI}%`, sub: 'asset payback rate', icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Command Center Dashboard</h2>
          <p className="text-xs text-muted-foreground">Real-time status updates and operational analytics.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
          Live Tracking Enabled
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                {kpi.title}
              </span>
              <div className={`p-1.5 rounded-lg ${kpi.color}`}>
                <kpi.icon size={12} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
                {kpi.value}
              </h3>
              <p className="text-[9px] text-muted-foreground font-medium mt-1 truncate">
                {kpi.sub}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Area Trend */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold">Fleet Utilization Trend</h4>
            <p className="text-[10px] text-muted-foreground">Historical active vs capacity ratio</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationTrendData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip />
                <Area type="monotone" dataKey="utilization" stroke="#6366f1" fillOpacity={0.15} fill="url(#colorUv)" strokeWidth={2} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold">Operating Expense Breakdown</h4>
            <p className="text-[10px] text-muted-foreground">Grouped by active expense categories</p>
          </div>
          <div className="h-64 w-full flex items-center justify-between text-xs">
            {expensePieData.length === 0 ? (
              <div className="text-center w-full text-slate-400">No expenses recorded to analyze.</div>
            ) : (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-1.5 pl-6 max-h-56 overflow-y-auto">
                  {expensePieData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-medium text-slate-600 dark:text-slate-400">{entry.name}</span>
                      </div>
                      <span className="font-semibold">${entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fuel Consumption Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold">Fuel Efficiency & Cost by Vehicle Type</h4>
            <p className="text-[10px] text-muted-foreground">Comparative operational output</p>
          </div>
          <div className="h-64 w-full text-xs">
            {fuelConsumptionData.length === 0 ? (
              <div className="text-center w-full py-20 text-slate-400">No fuel records logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelConsumptionData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                  <Legend />
                  <Bar dataKey="Cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Financial Progress Line Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold">Weekly Performance Curve</h4>
            <p className="text-[10px] text-muted-foreground">Revenue billing vs operational cost flow</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialTrendData}>
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="$" />
                <Tooltip formatter={(val) => [`$${val ? Math.round(Number(val)) : 0}`]} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Audit Log & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit trail */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="mb-3.5 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold">System Audit Logs</h4>
              <p className="text-[10px] text-muted-foreground">Real-time system transaction history</p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
              Trace active
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800/40">
            {auditLogs.slice(0, 10).map((log, idx) => (
              <div key={log.id} className={`pt-3 flex justify-between items-start text-xs ${idx === 0 ? 'border-none pt-0' : ''}`}>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {log.entity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    {log.userEmail}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Optimization Simulator Panel */}
        <div className="p-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-500/20 rounded-2xl text-white shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Compass className="h-4 w-4 animate-spin text-indigo-200" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">TransitAI Pilot</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Route Optimization Active</h4>
              <p className="text-[10px] text-slate-300">
                Weather, congestion patterns and road tolls parsed automatically.
              </p>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-indigo-500/10 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Estimated Fuel Saved</span>
                <span className="font-bold text-emerald-400">+14.2%</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Time saved this week</span>
                <span className="font-bold text-emerald-400">8.4 Hours</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-indigo-500/15">
            <p className="text-[9px] text-indigo-300 font-semibold leading-relaxed">
              * Predictor claims: Volvo FH16 (REG-001) scheduled check-in is due in 350km based on engine friction index models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
