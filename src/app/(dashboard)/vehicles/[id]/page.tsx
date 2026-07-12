"use client";

import { use, useState } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { 
  ArrowLeft, 
  Truck, 
  Calendar, 
  DollarSign, 
  Wrench, 
  Droplet, 
  FileText, 
  MapPin, 
  CheckCircle,
  Clock,
  Plus,
  AlertTriangle,
  User
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { 
    vehicles, 
    drivers, 
    trips, 
    maintenanceLogs, 
    fuelLogs, 
    expenses, 
    documents, 
    addDocument, 
    deleteDocument 
  } = useTransitStore();

  const vehicle = vehicles.find((v) => v.id === id);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel' | 'trips' | 'docs'>('maintenance');

  // Document upload simulator state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Insurance');
  const [docExpiry, setDocExpiry] = useState('2027-12-31');

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-red-500">Asset Registry Error</h3>
        <p className="text-xs text-muted-foreground mt-1">The specified vehicle ID could not be resolved.</p>
        <Link href="/vehicles" className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:underline">
          <ArrowLeft size={14} /> Back to Vehicles
        </Link>
      </div>
    );
  }

  // Find assigned driver
  const assignedDriver = drivers.find((d) => d.assignedVehicleId === vehicle.id);

  // Filter logs for this vehicle
  const vehicleMaintenance = maintenanceLogs.filter((m) => m.vehicleId === vehicle.id);
  const vehicleFuel = fuelLogs.filter((f) => f.vehicleId === vehicle.id);
  const vehicleTrips = trips.filter((t) => t.vehicleId === vehicle.id);
  const vehicleExpenses = expenses.filter((e) => e.vehicleId === vehicle.id);
  const vehicleDocuments = documents.filter((d) => d.entityType === 'Vehicle' && d.entityId === vehicle.id);

  // Calc calculations
  const totalRevenue = vehicleTrips
    .filter((t) => t.status === 'Completed' || t.status === 'Dispatched')
    .reduce((sum, t) => sum + (t.revenue || 0), 0);

  const fuelCost = vehicleFuel.reduce((sum, f) => sum + f.fuelCost, 0);
  const maintenanceCost = vehicleMaintenance.reduce((sum, m) => sum + (m.actualCost ?? m.estimatedCost), 0);
  const otherCost = vehicleExpenses.filter((e) => e.category !== 'Fuel' && e.category !== 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
  const totalOpCost = fuelCost + maintenanceCost + otherCost;

  // ROI = (Total Revenue / (Purchase Cost + Op Expenses)) * 100
  const vehicleROI = vehicle.acquisitionCost + totalOpCost > 0
    ? Math.round((totalRevenue / (vehicle.acquisitionCost + totalOpCost)) * 100 * 10) / 10
    : 0;

  // Average Fuel efficiency (km per liter)
  // Formula: average mileage across logs
  const totalFuelQty = vehicleFuel.reduce((sum, f) => sum + f.fuelQuantity, 0);
  const avgMileage = totalFuelQty > 0 ? Math.round((vehicle.currentOdometer - vehicleFuel[0]?.odometer || 0) / totalFuelQty * 10) / 10 : 0;
  const costPerKm = vehicle.currentOdometer > 0 ? Math.round((totalOpCost / vehicle.currentOdometer) * 100) / 100 : 0;

  // Recharts line chart data: Fuel logged cost vs odometer
  const fuelChartData = vehicleFuel.map((f) => ({
    date: f.date,
    cost: f.fuelCost,
    qty: f.fuelQuantity,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    addDocument({
      entityType: 'Vehicle',
      entityId: vehicle.id,
      name: docName,
      fileUrl: `/docs/simulated_upload_${Date.now()}.pdf`,
      expiryDate: docExpiry,
      type: docType,
    });

    setDocName('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/vehicles" className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{vehicle.name} Detail Profile</h2>
          <p className="text-xs text-muted-foreground font-mono">Registration: {vehicle.registrationNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset Info */}
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
            <div className="relative h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <img
                src={vehicle.imageUrl}
                alt={vehicle.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400';
                }}
              />
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold shadow-md ${
                vehicle.status === 'Available' ? 'bg-emerald-500 text-white' :
                vehicle.status === 'On Trip' ? 'bg-blue-500 text-white' :
                vehicle.status === 'In Shop' ? 'bg-amber-500 text-white' :
                'bg-slate-500 text-white'
              }`}>
                {vehicle.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:divide-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.type}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:divide-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Model Code</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.model}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:divide-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Current Odometer</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{vehicle.currentOdometer.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:divide-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Payload Capacity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.maxLoad.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:divide-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Acquisition Cost</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">${vehicle.acquisitionCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-500 font-medium">Purchase Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.purchaseDate}</span>
              </div>
            </div>

            {/* Expired Docs warning */}
            {(vehicle.insuranceExpiry < today || vehicle.pollutionCert < today) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-500 text-[11px] leading-snug">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Compliance Expiry Alert:</span>
                  {vehicle.insuranceExpiry < today && <p>• Commercial Insurance expired on {vehicle.insuranceExpiry}.</p>}
                  {vehicle.pollutionCert < today && <p>• Pollution Certificate expired on {vehicle.pollutionCert}.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Driver Panel */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
            <h4 className="font-bold">Assigned Operator</h4>
            {assignedDriver ? (
              <div className="flex items-center gap-3">
                <img
                  src={assignedDriver.photo}
                  alt={assignedDriver.name}
                  className="h-10 w-10 object-cover rounded-full border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                  }}
                />
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200">{assignedDriver.name}</h5>
                  <span className="text-[10px] text-slate-500">{assignedDriver.licenseCategory} • Score: {assignedDriver.safetyScore}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <User size={16} />
                <span>No primary driver assigned to this vehicle.</span>
              </div>
            )}
          </div>

          {/* Financial calculations */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl shadow-sm text-white space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Financial Analytics</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">Revenue Earned</span>
                <p className="text-base font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">Operating Cost</span>
                <p className="text-base font-bold text-rose-400">${totalOpCost.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">Vehicle ROI</span>
                <p className="text-base font-bold text-indigo-400">{vehicleROI}%</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">Cost Per Km</span>
                <p className="text-base font-bold text-slate-200">${costPerKm}/km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Panels & Graphs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recharts graph of fuel cost */}
          {fuelChartData.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Fuel Refueling History Trend</h4>
              <div className="h-48 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelChartData}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} unit="$" />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Details navigation tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold select-none">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'maintenance' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Service History ({vehicleMaintenance.length})
            </button>
            <button
              onClick={() => setActiveTab('fuel')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'fuel' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Fuel Log ({vehicleFuel.length})
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'trips' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Assigned Trips ({vehicleTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'docs' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Documents Vault ({vehicleDocuments.length})
            </button>
          </div>

          {/* TAB 1: Maintenance */}
          {activeTab === 'maintenance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="p-3">Service Details</th>
                    <th className="p-3">Workshop</th>
                    <th className="p-3">Cost Breakdown</th>
                    <th className="p-3">Dates</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {vehicleMaintenance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No service logs registered.
                      </td>
                    </tr>
                  ) : (
                    vehicleMaintenance.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/20">
                        <td className="p-3 font-medium">
                          <div>{log.serviceType}</div>
                          <span className="text-[10px] text-slate-500">{log.description}</span>
                        </td>
                        <td className="p-3">
                          <div>{log.workshop}</div>
                          <span className="text-[10px] text-slate-500">Tech: {log.mechanic}</span>
                        </td>
                        <td className="p-3 font-semibold">
                          {log.actualCost ? (
                            <div>${log.actualCost.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Final</span></div>
                          ) : (
                            <div className="text-amber-500">${log.estimatedCost.toLocaleString()} <span className="text-[10px] text-amber-500/80 font-normal">Est</span></div>
                          )}
                        </td>
                        <td className="p-3 text-[11px] space-y-0.5">
                          <div>Start: {log.startDate}</div>
                          {log.endDate && <div>End: {log.endDate}</div>}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            log.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            log.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Fuel History */}
          {activeTab === 'fuel' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="p-3">Station</th>
                    <th className="p-3">Quantity (L)</th>
                    <th className="p-3">Refill Cost</th>
                    <th className="p-3">Odometer</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {vehicleFuel.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No fuel logs recorded.
                      </td>
                    </tr>
                  ) : (
                    vehicleFuel.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/20">
                        <td className="p-3 font-medium">{log.fuelStation}</td>
                        <td className="p-3 font-mono">{log.fuelQuantity} L</td>
                        <td className="p-3 font-semibold">${log.fuelCost}</td>
                        <td className="p-3 font-mono">{log.odometer.toLocaleString()} km</td>
                        <td className="p-3 text-slate-500">{log.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Trips */}
          {activeTab === 'trips' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="p-3">Source & Destination</th>
                    <th className="p-3">Cargo Weight</th>
                    <th className="p-3">Billing</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {vehicleTrips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No assigned trips registered.
                      </td>
                    </tr>
                  ) : (
                    vehicleTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50/20">
                        <td className="p-3 font-medium">
                          <div>{trip.source}</div>
                          <div className="text-[10px] text-slate-400">To: {trip.destination}</div>
                        </td>
                        <td className="p-3 font-mono">{(trip.cargoWeight / 1000).toFixed(1)} Tons</td>
                        <td className="p-3 font-semibold">${trip.revenue?.toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-full" style={{ width: `${trip.progress}%` }} />
                            </div>
                            <span>{trip.progress}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            trip.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            trip.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Documents Vault */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              {/* Upload simulation */}
              <form onSubmit={handleUploadDoc} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row gap-3 items-end text-xs">
                <div className="space-y-1 flex-1 w-full">
                  <label className="font-semibold text-slate-500">Document Label*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emission Testing Compliance"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1 w-full sm:w-36">
                  <label className="font-semibold text-slate-500">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                  >
                    <option value="Insurance">Insurance</option>
                    <option value="Pollution">Pollution</option>
                    <option value="Registration">Registration</option>
                    <option value="General">Other</option>
                  </select>
                </div>
                <div className="space-y-1 w-full sm:w-36">
                  <label className="font-semibold text-slate-500">Expiry Date</label>
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer w-full sm:w-auto"
                >
                  Add Document
                </button>
              </form>

              {/* Documents table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-3">File Label</th>
                      <th className="p-3">Certification Type</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {vehicleDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          No certifications registered.
                        </td>
                      </tr>
                    ) : (
                      vehicleDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/20">
                          <td className="p-3 font-medium flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            <span>{doc.name}</span>
                          </td>
                          <td className="p-3 font-semibold text-indigo-500">{doc.type}</td>
                          <td className="p-3">
                            {doc.expiryDate ? (
                              <span className={doc.expiryDate < today ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                                {doc.expiryDate} {doc.expiryDate < today && '(Expired)'}
                              </span>
                            ) : (
                              <span className="text-slate-400">No Expiry</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="px-2 py-1 text-red-500 hover:bg-red-500/10 rounded-md transition-all cursor-pointer font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
