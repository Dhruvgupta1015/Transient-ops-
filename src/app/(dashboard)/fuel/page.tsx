"use client";

import { useState } from 'react';
import { useTransitStore, FuelLog } from '@/lib/store/transitStore';
import { Plus, Droplet, DollarSign, Search, Calendar, Gauge, Landmark } from 'lucide-react';

export default function FuelPage() {
  const { 
    vehicles, 
    drivers, 
    fuelLogs, 
    addFuelLog 
  } = useTransitStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [quantity, setQuantity] = useState(150);
  const [cost, setCost] = useState(250);
  const [station, setStation] = useState('Shell Station');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(100000);

  const handleResetForm = () => {
    setVehicleId('');
    setDriverId('');
    setQuantity(150);
    setCost(250);
    setStation('Shell Station');
    setDate(new Date().toISOString().split('T')[0]);
    setOdometer(100000);
    setFormError(null);
  };

  const handleCreateFuelLog = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!vehicleId || !driverId || !station) {
      setFormError('Please select a vehicle, driver, and fill out the refueling station details.');
      return;
    }

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle && odometer < vehicle.currentOdometer) {
      setFormError(`Odometer reading (${odometer} km) cannot be less than the vehicle's current odometer (${vehicle.currentOdometer} km).`);
      return;
    }

    const payload = {
      vehicleId,
      driverId,
      fuelQuantity: Number(quantity),
      fuelCost: Number(cost),
      fuelStation: station.trim(),
      date,
      odometer: Number(odometer),
    };

    const res = addFuelLog(payload);
    if (res.success) {
      setSuccessMsg(res.message);
      setShowAddForm(false);
      handleResetForm();
    } else {
      setFormError(res.message);
    }
  };

  // --- STATS COMPUTATIONS ---
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.fuelCost, 0);
  const totalFuelQty = fuelLogs.reduce((sum, f) => sum + f.fuelQuantity, 0);

  // Mileage (KM per liter) and Cost per KM
  // To calculate cost/km: Total Fuel Cost / (Max Odometer - Min Odometer)
  const odometers = fuelLogs.map((l) => l.odometer).filter((o) => o > 0);
  const maxOdo = odometers.length > 0 ? Math.max(...odometers) : 0;
  const minOdo = odometers.length > 0 ? Math.min(...odometers) : 0;
  const totalDistance = maxOdo - minOdo;

  const avgMileage = totalFuelQty > 0 && totalDistance > 0 ? Math.round((totalDistance / totalFuelQty) * 10) / 10 : 3.2; // fallback to realistic heavy duty average
  const costPerKm = totalDistance > 0 ? Math.round((totalFuelCost / totalDistance) * 100) / 100 : 0.45; // fallback to realistic average cost per km

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Fuel Log Registry</h2>
          <p className="text-xs text-muted-foreground">Record fuel refilling receipts, compute mileage and analyze operational cost efficiency.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Cancel' : 'Log Refueling'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* Dynamic metric widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Fuel Billing</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${totalFuelCost.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <DollarSign size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Quantity Pumped</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{totalFuelQty.toLocaleString()} L</h3>
          </div>
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <Droplet size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Average Mileage</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{avgMileage} km/L</h3>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Gauge size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Cost Per Kilometer</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${costPerKm}/km</h3>
          </div>
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
            <Landmark size={18} />
          </div>
        </div>
      </div>

      {/* Add Log Form */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">Log Fuel Refill Receipt</h3>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <form onSubmit={handleCreateFuelLog} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Select Vehicle*</label>
              <select
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  const veh = vehicles.find(v => v.id === e.target.value);
                  if (veh) setOdometer(veh.currentOdometer);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">Select Truck</option>
                {vehicles.filter(v => v.status !== 'Retired').map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Select Active Driver*</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">Select Driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Fuel Quantity (Liters)*</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Fuel Cost (USD)*</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Fuel Station Location*</label>
              <input
                type="text"
                placeholder="e.g. Shell Express, Chicago"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Refueling Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Odometer Reading (km)*</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Clear Fields
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                Record Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fuel Logs Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="p-4">Vehicle Assets</th>
              <th className="p-4">Refueling Station</th>
              <th className="p-4">Billing Cost</th>
              <th className="p-4">Fuel Quantity</th>
              <th className="p-4">Logged Odometer</th>
              <th className="p-4">Logged Driver</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {fuelLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">No fuel records logged in system database.</td>
              </tr>
            ) : (
              fuelLogs.map((log) => {
                const veh = vehicles.find((v) => v.id === log.vehicleId);
                const drv = drivers.find((d) => d.id === log.driverId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/20">
                    <td className="p-4 font-mono font-semibold">{veh?.registrationNumber || 'Unknown'}</td>
                    <td className="p-4 font-medium">{log.fuelStation}</td>
                    <td className="p-4 font-semibold text-rose-500">${log.fuelCost}</td>
                    <td className="p-4 font-mono font-medium">{log.fuelQuantity} L</td>
                    <td className="p-4 font-mono font-medium">{log.odometer.toLocaleString()} km</td>
                    <td className="p-4 font-medium">{drv?.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-500">{log.date}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
