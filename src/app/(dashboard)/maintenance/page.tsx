"use client";

import { useState } from 'react';
import { useTransitStore, MaintenanceLog, MaintenanceStatus } from '@/lib/store/transitStore';
import { Plus, Wrench, Calendar, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
  const { 
    vehicles, 
    maintenanceLogs, 
    addMaintenanceLog, 
    updateMaintenanceLog 
  } = useTransitStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Engine Service');
  const [description, setDescription] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [estCost, setEstCost] = useState(500);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<MaintenanceStatus>('Scheduled');

  // Actual cost closure fields
  const [closingLogId, setClosingLogId] = useState<string | null>(null);
  const [actualCost, setActualCost] = useState(500);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleResetForm = () => {
    setVehicleId('');
    setServiceType('Engine Service');
    setDescription('');
    setMechanic('');
    setWorkshop('');
    setEstCost(500);
    setStartDate(new Date().toISOString().split('T')[0]);
    setStatus('Scheduled');
    setFormError(null);
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!vehicleId || !mechanic || !workshop) {
      setFormError('Please select a vehicle and fill out the mechanic and workshop details.');
      return;
    }

    const payload = {
      vehicleId,
      serviceType,
      description: description.trim(),
      mechanic: mechanic.trim(),
      workshop: workshop.trim(),
      estimatedCost: Number(estCost),
      actualCost: null,
      startDate,
      endDate: null,
      status,
    };

    const res = addMaintenanceLog(payload);
    if (res.success) {
      setSuccessMsg(res.message);
      setShowAddForm(false);
      handleResetForm();
    } else {
      setFormError(res.message);
    }
  };

  const handleCloseWorkOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingLogId) return;

    const res = updateMaintenanceLog(closingLogId, {
      status: 'Completed',
      actualCost: Number(actualCost),
      endDate,
    });

    if (res.success) {
      setSuccessMsg('Work order completed successfully. Vehicle returned to Available fleet.');
      setClosingLogId(null);
    } else {
      alert(res.message);
    }
  };

  const activeInShop = vehicles.filter(v => v.status === 'In Shop').length;
  const activeOrders = maintenanceLogs.filter(m => m.status !== 'Completed').length;
  
  const totalMaintExpense = maintenanceLogs.reduce((sum, log) => {
    return sum + (log.actualCost !== null ? log.actualCost : log.estimatedCost);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Fleet Maintenance Scheduler</h2>
          <p className="text-xs text-muted-foreground">Log preventive maintenance, brake repairs, engine service and inspection work orders.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Cancel' : 'Schedule Service'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Vehicles In Shop</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{activeInShop} Assets</h3>
          </div>
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
            <Wrench size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Active Work Orders</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{activeOrders} Orders</h3>
          </div>
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <Clock size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Total Repairs Cost</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${totalMaintExpense.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* Add maintenance log */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">Initiate Maintenance Ticket</h3>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <form onSubmit={handleCreateLog} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Select Vehicle*</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">Choose Vehicle</option>
                {vehicles.filter(v => v.status !== 'Retired').map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Service Type*</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Engine PM Service">Engine PM Service (Oil, Filters)</option>
                <option value="Brake Overhaul">Brake Overhaul (Pads, Rotors)</option>
                <option value="Suspension Alignment">Suspension Alignment</option>
                <option value="Tire Inspection & Rotation">Tire Inspection & Rotation</option>
                <option value="Electrical Repair">Electrical Repair</option>
                <option value="Body Shop / Paint">Body Shop / Paint</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Service Description</label>
              <input
                type="text"
                placeholder="Details of complaint or inspection requirements"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Assigned Mechanic / Tech*</label>
              <input
                type="text"
                placeholder="e.g. Robert Shaw"
                value={mechanic}
                onChange={(e) => setMechanic(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Workshop Center*</label>
              <input
                type="text"
                placeholder="e.g. Apex Fleet Services"
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Estimated Cost (USD)*</label>
              <input
                type="number"
                value={estCost}
                onChange={(e) => setEstCost(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Service Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Work Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Scheduled">Scheduled (Not started)</option>
                <option value="In Progress">In Progress (Active In Shop)</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                Schedule Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close work order modal simulator */}
      {closingLogId && (
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl shadow-lg space-y-3 text-xs">
          <h3 className="font-bold flex items-center gap-1"><Wrench size={14} /> Close Work Order Ticket</h3>
          <p className="text-[11px] text-slate-400">Please audit the final invoice details to restore vehicle back to operational availability status.</p>
          <form onSubmit={handleCloseWorkOrderSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1 flex-1">
              <label className="text-slate-400 font-medium">Final Billed Cost (USD)*</label>
              <input
                type="number"
                required
                value={actualCost}
                onChange={(e) => setActualCost(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-white focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Completion Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-white focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setClosingLogId(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer shadow-md"
              >
                Certify & Release Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance List Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs select-none">
        {/* Scheduled Board */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h4 className="font-bold flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> Scheduled Orders</h4>
          <div className="space-y-3">
            {maintenanceLogs.filter(m => m.status === 'Scheduled').length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-white dark:bg-slate-950 border border-slate-200/50 rounded-xl">No scheduled service tickets.</div>
            ) : (
              maintenanceLogs.filter(m => m.status === 'Scheduled').map((log) => {
                const veh = vehicles.find(v => v.id === log.vehicleId);
                return (
                  <div key={log.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{veh?.registrationNumber || 'Unknown'}</span>
                      <button
                        onClick={() => updateMaintenanceLog(log.id, { status: 'In Progress' })}
                        className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md font-semibold text-[9px] hover:bg-indigo-500/20"
                      >
                        Start Repair
                      </button>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-950 dark:text-white leading-none mb-1">{log.serviceType}</h5>
                      <p className="text-[10px] text-slate-500 leading-normal">{log.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <span>Est: ${log.estimatedCost}</span>
                      <span>Date: {log.startDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* In Progress Board */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h4 className="font-bold flex items-center gap-1.5"><Clock size={14} className="text-amber-500" /> In Progress (In Shop)</h4>
          <div className="space-y-3">
            {maintenanceLogs.filter(m => m.status === 'In Progress').length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-white dark:bg-slate-950 border border-slate-200/50 rounded-xl">No active repairs.</div>
            ) : (
              maintenanceLogs.filter(m => m.status === 'In Progress').map((log) => {
                const veh = vehicles.find(v => v.id === log.vehicleId);
                return (
                  <div key={log.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-3 border-l-2 border-amber-500">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{veh?.registrationNumber || 'Unknown'}</span>
                      <button
                        onClick={() => {
                          setClosingLogId(log.id);
                          setActualCost(log.estimatedCost);
                        }}
                        className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md font-semibold text-[9px] hover:bg-emerald-500/20 flex items-center gap-0.5"
                      >
                        <CheckCircle size={10} /> Close ticket
                      </button>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-950 dark:text-white leading-none mb-1">{log.serviceType}</h5>
                      <p className="text-[10px] text-slate-500 leading-normal">{log.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <span>Est: ${log.estimatedCost}</span>
                      <span>Shop: {log.workshop}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Board */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h4 className="font-bold flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Completed Service Bills</h4>
          <div className="space-y-3">
            {maintenanceLogs.filter(m => m.status === 'Completed').length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-white dark:bg-slate-950 border border-slate-200/50 rounded-xl">No completed tickets.</div>
            ) : (
              maintenanceLogs.filter(m => m.status === 'Completed').slice(0, 5).map((log) => {
                const veh = vehicles.find(v => v.id === log.vehicleId);
                const costDiff = (log.actualCost ?? 0) - log.estimatedCost;

                return (
                  <div key={log.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{veh?.registrationNumber || 'Unknown'}</span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold uppercase">Closed</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-950 dark:text-white leading-none mb-1">{log.serviceType}</h5>
                      <p className="text-[9px] text-slate-400">End: {log.endDate}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <span className="font-bold">Paid: ${log.actualCost?.toLocaleString()}</span>
                      {costDiff !== 0 && (
                        <span className={`font-semibold ${costDiff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {costDiff > 0 ? `+$${costDiff} over` : `-$${Math.abs(costDiff)} saved`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
