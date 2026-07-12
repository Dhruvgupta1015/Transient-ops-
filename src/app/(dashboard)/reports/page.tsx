"use client";

import { useState } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { FileSpreadsheet, Download, Filter, FileText, Calendar, Truck, User } from 'lucide-react';

export default function ReportsPage() {
  const { vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses } = useTransitStore();
  const [reportType, setReportType] = useState<'vehicle' | 'driver' | 'fuel' | 'maintenance' | 'trip' | 'expense' | 'profit'>('trip');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  // Trigger real CSV download
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    const dateFiltered = (dateStr: string) => {
      if (!dateStr) return true;
      return dateStr >= startDate && dateStr <= endDate;
    };

    if (reportType === 'trip') {
      headers = ['Trip ID', 'Source', 'Destination', 'Vehicle ID', 'Driver ID', 'Cargo Weight (kg)', 'Distance (km)', 'Estimated Duration (hrs)', 'Status', 'Billing Revenue ($)'];
      rows = trips
        .filter(t => dateFiltered(t.startTime || ''))
        .map(t => [
          t.id,
          `"${t.source}"`,
          `"${t.destination}"`,
          t.vehicleId || 'N/A',
          t.driverId || 'N/A',
          t.cargoWeight.toString(),
          t.plannedDistance.toString(),
          t.estimatedDuration.toString(),
          t.status,
          (t.revenue || 0).toString()
        ]);
    } else if (reportType === 'vehicle') {
      headers = ['Vehicle ID', 'Registration Number', 'Name', 'Model', 'Type', 'Max Load (kg)', 'Odometer (km)', 'Acquisition Cost ($)', 'Insurance Expiry', 'Status'];
      rows = vehicles.map(v => [
        v.id,
        v.registrationNumber,
        `"${v.name}"`,
        `"${v.model}"`,
        v.type,
        v.maxLoad.toString(),
        v.currentOdometer.toString(),
        v.acquisitionCost.toString(),
        v.insuranceExpiry,
        v.status
      ]);
    } else if (reportType === 'driver') {
      headers = ['Driver ID', 'Name', 'License Number', 'Category', 'License Expiry', 'Contact Number', 'Email', 'Safety Score', 'Status'];
      rows = drivers.map(d => [
        d.id,
        `"${d.name}"`,
        d.licenseNumber,
        d.licenseCategory,
        d.licenseExpiryDate,
        `"${d.contactNumber}"`,
        d.email,
        d.safetyScore.toString(),
        d.status
      ]);
    } else if (reportType === 'fuel') {
      headers = ['Fuel Log ID', 'Vehicle ID', 'Driver ID', 'Quantity (L)', 'Cost ($)', 'Station', 'Odometer (km)', 'Date'];
      rows = fuelLogs
        .filter(f => dateFiltered(f.date))
        .map(f => [
          f.id,
          f.vehicleId,
          f.driverId || 'N/A',
          f.fuelQuantity.toString(),
          f.fuelCost.toString(),
          `"${f.fuelStation}"`,
          f.odometer.toString(),
          f.date
        ]);
    } else if (reportType === 'maintenance') {
      headers = ['Log ID', 'Vehicle ID', 'Service Type', 'Description', 'Mechanic', 'Workshop', 'Estimated Cost ($)', 'Actual Cost ($)', 'Start Date', 'End Date', 'Status'];
      rows = maintenanceLogs
        .filter(m => dateFiltered(m.startDate))
        .map(m => [
          m.id,
          m.vehicleId,
          m.serviceType,
          `"${m.description}"`,
          `"${m.mechanic}"`,
          `"${m.workshop}"`,
          m.estimatedCost.toString(),
          (m.actualCost ?? 0).toString(),
          m.startDate,
          m.endDate || 'N/A',
          m.status
        ]);
    } else if (reportType === 'expense') {
      headers = ['Expense ID', 'Category', 'Description', 'Amount ($)', 'Date', 'Vehicle ID', 'Department'];
      rows = expenses
        .filter(e => dateFiltered(e.date))
        .map(e => [
          e.id,
          e.category,
          `"${e.description}"`,
          e.amount.toString(),
          e.date,
          e.vehicleId || 'N/A',
          e.department
        ]);
    } else if (reportType === 'profit') {
      headers = ['Month/Date', 'Total Revenue ($)', 'Total Expenses ($)', 'Net Operating Profit ($)'];
      // Simply export summary stats
      const rev = trips
        .filter((t) => t.status === 'Completed' || t.status === 'Dispatched')
        .reduce((sum, t) => sum + (t.revenue || 0), 0);
      const exp = expenses.reduce((sum, e) => sum + e.amount, 0);
      rows = [[
        `${startDate} to ${endDate}`,
        rev.toString(),
        exp.toString(),
        (rev - exp).toString()
      ]];
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Reports Query</h2>
          <p className="text-xs text-muted-foreground">Select report schemas, query ranges, and export spreadsheet databases.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Download size={14} />
            Export CSV / Excel
          </button>
          <button
            onClick={() => alert('PDF generation is simulated. Downloading formatted spreadsheet standard.')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer"
          >
            <FileText size={14} />
            Export PDF Layout
          </button>
        </div>
      </div>

      {/* Query selectors */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
        <h3 className="font-bold flex items-center gap-1"><Filter size={14} /> Report Builder Configurations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl">
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1">Report Category</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="trip">Trips Operations Statement</option>
              <option value="vehicle">Vehicles Asset Statement</option>
              <option value="driver">Drivers Credential Statement</option>
              <option value="fuel">Fuel Consumptions & Costs</option>
              <option value="maintenance">Maintenance Work Orders</option>
              <option value="expense">Operating Expense Audits</option>
              <option value="profit">Net Profit margins statement</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1"><Calendar size={12} /> Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1"><Calendar size={12} /> End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            />
          </div>
        </div>
      </div>

      {/* Query preview table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{reportType} Report Query Preview</span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold text-[9px]">Excel Schema Mapping Active</span>
        </div>

        <div className="overflow-x-auto max-h-[50vh]">
          {reportType === 'trip' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Trip ID</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Distance / Weight</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {trips.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-slate-400">No records.</td></tr>
                ) : (
                  trips.map(t => {
                    const veh = vehicles.find(v => v.id === t.vehicleId);
                    const drv = drivers.find(d => d.id === t.driverId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/20">
                        <td className="p-3 font-mono font-bold">{t.id.split('-')[1]}</td>
                        <td className="p-3">
                          <div>{t.source}</div>
                          <span className="text-[10px] text-slate-400">To: {t.destination}</span>
                        </td>
                        <td className="p-3">
                          <div>{t.plannedDistance} km</div>
                          <span className="text-[10px] text-slate-400">Cargo: {t.cargoWeight} kg</span>
                        </td>
                        <td className="p-3 font-mono">{veh ? veh.registrationNumber : 'N/A'}</td>
                        <td className="p-3">{drv ? drv.name : 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            t.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-500">${t.revenue?.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === 'vehicle' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Registration</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Current Odometer</th>
                  <th className="p-3">Insurance Expiry</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-mono font-semibold">{v.registrationNumber}</td>
                    <td className="p-3 font-medium">{v.name}</td>
                    <td className="p-3">{v.type}</td>
                    <td className="p-3 font-mono">{v.currentOdometer.toLocaleString()} km</td>
                    <td className="p-3 text-slate-500">{v.insuranceExpiry}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' :
                        v.status === 'On Trip' ? 'bg-blue-500/10 text-blue-500' :
                        v.status === 'In Shop' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'driver' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Operator Name</th>
                  <th className="p-3">License CDL</th>
                  <th className="p-3">License Expiry</th>
                  <th className="p-3">Safety Score</th>
                  <th className="p-3">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-medium">{d.name}</td>
                    <td className="p-3 font-semibold">{d.licenseNumber} ({d.licenseCategory})</td>
                    <td className="p-3 text-slate-500">{d.licenseExpiryDate}</td>
                    <td className="p-3 font-bold text-emerald-500">{d.safetyScore}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        d.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' :
                        d.status === 'On Trip' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'fuel' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Billed Cost</th>
                  <th className="p-3">Odometer</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {fuelLogs.map(f => {
                  const veh = vehicles.find(v => v.id === f.vehicleId);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/20">
                      <td className="p-3 font-mono font-semibold">{veh?.registrationNumber || 'Unknown'}</td>
                      <td className="p-3 font-medium">{f.fuelStation}</td>
                      <td className="p-3 font-mono">{f.fuelQuantity} L</td>
                      <td className="p-3 font-bold text-rose-500">${f.fuelCost}</td>
                      <td className="p-3 font-mono">{f.odometer.toLocaleString()} km</td>
                      <td className="p-3 text-slate-500">{f.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'maintenance' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Service Type</th>
                  <th className="p-3">Workshop</th>
                  <th className="p-3">Billed Cost</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {maintenanceLogs.map(m => {
                  const veh = vehicles.find(v => v.id === m.vehicleId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/20">
                      <td className="p-3 font-mono font-semibold">{veh?.registrationNumber || 'Unknown'}</td>
                      <td className="p-3 font-medium">{m.serviceType}</td>
                      <td className="p-3">{m.workshop}</td>
                      <td className="p-3 font-bold">${(m.actualCost ?? m.estimatedCost).toLocaleString()}</td>
                      <td className="p-3 text-slate-500">{m.startDate}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'expense' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-semibold text-indigo-500">{e.category}</td>
                    <td className="p-3 font-medium">{e.description}</td>
                    <td className="p-3">{e.department}</td>
                    <td className="p-3 text-slate-500">{e.date}</td>
                    <td className="p-3 text-right font-bold text-rose-500">${e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'profit' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3">Query Range</th>
                  <th className="p-3 text-right">Total Revenue</th>
                  <th className="p-3 text-right">Total Expenses</th>
                  <th className="p-3 text-right">Net Margin Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                <tr className="hover:bg-slate-50/20 font-bold">
                  <td className="p-3 text-slate-500">{startDate} to {endDate}</td>
                  <td className="p-3 text-right text-emerald-500">${trips.filter(t => t.status === 'Completed' || t.status === 'Dispatched').reduce((sum, t) => sum + (t.revenue || 0), 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-rose-500">${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-indigo-500">${(trips.filter(t => t.status === 'Completed' || t.status === 'Dispatched').reduce((sum, t) => sum + (t.revenue || 0), 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
