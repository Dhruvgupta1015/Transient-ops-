"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTransitStore, Vehicle } from '@/lib/store/transitStore';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Truck, User, Search, RefreshCw, AlertTriangle, Wifi, WifiOff, Smartphone, Gauge, Fuel, Battery, Clock } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
};

// Default center: India
const defaultCenter = {
  lat: 23.2599,
  lng: 77.4126
};

function getTimeAgo(timestamp?: string): string {
  if (!timestamp) return '—';
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getSourceInfo(vehicle: Vehicle) {
  const src = vehicle.activeTelemetrySource;
  if (src === 'telematics') {
    return { label: 'Truck GPS', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: Wifi };
  }
  if (src === 'mobile_app') {
    return { label: 'Driver Phone', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', icon: Smartphone };
  }
  return { label: 'Offline', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400', icon: WifiOff };
}

function getActiveTelemetry(vehicle: Vehicle) {
  if (vehicle.activeTelemetrySource === 'telematics') return vehicle.truckTelemetry;
  if (vehicle.activeTelemetrySource === 'mobile_app') return vehicle.mobileTelemetry;
  return vehicle.truckTelemetry || vehicle.mobileTelemetry;
}

export default function TrackingPage() {
  const { vehicles, drivers, processTelemetryEvent } = useTransitStore();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateTruckOffline, setSimulateTruckOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Simulated GPS Movement Effect
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      vehicles.forEach(vehicle => {
        if (vehicle.status === 'On Trip' && vehicle.gpsLocation) {
          const latNudge = (Math.random() - 0.5) * 0.005;
          const lngNudge = (Math.random() - 0.5) * 0.005;
          const newLat = vehicle.gpsLocation.lat + latNudge;
          const newLng = vehicle.gpsLocation.lng + lngNudge;
          const heading = Math.floor(Math.random() * 360);
          const speed = Math.floor(Math.random() * 40) + 40;

          // Always push Mobile App payload
          processTelemetryEvent({
            vehicle_id: vehicle.id,
            latitude: newLat,
            longitude: newLng,
            speed: speed,
            heading: heading,
            source: 'mobile_app',
            battery_level: Math.floor(Math.random() * 20) + 80,
            gps_accuracy: 5,
            recorded_at: new Date().toISOString()
          });

          // Push Truck Telematics payload (unless simulating offline)
          if (!simulateTruckOffline) {
            processTelemetryEvent({
              vehicle_id: vehicle.id,
              latitude: newLat,
              longitude: newLng,
              speed: speed,
              heading: heading,
              source: 'telematics',
              fuel_level: Math.floor(Math.random() * 40) + 40,
              ignition_status: true,
              recorded_at: new Date().toISOString()
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating, simulateTruckOffline, vehicles, processTelemetryEvent]);

  const trackedVehicles = useMemo(() => vehicles.filter(v => v.gpsLocation), [vehicles]);
  const activeVehiclesCount = trackedVehicles.filter(v => v.status === 'On Trip').length;
  const filteredVehicles = useMemo(() => {
    if (!searchQuery) return trackedVehicles;
    const q = searchQuery.toLowerCase();
    return trackedVehicles.filter(v =>
      v.registrationNumber.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
    );
  }, [trackedVehicles, searchQuery]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold">Map Initialization Failed</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Unable to load Google Maps. Please ensure <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is correctly set.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#eaebf0] pb-4 shrink-0 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800 font-sans">Fleet Tracking Center</h2>
          <p className="text-xs text-slate-400">Real-time dual-source GPS telemetry and asset monitoring.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isSimulating
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={13} className={isSimulating ? 'animate-spin' : ''} />
            {isSimulating ? 'Simulating...' : 'Start Simulation'}
          </button>
          {isSimulating && (
            <button
              onClick={() => setSimulateTruckOffline(!simulateTruckOffline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                simulateTruckOffline
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <WifiOff size={13} />
              {simulateTruckOffline ? 'Truck GPS Off' : 'Simulate Offline'}
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-green-100">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Telematics
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-4 flex-1 min-h-0">
        
        {/* Left Sidebar: Vehicle List */}
        <div className="w-80 flex flex-col bg-white border border-[#eaebf0] rounded-2xl shadow-sm shrink-0 overflow-hidden">
          <div className="p-3 border-b border-[#eaebf0] bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fleet (e.g. TX-882)..." 
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tracked Vehicles ({activeVehiclesCount} active)
            </div>
            
            {filteredVehicles.map(vehicle => {
              const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
              const sourceInfo = getSourceInfo(vehicle);
              const telemetry = getActiveTelemetry(vehicle);
              
              return (
                <div 
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedVehicle === vehicle.id 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {/* Row 1: Reg number + Source badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{vehicle.registrationNumber}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold uppercase tracking-wider ${sourceInfo.bg} ${sourceInfo.color} ${sourceInfo.border} border`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sourceInfo.dot} ${vehicle.activeTelemetrySource !== 'offline' ? 'animate-pulse' : ''}`} />
                      {sourceInfo.label}
                    </span>
                  </div>

                  {/* Row 2: Vehicle Name */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><Truck size={10} /> {vehicle.name}</span>
                  </div>

                  {/* Row 3: Telemetry Stats */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="bg-slate-50 p-1.5 rounded text-center">
                      <Gauge size={10} className="mx-auto text-slate-400 mb-0.5" />
                      <span className="font-semibold text-slate-700 block">{telemetry?.speed ?? 0} km/h</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded text-center">
                      {vehicle.activeTelemetrySource === 'mobile_app' ? (
                        <>
                          <Battery size={10} className="mx-auto text-amber-500 mb-0.5" />
                          <span className="font-semibold text-slate-700 block">{telemetry?.batteryLevel ?? '—'}%</span>
                        </>
                      ) : (
                        <>
                          <Fuel size={10} className="mx-auto text-emerald-500 mb-0.5" />
                          <span className="font-semibold text-slate-700 block">{telemetry?.fuelLevel ?? '—'}%</span>
                        </>
                      )}
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded text-center">
                      <Clock size={10} className="mx-auto text-slate-400 mb-0.5" />
                      <span className="font-semibold text-slate-700 block">{getTimeAgo(telemetry?.timestamp)}</span>
                    </div>
                  </div>

                  {/* Row 4: Driver */}
                  {driver && (
                    <div className="mt-2 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-600"><User size={10} /> {driver.name}</span>
                      <span className="text-blue-600 font-medium">Score: {driver.safetyScore}</span>
                    </div>
                  )}

                  {/* Row 5: Fallback reason */}
                  {vehicle.activeTelemetrySource === 'mobile_app' && (
                    <div className="mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700 font-medium">
                      ⚠ Truck GPS Offline — using Driver Phone
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Map */}
        <div className="flex-1 bg-slate-100 rounded-2xl border border-[#eaebf0] overflow-hidden relative shadow-sm">
          {!GOOGLE_MAPS_API_KEY && (
            <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm text-center space-y-4">
                <MapPin size={32} className="mx-auto text-blue-500" />
                <h3 className="text-sm font-bold text-slate-800">API Key Required</h3>
                <p className="text-xs text-slate-500">To render the live tracking map, please set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment variables.</p>
              </div>
            </div>
          )}

          {isLoaded && GOOGLE_MAPS_API_KEY ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={
                selectedVehicle 
                  ? vehicles.find(v => v.id === selectedVehicle)?.gpsLocation || defaultCenter
                  : defaultCenter
              }
              zoom={selectedVehicle ? 14 : 5}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: true,
                streetViewControl: false,
                styles: [
                  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }] },
                  { "featureType": "administrative.country", "elementType": "geometry", "stylers": [{ "visibility": "on" }] },
                  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#a0aab4" }] },
                  { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#a0aab4" }] },
                  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#e0e6ed" }] }
                ]
              }}
            >
              {/* Render Vehicle Markers */}
              {trackedVehicles.map((vehicle) => {
                const isSelected = selectedVehicle === vehicle.id;
                const sourceInfo = getSourceInfo(vehicle);
                const telemetry = getActiveTelemetry(vehicle);
                const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
                
                const markerColor = vehicle.activeTelemetrySource === 'telematics' ? '#10B981'
                  : vehicle.activeTelemetrySource === 'mobile_app' ? '#F59E0B'
                  : '#94A3B8';
                
                return (
                  <Marker
                    key={vehicle.id}
                    position={vehicle.gpsLocation!}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20" cy="20" r="16" fill="${markerColor}" opacity="0.2"/>
                          <circle cx="20" cy="20" r="8" fill="${markerColor}" stroke="white" stroke-width="2"/>
                        </svg>
                      `),
                      anchor: new window.google.maps.Point(20, 20),
                    }}
                  >
                    {isSelected && (
                      <InfoWindow
                        position={vehicle.gpsLocation!}
                        onCloseClick={() => setSelectedVehicle(null)}
                      >
                        <div className="p-2 min-w-[220px]" style={{ fontFamily: 'system-ui, sans-serif' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{vehicle.registrationNumber}</h4>
                            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: vehicle.activeTelemetrySource === 'telematics' ? '#ecfdf5' : vehicle.activeTelemetrySource === 'mobile_app' ? '#fffbeb' : '#f1f5f9', color: vehicle.activeTelemetrySource === 'telematics' ? '#059669' : vehicle.activeTelemetrySource === 'mobile_app' ? '#d97706' : '#64748b' }}>
                              {sourceInfo.label}
                            </span>
                          </div>
                          <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 8px 0' }}>{vehicle.name}</p>
                          
                          {driver && (
                            <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 8px 0' }}>👤 {driver.name}</p>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
                            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                              <span style={{ color: '#94a3b8', display: 'block' }}>Speed</span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{telemetry?.speed ?? 0} km/h</span>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                              <span style={{ color: '#94a3b8', display: 'block' }}>{vehicle.activeTelemetrySource === 'mobile_app' ? 'Battery' : 'Fuel'}</span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{vehicle.activeTelemetrySource === 'mobile_app' ? `${telemetry?.batteryLevel ?? '—'}%` : `${telemetry?.fuelLevel ?? '—'}%`}</span>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                              <span style={{ color: '#94a3b8', display: 'block' }}>Status</span>
                              <span style={{ fontWeight: 600, color: vehicle.status === 'On Trip' ? '#059669' : '#64748b' }}>{vehicle.status}</span>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                              <span style={{ color: '#94a3b8', display: 'block' }}>Last Update</span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{getTimeAgo(telemetry?.timestamp)}</span>
                            </div>
                          </div>

                          {vehicle.activeTelemetrySource === 'mobile_app' && (
                            <div style={{ marginTop: '8px', padding: '4px 8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '9px', color: '#92400e', fontWeight: 500 }}>
                              ⚠ Truck GPS Offline — tracking via driver phone
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                );
              })}
            </GoogleMap>
          ) : null}
        </div>
      </div>
    </div>
  );
}
