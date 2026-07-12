"use client";

import { useState } from 'react';
import { useTransitStore, Vehicle, Driver, Trip } from '@/lib/store/transitStore';
import { Truck, User, ArrowRight, Play, AlertCircle, Compass, Sparkles } from 'lucide-react';

export default function DispatchBoardPage() {
  const { 
    vehicles, 
    drivers, 
    trips, 
    updateTrip, 
    dispatchTrip, 
    logAction 
  } = useTransitStore();

  const [draggedAsset, setDraggedAsset] = useState<{ type: 'vehicle' | 'driver'; id: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lists
  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const availableDrivers = drivers.filter((d) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return d.status === 'Available' && d.licenseExpiryDate >= todayStr;
  });
  
  const pendingTrips = trips.filter((t) => t.status === 'Draft');
  const activeTrips = trips.filter((t) => t.status === 'Dispatched');

  // Drag Handlers
  const handleDragStart = (type: 'vehicle' | 'driver', id: string) => {
    setDraggedAsset({ type, id });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = (tripId: string, targetType: 'vehicle' | 'driver') => {
    if (!draggedAsset) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const { type, id } = draggedAsset;

    if (type !== targetType) {
      setErrorMsg(`Invalid drop. Please drag a ${targetType} into the correct placeholder.`);
      return;
    }

    if (type === 'vehicle') {
      const trip = trips.find((t) => t.id === tripId);
      const vehicle = vehicles.find((v) => v.id === id);
      if (trip && vehicle && trip.cargoWeight > vehicle.maxLoad) {
        setErrorMsg(`Overload warning: Cargo weight (${trip.cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoad}kg).`);
        return;
      }
      updateTrip(tripId, { vehicleId: id });
      setSuccessMsg(`Vehicle successfully matched to trip.`);
    } else if (type === 'driver') {
      updateTrip(tripId, { driverId: id });
      setSuccessMsg(`Operator successfully matched to trip.`);
    }

    setDraggedAsset(null);
    logAction('Asset Matching', `Assigned ${type} ${id} to trip-${tripId.split('-')[1]}`);
  };

  const handleDispatch = (tripId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = dispatchTrip(tripId);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Interactive Dispatch Control</h2>
          <p className="text-xs text-muted-foreground">Drag and drop available operators and assets onto pending freight orders.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-semibold">
          <Sparkles size={13} className="text-indigo-500" />
          Interactive Dispatch
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-medium flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Dispatch Board Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 select-none text-xs">
        {/* Column 1: Vehicles */}
        <div className="space-y-4">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100 dark:bg-slate-900 rounded-xl">
            <h3 className="font-bold">Available Vehicles ({availableVehicles.length})</h3>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {availableVehicles.length === 0 ? (
              <div className="text-center p-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No vehicles available.
              </div>
            ) : (
              availableVehicles.map((v) => (
                <div
                  key={v.id}
                  draggable
                  onDragStart={() => handleDragStart('vehicle', v.id)}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all space-y-2 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{v.registrationNumber}</span>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{v.type}</span>
                  </div>
                  <div>
                    <h4 className="font-bold leading-tight text-slate-900 dark:text-white">{v.name}</h4>
                    <span className="text-[10px] text-slate-500">Capacity: {(v.maxLoad / 1000).toFixed(1)} Tons</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Drivers */}
        <div className="space-y-4">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100 dark:bg-slate-900 rounded-xl">
            <h3 className="font-bold">Eligible Operators ({availableDrivers.length})</h3>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {availableDrivers.length === 0 ? (
              <div className="text-center p-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active drivers.
              </div>
            ) : (
              availableDrivers.map((d) => (
                <div
                  key={d.id}
                  draggable
                  onDragStart={() => handleDragStart('driver', d.id)}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all flex items-center gap-3"
                >
                  <img
                    src={d.photo}
                    alt={d.name}
                    className="h-10 w-10 object-cover rounded-full border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate text-slate-900 dark:text-white leading-none mb-1">{d.name}</h4>
                    <span className="text-[10px] text-slate-500 block truncate">{d.licenseCategory}</span>
                    <span className="text-[9px] text-emerald-500 font-semibold block">Safety score: {d.safetyScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Pending & Dropzones */}
        <div className="space-y-4 xl:col-span-2">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100 dark:bg-slate-900 rounded-xl">
            <h3 className="font-bold">Pending Dispatches ({pendingTrips.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
            {pendingTrips.length === 0 ? (
              <div className="md:col-span-2 text-center p-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No pending shipments to dispatch.
              </div>
            ) : (
              pendingTrips.map((trip) => {
                const assignedVehicle = vehicles.find((v) => v.id === trip.vehicleId);
                const assignedDriver = drivers.find((d) => d.id === trip.driverId);

                return (
                  <div
                    key={trip.id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between gap-4"
                  >
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 truncate">
                        <span>{trip.source.split(',')[0]}</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span>{trip.destination.split(',')[0]}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Cargo: {(trip.cargoWeight / 1000).toFixed(1)} Tons</span>
                        <span className="font-semibold text-emerald-500">${trip.revenue?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Drag and Drop Boxes */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Vehicle dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(trip.id, 'vehicle')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all min-h-[72px] ${
                          assignedVehicle 
                            ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800' 
                            : 'bg-indigo-50/10 dark:bg-indigo-950/5 border-dashed border-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {assignedVehicle ? (
                          <div className="w-full">
                            <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 leading-none">
                              <Truck size={12} className="text-slate-500 shrink-0" />
                              <span className="truncate">{assignedVehicle.registrationNumber}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 block truncate mt-1">{assignedVehicle.name}</span>
                          </div>
                        ) : (
                          <>
                            <Truck size={16} className="text-indigo-400 mb-1" />
                            <span className="text-[9px] font-semibold text-indigo-400/90 leading-tight">Drop Vehicle</span>
                          </>
                        )}
                      </div>

                      {/* Driver dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(trip.id, 'driver')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all min-h-[72px] ${
                          assignedDriver 
                            ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800' 
                            : 'bg-indigo-50/10 dark:bg-indigo-950/5 border-dashed border-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {assignedDriver ? (
                          <div className="w-full text-left">
                            <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 leading-none">
                              <User size={12} className="text-slate-500 shrink-0" />
                              <span className="truncate">{assignedDriver.name}</span>
                            </div>
                            <span className="text-[9px] text-emerald-500 font-semibold block mt-1">Score: {assignedDriver.safetyScore}</span>
                          </div>
                        ) : (
                          <>
                            <User size={16} className="text-indigo-400 mb-1" />
                            <span className="text-[9px] font-semibold text-indigo-400/90 leading-tight">Drop Operator</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dispatch trigger */}
                    <button
                      onClick={() => handleDispatch(trip.id)}
                      disabled={!trip.vehicleId || !trip.driverId}
                      className="w-full flex items-center justify-center gap-1 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Play size={12} />
                      Dispatch Shipment
                    </button>
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
