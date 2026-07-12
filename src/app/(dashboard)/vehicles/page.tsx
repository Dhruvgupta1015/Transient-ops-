"use client";

import { useState } from 'react';
import { useTransitStore, Vehicle, VehicleStatus } from '@/lib/store/transitStore';
import { Plus, Search, Filter, Trash2, Edit, ExternalLink, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

export default function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useTransitStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'registrationNumber' | 'currentOdometer' | 'acquisitionCost'>('registrationNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [regNum, setRegNum] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Heavy Duty Truck');
  const [maxLoad, setMaxLoad] = useState(25000);
  const [odometer, setOdometer] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState('2024-01-01');
  const [cost, setCost] = useState(140000);
  const [insurance, setInsurance] = useState('2026-12-31');
  const [pollution, setPollution] = useState('2026-12-31');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('Available');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleResetForm = () => {
    setRegNum('');
    setName('');
    setModel('');
    setType('Heavy Duty Truck');
    setMaxLoad(25000);
    setOdometer(0);
    setPurchaseDate('2024-01-01');
    setCost(140000);
    setInsurance('2026-12-31');
    setPollution('2026-12-31');
    setImage('');
    setStatus('Available');
    setFormError(null);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setRegNum(v.registrationNumber);
    setName(v.name);
    setModel(v.model);
    setType(v.type);
    setMaxLoad(v.maxLoad);
    setOdometer(v.currentOdometer);
    setPurchaseDate(v.purchaseDate);
    setCost(v.acquisitionCost);
    setInsurance(v.insuranceExpiry);
    setPollution(v.pollutionCert);
    setImage(v.imageUrl || '');
    setStatus(v.status);
    setShowAddForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!regNum || !name || !model) {
      setFormError('Please fill out all required fields (Registration Number, Name, Model).');
      return;
    }

    const payload = {
      registrationNumber: regNum.toUpperCase().trim(),
      name: name.trim(),
      model: model.trim(),
      type,
      maxLoad: Number(maxLoad),
      currentOdometer: Number(odometer),
      purchaseDate,
      acquisitionCost: Number(cost),
      insuranceExpiry: insurance,
      pollutionCert: pollution,
      imageUrl: image || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
      status,
    };

    if (editingVehicle) {
      const res = updateVehicle(editingVehicle.id, payload);
      if (res.success) {
        setSuccessMsg(res.message);
        setEditingVehicle(null);
        setShowAddForm(false);
        handleResetForm();
      } else {
        setFormError(res.message);
      }
    } else {
      const res = addVehicle(payload);
      if (res.success) {
        setSuccessMsg(res.message);
        setShowAddForm(false);
        handleResetForm();
      } else {
        setFormError(res.message);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle from the registry?')) {
      const res = deleteVehicle(id);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        alert(res.message);
      }
    }
  };

  // Filter / Sort / Paginate
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch = v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
                            v.name.toLowerCase().includes(search.toLowerCase()) ||
                            v.model.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      const matchesType = typeFilter === 'All' || v.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'registrationNumber') {
        comparison = a.registrationNumber.localeCompare(b.registrationNumber);
      } else if (sortField === 'currentOdometer') {
        comparison = a.currentOdometer - b.currentOdometer;
      } else if (sortField === 'acquisitionCost') {
        comparison = a.acquisitionCost - b.acquisitionCost;
      }
      return sortAsc ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'registrationNumber' | 'currentOdometer' | 'acquisitionCost') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Vehicle Management</h2>
          <p className="text-xs text-muted-foreground">Manage registration, inspection dates, and fleet availability.</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            handleResetForm();
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Cancel Form' : 'Register Vehicle'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* Register / Edit Form Panel */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">{editingVehicle ? 'Edit Vehicle Profile' : 'Register New Fleet Asset'}</h3>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Registration Number (Unique)*</label>
              <input
                type="text"
                placeholder="e.g. TX-882-AB"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                disabled={!!editingVehicle}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Vehicle Name*</label>
              <input
                type="text"
                placeholder="e.g. Volvo FH16"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Model & Year*</label>
              <input
                type="text"
                placeholder="e.g. FH16 Globetrotter (2023)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                <option value="Medium Duty Truck">Medium Duty Truck</option>
                <option value="Light Duty Truck">Light Duty Truck</option>
                <option value="Cargo Van">Cargo Van</option>
                <option value="Reefer (Refrigerated)">Reefer (Refrigerated)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Load Capacity (kg)</label>
              <input
                type="number"
                value={maxLoad}
                onChange={(e) => setMaxLoad(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Current Odometer (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Acquisition Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Acquisition Cost (USD)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Insurance Expiry Date</label>
              <input
                type="date"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Pollution Certificate Expiry</label>
              <input
                type="date"
                value={pollution}
                onChange={(e) => setPollution(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Photo URL</label>
              <input
                type="text"
                placeholder="Image address"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Asset Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 font-medium cursor-pointer"
              >
                Reset fields
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                {editingVehicle ? 'Update Vehicle' : 'Register Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registration, name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Types</option>
              <option value="Heavy Duty Truck">Heavy Duty</option>
              <option value="Medium Duty Truck">Medium Duty</option>
              <option value="Cargo Van">Cargo Van</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid / Table Asset List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="p-4">Vehicle Details</th>
              <th className="p-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none" onClick={() => toggleSort('registrationNumber')}>
                <div className="flex items-center gap-1">
                  Registration
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-4">Type & Capacity</th>
              <th className="p-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none" onClick={() => toggleSort('currentOdometer')}>
                <div className="flex items-center gap-1">
                  Odometer
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-4">Insurance & Pollution</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {paginatedVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                  No fleet vehicles match search criteria.
                </td>
              </tr>
            ) : (
              paginatedVehicles.map((v) => {
                const today = new Date().toISOString().split('T')[0];
                const hasExpiredDocs = v.insuranceExpiry < today || v.pollutionCert < today;

                return (
                  <tr key={v.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={v.imageUrl}
                        alt={v.name}
                        className="h-10 w-12 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{v.name}</h4>
                        <span className="text-[10px] text-slate-500">{v.model}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold">{v.registrationNumber}</td>
                    <td className="p-4">
                      <div className="font-medium">{v.type}</div>
                      <div className="text-[10px] text-slate-500">Max: {(v.maxLoad / 1000).toFixed(1)} Tons</div>
                    </td>
                    <td className="p-4 font-medium">{v.currentOdometer.toLocaleString()} km</td>
                    <td className="p-4 space-y-1">
                      <div className={`flex items-center gap-1 text-[10px] ${v.insuranceExpiry < today ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                        Ins: {v.insuranceExpiry}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] ${v.pollutionCert < today ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                        Poll: {v.pollutionCert}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' :
                        v.status === 'On Trip' ? 'bg-blue-500/10 text-blue-500' :
                        v.status === 'In Shop' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg font-semibold"
                        title="View Asset Profile"
                      >
                        <ExternalLink size={12} />
                        Details
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-1 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1 text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
