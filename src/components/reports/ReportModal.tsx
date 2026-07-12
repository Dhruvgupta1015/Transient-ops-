"use client";

import { useState, useCallback } from 'react';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import {
  FileText, X, Download, FileSpreadsheet, Printer,
  CheckCircle, Loader2, ChevronDown, Filter
} from 'lucide-react';

// --- RBAC Section Permissions ---
const SECTION_PERMISSIONS: Record<string, UserRole[]> = {
  'Executive Summary': ['Administrator', 'Fleet Manager', 'Financial Analyst'],
  'Fleet Summary': ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'],
  'Driver Summary': ['Administrator', 'Fleet Manager', 'Safety Officer'],
  'Trip Analysis': ['Administrator', 'Fleet Manager', 'Dispatcher'],
  'Fuel Analysis': ['Administrator', 'Fleet Manager', 'Financial Analyst'],
  'Maintenance Analysis': ['Administrator', 'Fleet Manager'],
  'Expense Analysis': ['Administrator', 'Financial Analyst'],
  'Financial Analysis': ['Administrator', 'Financial Analyst'],
  'Vehicle Details': ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'],
  'Driver Details': ['Administrator', 'Fleet Manager', 'Safety Officer'],
  'Active Trips': ['Administrator', 'Fleet Manager', 'Dispatcher'],
  'Notifications': ['Administrator', 'Fleet Manager', 'Safety Officer'],
  'AI Summary': ['Administrator'],
};

type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'print';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const {
    vehicles, drivers, trips, maintenanceLogs, fuelLogs,
    expenses, notifications, auditLogs, currentUser
  } = useTransitStore();

  const [selectedSections, setSelectedSections] = useState<string[]>(Object.keys(SECTION_PERMISSIONS));
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const currentRole = currentUser?.role || 'Fleet Manager';

  const accessibleSections = Object.entries(SECTION_PERMISSIONS)
    .filter(([, roles]) => roles.includes(currentRole))
    .map(([section]) => section);

  const toggleSection = (section: string) => {
    setSelectedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const selectAll = () => setSelectedSections([...accessibleSections]);
  const deselectAll = () => setSelectedSections([]);

  // ========================
  // DATA COMPUTATION HELPERS
  // ========================
  const computeReportData = useCallback(() => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const inMaintenance = vehicles.filter(v => v.status === 'In Shop').length;
    const retiredVehicles = vehicles.filter(v => v.status === 'Retired').length;
    const fleetUtil = totalVehicles - retiredVehicles > 0
      ? Math.round((activeVehicles / (totalVehicles - retiredVehicles)) * 100) : 0;
    const avgHealthScore = vehicles.length > 0
      ? Math.round(vehicles.reduce((s, v) => s + (v.healthScore ?? 75), 0) / vehicles.length) : 0;

    const totalDrivers = drivers.length;
    const driversAvailable = drivers.filter(d => d.status === 'Available').length;
    const driversOnTrip = drivers.filter(d => d.status === 'On Trip').length;
    const driversSuspended = drivers.filter(d => d.status === 'Suspended').length;
    const expiredLicenses = drivers.filter(d => new Date(d.licenseExpiryDate) < new Date()).length;
    const avgSafetyScore = drivers.length > 0
      ? Math.round(drivers.reduce((s, d) => s + d.safetyScore, 0) / drivers.length) : 0;

    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;
    const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;
    const avgDistance = trips.length > 0
      ? Math.round(trips.reduce((s, t) => s + t.plannedDistance, 0) / trips.length) : 0;
    const avgDuration = trips.length > 0
      ? Math.round(trips.reduce((s, t) => s + t.estimatedDuration, 0) / trips.length * 10) / 10 : 0;

    const totalFuelCost = fuelLogs.reduce((s, l) => s + l.fuelCost, 0);
    const totalFuelQty = fuelLogs.reduce((s, l) => s + l.fuelQuantity, 0);
    const avgFuelEfficiency = totalFuelQty > 0
      ? Math.round((fuelLogs.reduce((s, l) => s + l.odometer, 0) / totalFuelQty) * 10) / 10 : 0;

    const totalMaintCost = maintenanceLogs.reduce((s, l) => s + (l.actualCost ?? l.estimatedCost), 0);
    const upcomingMaint = maintenanceLogs.filter(m => m.status === 'Scheduled').length;
    const completedMaint = maintenanceLogs.filter(m => m.status === 'Completed').length;

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });

    const totalRevenue = trips
      .filter(t => t.status === 'Completed' || t.status === 'Dispatched')
      .reduce((s, t) => s + (t.revenue ?? 0), 0);
    const profit = totalRevenue - totalExpenses;
    const totalAcqCost = vehicles.reduce((s, v) => s + v.acquisitionCost, 0);
    const roi = totalAcqCost > 0 ? Math.round((totalRevenue / (totalAcqCost + totalExpenses)) * 100 * 10) / 10 : 0;

    return {
      fleet: { totalVehicles, activeVehicles, availableVehicles, inMaintenance, retiredVehicles, fleetUtil, avgHealthScore },
      driver: { totalDrivers, driversAvailable, driversOnTrip, driversSuspended, expiredLicenses, avgSafetyScore },
      trip: { totalTrips, completedTrips, pendingTrips, cancelledTrips, avgDistance, avgDuration },
      fuel: { totalFuelCost, totalFuelQty, avgFuelEfficiency },
      maintenance: { totalMaintCost, upcomingMaint, completedMaint },
      expense: { totalExpenses, expenseByCategory },
      financial: { totalRevenue, totalExpenses, profit, roi },
    };
  }, [vehicles, drivers, trips, fuelLogs, maintenanceLogs, expenses]);

  // ========================
  // CSV GENERATION
  // ========================
  const generateCSV = useCallback(() => {
    const data = computeReportData();
    const lines: string[] = [];

    lines.push('TransitOps - Complete Analysis Report');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Generated By: ${currentUser?.fullName || 'System'} (${currentRole})`);
    lines.push('');

    if (selectedSections.includes('Fleet Summary')) {
      lines.push('=== FLEET SUMMARY ===');
      lines.push(`Total Vehicles,${data.fleet.totalVehicles}`);
      lines.push(`Active Vehicles,${data.fleet.activeVehicles}`);
      lines.push(`Available Vehicles,${data.fleet.availableVehicles}`);
      lines.push(`In Maintenance,${data.fleet.inMaintenance}`);
      lines.push(`Retired Vehicles,${data.fleet.retiredVehicles}`);
      lines.push(`Fleet Utilization,${data.fleet.fleetUtil}%`);
      lines.push(`Avg Health Score,${data.fleet.avgHealthScore}`);
      lines.push('');
    }

    if (selectedSections.includes('Driver Summary')) {
      lines.push('=== DRIVER SUMMARY ===');
      lines.push(`Total Drivers,${data.driver.totalDrivers}`);
      lines.push(`Available,${data.driver.driversAvailable}`);
      lines.push(`On Trip,${data.driver.driversOnTrip}`);
      lines.push(`Suspended,${data.driver.driversSuspended}`);
      lines.push(`Expired Licenses,${data.driver.expiredLicenses}`);
      lines.push(`Avg Safety Score,${data.driver.avgSafetyScore}`);
      lines.push('');
    }

    if (selectedSections.includes('Trip Analysis')) {
      lines.push('=== TRIP ANALYSIS ===');
      lines.push(`Total Trips,${data.trip.totalTrips}`);
      lines.push(`Completed,${data.trip.completedTrips}`);
      lines.push(`Pending,${data.trip.pendingTrips}`);
      lines.push(`Cancelled,${data.trip.cancelledTrips}`);
      lines.push(`Avg Distance (km),${data.trip.avgDistance}`);
      lines.push(`Avg Duration (hrs),${data.trip.avgDuration}`);
      lines.push('');
    }

    if (selectedSections.includes('Fuel Analysis')) {
      lines.push('=== FUEL ANALYSIS ===');
      lines.push(`Total Fuel Cost,$${data.fuel.totalFuelCost.toLocaleString()}`);
      lines.push(`Total Fuel (L),${data.fuel.totalFuelQty}`);
      lines.push(`Avg Fuel Efficiency (km/L),${data.fuel.avgFuelEfficiency}`);
      lines.push('');
    }

    if (selectedSections.includes('Maintenance Analysis')) {
      lines.push('=== MAINTENANCE ANALYSIS ===');
      lines.push(`Total Maintenance Cost,$${data.maintenance.totalMaintCost.toLocaleString()}`);
      lines.push(`Upcoming Services,${data.maintenance.upcomingMaint}`);
      lines.push(`Completed Services,${data.maintenance.completedMaint}`);
      lines.push('');
    }

    if (selectedSections.includes('Expense Analysis')) {
      lines.push('=== EXPENSE ANALYSIS ===');
      lines.push(`Total Operational Cost,$${data.expense.totalExpenses.toLocaleString()}`);
      Object.entries(data.expense.expenseByCategory).forEach(([cat, amt]) => {
        lines.push(`${cat},$${amt.toLocaleString()}`);
      });
      lines.push('');
    }

    if (selectedSections.includes('Financial Analysis')) {
      lines.push('=== FINANCIAL ANALYSIS ===');
      lines.push(`Revenue,$${data.financial.totalRevenue.toLocaleString()}`);
      lines.push(`Expenses,$${data.financial.totalExpenses.toLocaleString()}`);
      lines.push(`Profit,$${data.financial.profit.toLocaleString()}`);
      lines.push(`Fleet ROI,${data.financial.roi}%`);
      lines.push('');
    }

    if (selectedSections.includes('Vehicle Details')) {
      lines.push('=== VEHICLE DETAILS ===');
      lines.push('Registration,Name,Model,Type,Status,Capacity (kg),Odometer (km),Insurance Expiry');
      vehicles.forEach(v => {
        lines.push(`${v.registrationNumber},"${v.name}","${v.model}","${v.type}",${v.status},${v.maxLoad},${v.currentOdometer},${v.insuranceExpiry}`);
      });
      lines.push('');
    }

    if (selectedSections.includes('Driver Details')) {
      lines.push('=== DRIVER DETAILS ===');
      lines.push('Name,License,Category,Safety Score,Status,License Expiry,Contact');
      drivers.forEach(d => {
        lines.push(`"${d.name}",${d.licenseNumber},${d.licenseCategory},${d.safetyScore},${d.status},${d.licenseExpiryDate},${d.contactNumber}`);
      });
      lines.push('');
    }

    if (selectedSections.includes('Active Trips')) {
      lines.push('=== TRIP DETAILS ===');
      lines.push('ID,Source,Destination,Vehicle,Driver,Distance (km),Duration (hrs),Status,Revenue');
      trips.forEach(t => {
        lines.push(`${t.id},"${t.source}","${t.destination}",${t.vehicleId || 'N/A'},${t.driverId || 'N/A'},${t.plannedDistance},${t.estimatedDuration},${t.status},$${t.revenue || 0}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }, [computeReportData, selectedSections, vehicles, drivers, trips, currentUser, currentRole]);

  // ========================
  // PDF (PRINT) GENERATION
  // ========================
  const generatePrintableHTML = useCallback(() => {
    const data = computeReportData();
    const now = new Date();

    let html = `
    <!DOCTYPE html>
    <html lang="en"><head><meta charset="UTF-8">
    <title>TransitOps - Complete Analysis Report</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 40px; font-size: 11px; line-height: 1.5; }
      .cover { text-align: center; padding: 80px 0 40px; border-bottom: 3px solid #86a3c3; margin-bottom: 40px; }
      .cover h1 { font-size: 28px; font-weight: 700; color: #2d3142; margin-bottom: 8px; }
      .cover .subtitle { font-size: 14px; color: #8b92a5; margin-bottom: 24px; }
      .cover .meta { font-size: 11px; color: #8b92a5; }
      .cover .meta span { display: inline-block; margin: 0 12px; }
      h2 { font-size: 16px; font-weight: 700; color: #2d3142; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #eaebf0; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .kpi-card { background: #f4f5f7; border: 1px solid #eaebf0; border-radius: 10px; padding: 14px; }
      .kpi-card .label { font-size: 9px; color: #8b92a5; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      .kpi-card .value { font-size: 20px; font-weight: 700; color: #2d3142; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 10px; }
      th { background: #f4f5f7; text-align: left; padding: 8px 10px; font-weight: 600; color: #8b92a5; text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; border-bottom: 2px solid #eaebf0; }
      td { padding: 7px 10px; border-bottom: 1px solid #eaebf0; color: #4a5568; }
      tr:nth-child(even) td { background: #fafbfc; }
      .status { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 600; }
      .status-available { background: #e8f5e9; color: #2e7d32; }
      .status-ontrip { background: #e3f2fd; color: #1565c0; }
      .status-inshop { background: #fff3e0; color: #e65100; }
      .status-retired { background: #f3e5f5; color: #6a1b9a; }
      .ai-box { background: linear-gradient(135deg, #f0f2f5, #f4eaed); border: 1px solid #eaebf0; border-radius: 12px; padding: 20px; margin: 16px 0; }
      .ai-box h3 { font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #86a3c3; }
      .ai-box p { font-size: 11px; color: #4a5568; line-height: 1.7; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #eaebf0; text-align: center; font-size: 9px; color: #8b92a5; }
      @media print { body { padding: 20px; } .cover { padding: 40px 0 20px; } }
    </style></head><body>`;

    // Cover Page
    html += `<div class="cover">
      <h1>📊 TransitOps</h1>
      <div class="subtitle">Complete System Analysis Report</div>
      <div class="meta">
        <span>📅 ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>👤 ${currentUser?.fullName || 'System'}</span>
        <span>🔑 ${currentRole}</span>
      </div>
    </div>`;

    // Fleet Summary
    if (selectedSections.includes('Fleet Summary')) {
      html += `<h2>🚛 Fleet Summary</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Vehicles</div><div class="value">${data.fleet.totalVehicles}</div></div>
        <div class="kpi-card"><div class="label">Active (On Trip)</div><div class="value">${data.fleet.activeVehicles}</div></div>
        <div class="kpi-card"><div class="label">Available</div><div class="value">${data.fleet.availableVehicles}</div></div>
        <div class="kpi-card"><div class="label">In Maintenance</div><div class="value">${data.fleet.inMaintenance}</div></div>
        <div class="kpi-card"><div class="label">Retired</div><div class="value">${data.fleet.retiredVehicles}</div></div>
        <div class="kpi-card"><div class="label">Fleet Utilization</div><div class="value">${data.fleet.fleetUtil}%</div></div>
        <div class="kpi-card"><div class="label">Avg Health Score</div><div class="value">${data.fleet.avgHealthScore}</div></div>
      </div>`;
    }

    // Driver Summary
    if (selectedSections.includes('Driver Summary')) {
      html += `<h2>👷 Driver Summary</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Drivers</div><div class="value">${data.driver.totalDrivers}</div></div>
        <div class="kpi-card"><div class="label">Available</div><div class="value">${data.driver.driversAvailable}</div></div>
        <div class="kpi-card"><div class="label">On Trip</div><div class="value">${data.driver.driversOnTrip}</div></div>
        <div class="kpi-card"><div class="label">Suspended</div><div class="value">${data.driver.driversSuspended}</div></div>
        <div class="kpi-card"><div class="label">Expired Licenses</div><div class="value">${data.driver.expiredLicenses}</div></div>
        <div class="kpi-card"><div class="label">Avg Safety Score</div><div class="value">${data.driver.avgSafetyScore}</div></div>
      </div>`;
    }

    // Trip Analysis
    if (selectedSections.includes('Trip Analysis')) {
      html += `<h2>🗺️ Trip Analysis</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Trips</div><div class="value">${data.trip.totalTrips}</div></div>
        <div class="kpi-card"><div class="label">Completed</div><div class="value">${data.trip.completedTrips}</div></div>
        <div class="kpi-card"><div class="label">Pending</div><div class="value">${data.trip.pendingTrips}</div></div>
        <div class="kpi-card"><div class="label">Cancelled</div><div class="value">${data.trip.cancelledTrips}</div></div>
        <div class="kpi-card"><div class="label">Avg Distance</div><div class="value">${data.trip.avgDistance} km</div></div>
        <div class="kpi-card"><div class="label">Avg Duration</div><div class="value">${data.trip.avgDuration} hrs</div></div>
      </div>`;
    }

    // Fuel Analysis
    if (selectedSections.includes('Fuel Analysis')) {
      html += `<h2>⛽ Fuel Analysis</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Fuel Cost</div><div class="value">$${data.fuel.totalFuelCost.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="label">Total Fuel (Liters)</div><div class="value">${data.fuel.totalFuelQty.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="label">Avg Efficiency</div><div class="value">${data.fuel.avgFuelEfficiency} km/L</div></div>
      </div>`;
    }

    // Maintenance Analysis
    if (selectedSections.includes('Maintenance Analysis')) {
      html += `<h2>🔧 Maintenance Analysis</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Maint. Cost</div><div class="value">$${data.maintenance.totalMaintCost.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="label">Upcoming Services</div><div class="value">${data.maintenance.upcomingMaint}</div></div>
        <div class="kpi-card"><div class="label">Completed</div><div class="value">${data.maintenance.completedMaint}</div></div>
      </div>`;
    }

    // Expense Analysis
    if (selectedSections.includes('Expense Analysis')) {
      html += `<h2>💰 Expense Analysis</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Operational Cost</div><div class="value">$${data.expense.totalExpenses.toLocaleString()}</div></div>`;
      Object.entries(data.expense.expenseByCategory).forEach(([cat, amt]) => {
        html += `<div class="kpi-card"><div class="label">${cat}</div><div class="value">$${amt.toLocaleString()}</div></div>`;
      });
      html += `</div>`;
    }

    // Financial Analysis
    if (selectedSections.includes('Financial Analysis')) {
      html += `<h2>📈 Financial Analysis</h2><div class="kpi-grid">
        <div class="kpi-card"><div class="label">Total Revenue</div><div class="value">$${data.financial.totalRevenue.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="label">Total Expenses</div><div class="value">$${data.financial.totalExpenses.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="label">Profit</div><div class="value">$${data.financial.profit.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="label">Fleet ROI</div><div class="value">${data.financial.roi}%</div></div>
      </div>`;
    }

    // Vehicle Details Table
    if (selectedSections.includes('Vehicle Details')) {
      html += `<h2>🚛 Vehicle Details</h2><table>
        <thead><tr><th>Registration</th><th>Name</th><th>Model</th><th>Type</th><th>Status</th><th>Capacity</th><th>Odometer</th><th>Insurance Exp.</th></tr></thead><tbody>`;
      vehicles.forEach(v => {
        const statusClass = v.status === 'Available' ? 'status-available' : v.status === 'On Trip' ? 'status-ontrip' : v.status === 'In Shop' ? 'status-inshop' : 'status-retired';
        html += `<tr><td><strong>${v.registrationNumber}</strong></td><td>${v.name}</td><td>${v.model}</td><td>${v.type}</td><td><span class="status ${statusClass}">${v.status}</span></td><td>${v.maxLoad.toLocaleString()} kg</td><td>${v.currentOdometer.toLocaleString()} km</td><td>${v.insuranceExpiry}</td></tr>`;
      });
      html += `</tbody></table>`;
    }

    // Driver Details Table
    if (selectedSections.includes('Driver Details')) {
      html += `<h2>👷 Driver Details</h2><table>
        <thead><tr><th>Name</th><th>License #</th><th>Category</th><th>Safety Score</th><th>Status</th><th>License Expiry</th><th>Contact</th></tr></thead><tbody>`;
      drivers.forEach(d => {
        const statusClass = d.status === 'Available' ? 'status-available' : d.status === 'On Trip' ? 'status-ontrip' : 'status-retired';
        html += `<tr><td><strong>${d.name}</strong></td><td>${d.licenseNumber}</td><td>${d.licenseCategory}</td><td>${d.safetyScore}</td><td><span class="status ${statusClass}">${d.status}</span></td><td>${d.licenseExpiryDate}</td><td>${d.contactNumber}</td></tr>`;
      });
      html += `</tbody></table>`;
    }

    // Active Trips Table
    if (selectedSections.includes('Active Trips')) {
      html += `<h2>🗺️ Trip Details</h2><table>
        <thead><tr><th>Source</th><th>Destination</th><th>Vehicle</th><th>Driver</th><th>Distance</th><th>Duration</th><th>Status</th><th>Revenue</th></tr></thead><tbody>`;
      trips.forEach(t => {
        const veh = vehicles.find(v => v.id === t.vehicleId);
        const drv = drivers.find(d => d.id === t.driverId);
        html += `<tr><td>${t.source}</td><td>${t.destination}</td><td>${veh?.registrationNumber || 'N/A'}</td><td>${drv?.name || 'N/A'}</td><td>${t.plannedDistance} km</td><td>${t.estimatedDuration} hrs</td><td><span class="status">${t.status}</span></td><td>$${(t.revenue || 0).toLocaleString()}</td></tr>`;
      });
      html += `</tbody></table>`;
    }

    // AI Summary
    if (selectedSections.includes('AI Summary')) {
      const issues: string[] = [];
      if (data.driver.expiredLicenses > 0) issues.push(`${data.driver.expiredLicenses} driver(s) have expired licenses — schedule renewal immediately.`);
      if (data.fleet.inMaintenance > 1) issues.push(`${data.fleet.inMaintenance} vehicles currently in maintenance — monitor workshop timelines.`);
      if (data.financial.profit < 0) issues.push(`Operating at a net loss of $${Math.abs(data.financial.profit).toLocaleString()} — review expense allocation.`);

      html += `<h2>🤖 AI Executive Summary</h2><div class="ai-box">
        <h3>Fleet Performance</h3>
        <p>Fleet utilization is at ${data.fleet.fleetUtil}%, with ${data.fleet.availableVehicles} vehicles ready for dispatch. Average vehicle health score is ${data.fleet.avgHealthScore}/100.</p>
        <h3 style="margin-top:12px;">Operational Efficiency</h3>
        <p>Out of ${data.trip.totalTrips} trips, ${data.trip.completedTrips} were completed successfully (${data.trip.totalTrips > 0 ? Math.round(data.trip.completedTrips / data.trip.totalTrips * 100) : 0}% completion rate). Average trip distance: ${data.trip.avgDistance} km.</p>
        <h3 style="margin-top:12px;">Financial Overview</h3>
        <p>Total revenue: $${data.financial.totalRevenue.toLocaleString()}, Total expenses: $${data.financial.totalExpenses.toLocaleString()}, Net ${data.financial.profit >= 0 ? 'profit' : 'loss'}: $${Math.abs(data.financial.profit).toLocaleString()}. Fleet ROI: ${data.financial.roi}%.</p>
        ${issues.length > 0 ? `<h3 style="margin-top:12px;color:#eb8c96;">⚠️ Issues & Recommendations</h3><ul style="padding-left:16px;margin-top:6px;">${issues.map(i => `<li style="margin-bottom:4px;">${i}</li>`).join('')}</ul>` : ''}
      </div>`;
    }

    // Footer
    html += `<div class="footer">
      <p>TransitOps – Smart Transport Operations Platform • Generated on ${now.toLocaleString()} • Page 1</p>
      <p style="margin-top:4px;">This report is confidential and intended for authorized personnel only.</p>
    </div></body></html>`;

    return html;
  }, [computeReportData, selectedSections, vehicles, drivers, trips, currentUser, currentRole]);

  // ========================
  // EXPORT HANDLER
  // ========================
  const handleExport = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (exportFormat === 'csv') {
        const csv = generateCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `TransitOps_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'xlsx') {
        // Generate as TSV (Excel-compatible)
        const csv = generateCSV().replace(/,/g, '\t');
        const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `TransitOps_Report_${new Date().toISOString().split('T')[0]}.xls`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'print' || exportFormat === 'pdf') {
        const htmlContent = generatePrintableHTML();
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => { printWindow.print(); }, 600);
        }
      }

      setProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 1000);
    }
  }, [exportFormat, generateCSV, generatePrintableHTML]);

  if (!isOpen) return null;

  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: 'pdf', label: 'PDF Report', icon: <FileText size={14} /> },
    { value: 'csv', label: 'CSV Data', icon: <FileSpreadsheet size={14} /> },
    { value: 'xlsx', label: 'Excel (.xls)', icon: <FileSpreadsheet size={14} /> },
    { value: 'print', label: 'Print Version', icon: <Printer size={14} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-[#eaebf0] flex flex-col animate-in fade-in zoom-in-95 duration-200">

          {/* Modal Header */}
          <div className="p-5 border-b border-[#eaebf0] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Download Complete Analysis</h3>
                <p className="text-[10px] text-slate-400">Generate an executive report from all system modules</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Export Format Selection */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Export Format</label>
              <div className="grid grid-cols-4 gap-2">
                {formatOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setExportFormat(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      exportFormat === opt.value
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'bg-white border-[#eaebf0] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters Toggle */}
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors cursor-pointer"
              >
                <Filter size={11} />
                <span>Advanced Filters</span>
                <ChevronDown size={11} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              {showFilters && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-[#eaebf0] text-xs text-slate-500 space-y-2">
                  <p className="font-medium text-slate-600">Date Range: <span className="text-slate-400">All Time (default)</span></p>
                  <p className="font-medium text-slate-600">Scope: <span className="text-slate-400">All data based on your role ({currentRole})</span></p>
                </div>
              )}
            </div>

            {/* Section Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Report Sections</label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Select All</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={deselectAll} className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer">Deselect</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {accessibleSections.map(section => {
                  const isSelected = selectedSections.includes(section);
                  return (
                    <button
                      key={section}
                      onClick={() => toggleSection(section)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-[#eaebf0] text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckCircle size={10} className="text-white" />}
                      </div>
                      <span>{section}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Generating report…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-[#eaebf0] flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="text-[10px] text-slate-400">
              {selectedSections.length} of {accessibleSections.length} sections selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#eaebf0] text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isGenerating || selectedSections.length === 0}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {isGenerating ? (
                  <><Loader2 size={13} className="animate-spin" /> Generating…</>
                ) : (
                  <><Download size={13} /> Download Report</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
