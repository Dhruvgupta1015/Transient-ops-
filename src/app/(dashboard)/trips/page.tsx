"use client";

import { useState } from 'react';
import { useTransitStore, Trip, TripStatus } from '@/lib/store/transitStore';
import { Plus, Search, Filter, Play, Check, X, MapPin, Truck, User, Scale, ArrowRight, Activity } from 'lucide-react';

export default function TripsPage() {
  const { 
    trips, 
    vehicles, 
    drivers, 
    addTrip, 
    updateTrip, 
    dispatchTrip, 
    completeTrip, 
    cancelTrip, 
    deleteTrip,
    logAction
  } = useTransitStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState(10000);
  const [distance, setDistance] = useState(300);
  const [duration, setDuration] = useState(4);

  const handleResetForm = () => {
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight(10000);
    setDistance(300);
    setDuration(4);
    setFormError(null);
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!source || !destination) {
      setFormError('Please enter source and destination coordinates/cities.');
      return;
    }

    const payload = {
      source: source.trim(),
      destination: destination.trim(),
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(distance),
      estimatedDuration: Number(duration),
      status: 'Draft' as TripStatus,
    };

    const res = addTrip(payload);
    if (res.success) {
      setSuccessMsg(res.message);
      setShowAddForm(false);
      handleResetForm();
    } else {
      setFormError(res.message);
    }
  };

  const handleDispatch = (id: string) => {
    setFormError(null);
    setSuccessMsg(null);
    const res = dispatchTrip(id);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleComplete = (id: string) => {
    setFormError(null);
    setSuccessMsg(null);
    const res = completeTrip(id);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this trip? Drivers and vehicles will be restored to available.')) {
      const res = cancelTrip(id);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        alert(res.message);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete draft trip?')) {
      const res = deleteTrip(id);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        alert(res.message);
      }
    }
  };

  // Live simulation: increments progress of dispatched trips by 15%
  const handleSimulateProgress = () => {
    const activeTripsList = trips.filter((t) => t.status === 'Dispatched');
    if (activeTripsList.length === 0) {
      alert('No active Dispatched trips to simulate.');
      return;
    }

    activeTripsList.forEach((trip) => {
      const newProgress = Math.min(Number(trip.progress) + 15, 100);
      if (newProgress >= 100) {
        completeTrip(trip.id);
      } else {
        updateTrip(trip.id, { progress: newProgress });
      }
    });

    logAction('Simulate Progress', 'Incremented transit progress for active routes');
    setSuccessMsg('Simulated transit progress. Drivers are en-route.');
  };

  // Filters
  const filteredTrips = trips.filter((t) => {
    const matchesSearch = t.source.toLowerCase().includes(search.toLowerCase()) ||
                          t.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Trip Dispatch Management</h2>
          <p className="text-xs text-muted-foreground">Log freight routes, estimate durations, and dispatch vehicles.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateProgress}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-500/10 cursor-pointer"
            title="Simulate en-route driver progress updates"
          >
            <Activity size={14} className="animate-pulse text-indigo-400" />
            Simulate GPS Progress
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={14} />
            {showAddForm ? 'Cancel' : 'Plan Trip'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">Plan Freight Shipment</h3>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <form onSubmit={handleCreateTrip} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Source Depot*</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicago Dispatch Center, IL"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Destination Hub*</label>
              <input
                type="text"
                required
                placeholder="e.g. Detroit Logistics Hub, MI"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Cargo Weight (kg)*</label>
              <input
                type="number"
                required
                value={cargoWeight}
                onChange={(e) => setCargoWeight(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Select Available Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">Draft (Unassigned)</option>
                {vehicles.filter(v => v.status === 'Available').map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name} (Max: {v.maxLoad}kg)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Select Available Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">Draft (Unassigned)</option>
                {drivers.filter(d => d.status === 'Available' && d.licenseExpiryDate >= new Date().toISOString().split('T')[0]).map((d) => (
                  <option key={d.id} value={d.id}>{d.name} (Score: {d.safetyScore})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Planned Distance (km)</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Estimated Duration (hours)</label>
              <input
                type="number"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
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
                Plan Freight
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search routes by destination, depot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-500 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
          >
            <option value="All">All Shipments</option>
            <option value="Draft">Draft (Planned)</option>
            <option value="Dispatched">Dispatched (En Route)</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trip cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            No transit shipments recorded.
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const vehicleObj = vehicles.find((v) => v.id === trip.vehicleId);
            const driverObj = drivers.find((d) => d.id === trip.driverId);

            // Simulated SVG GPS route map drawing parameters
            // Draws a straight line with a truck icon moving along the path
            const percent = trip.progress || 0;
            const markerX = 40 + (320 * (percent / 100)); // Map size: width 400

            return (
              <div key={trip.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 text-xs">
                {/* Source & Destination */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Depot Source</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">{trip.source}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Destination Hub</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">{trip.destination}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Distance</span>
                    <p className="font-bold font-mono">{trip.plannedDistance} km</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Duration</span>
                    <p className="font-bold font-mono">{trip.estimatedDuration} hrs</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Cargo Weight</span>
                    <p className="font-bold font-mono">{(trip.cargoWeight / 1000).toFixed(1)} Tons</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Freight Billing</span>
                    <p className="font-bold text-emerald-500 font-mono">${trip.revenue?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Vehicle & Driver links */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 w-full">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <Truck size={14} />
                    </div>
                    <span className="font-mono text-[11px] font-semibold truncate">
                      {vehicleObj ? `${vehicleObj.registrationNumber} (${vehicleObj.name})` : 'Unassigned Vehicle'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <User size={14} />
                    </div>
                    <span className="font-medium truncate text-[11px]">
                      {driverObj ? driverObj.name : 'Unassigned Operator'}
                    </span>
                  </div>
                </div>

                {/* Simulated GPS SVG Map */}
                {trip.status === 'Dispatched' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-indigo-500" /> GPS Route Map</span>
                      <span className="font-bold font-mono">ETA: {Math.max(1, Math.round((trip.estimatedDuration * (100 - percent)) / 100))} hrs left</span>
                    </div>
                    <div className="h-10 w-full bg-slate-100 dark:bg-slate-950 rounded-xl relative border border-slate-200 dark:border-slate-800 flex items-center overflow-hidden">
                      <svg width="100%" height="100%" viewBox="0 0 400 40" className="absolute inset-0">
                        {/* Route Line */}
                        <line x1="40" y1="20" x2="360" y2="20" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-800" />
                        <line x1="40" y1="20" x2={markerX} y2="20" stroke="#6366f1" strokeWidth="2.5" />
                        {/* Start Depot */}
                        <circle cx="40" y="20" r="4" fill="#6366f1" />
                        {/* Destination Hub */}
                        <circle cx="360" y="20" r="4" fill="#10b981" />
                      </svg>
                      {/* Truck marker */}
                      <div 
                        className="absolute h-5 w-5 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md text-white transition-all duration-300"
                        style={{ left: `calc(${percent}% - 10px)`, transform: 'translateY(-2px)' }}
                      >
                        <Truck size={10} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Shipment Status: <strong className="text-slate-700 dark:text-slate-300 uppercase">{trip.status}</strong></span>
                    <span className="font-bold">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {trip.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-semibold"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleDispatch(trip.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                      >
                        <Play size={12} />
                        Dispatch Trip
                      </button>
                    </>
                  )}
                  {trip.status === 'Dispatched' && (
                    <>
                      <button
                        onClick={() => handleCancel(trip.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg cursor-pointer"
                      >
                        <X size={12} />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleComplete(trip.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                      >
                        <Check size={12} />
                        Complete
                      </button>
                    </>
                  )}
                  {(trip.status === 'Completed' || trip.status === 'Cancelled') && (
                    <span className="text-[10px] text-slate-400 font-semibold uppercase italic py-1">
                      Archived
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
