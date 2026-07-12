"use client";

import { useState } from 'react';
import { useTransitStore, Driver, DriverStatus } from '@/lib/store/transitStore';
import { Plus, Search, Filter, Trash2, Edit, AlertCircle, Award, Calendar, Phone, ArrowUpDown } from 'lucide-react';

export default function DriversPage() {
  const { drivers, vehicles, addDriver, updateDriver, deleteDriver } = useTransitStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'name' | 'safetyScore'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseCat, setLicenseCat] = useState('Class A CDL');
  const [licenseExpiry, setLicenseExpiry] = useState('2027-01-01');
  const [safetyScore, setSafetyScore] = useState(95);
  const [assignedVehicle, setAssignedVehicle] = useState<string>('');
  const [status, setStatus] = useState<DriverStatus>('Available');
  const [photo, setPhoto] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setContact('');
    setLicenseNum('');
    setLicenseCat('Class A CDL');
    setLicenseExpiry('2027-01-01');
    setSafetyScore(95);
    setAssignedVehicle('');
    setStatus('Available');
    setPhoto('');
    setFormError(null);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setEmail(d.email);
    setContact(d.contactNumber);
    setLicenseNum(d.licenseNumber);
    setLicenseCat(d.licenseCategory);
    setLicenseExpiry(d.licenseExpiryDate);
    setSafetyScore(d.safetyScore);
    setAssignedVehicle(d.assignedVehicleId || '');
    setStatus(d.status);
    setPhoto(d.photo || '');
    setShowAddForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!name || !email || !licenseNum) {
      setFormError('Please fill out all required fields (Name, Email, License Number).');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contactNumber: contact.trim(),
      licenseNumber: licenseNum.toUpperCase().trim(),
      licenseCategory: licenseCat,
      licenseExpiryDate: licenseExpiry,
      safetyScore: Number(safetyScore),
      assignedVehicleId: assignedVehicle || null,
      status,
      photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    };

    if (editingDriver) {
      const res = updateDriver(editingDriver.id, payload);
      if (res.success) {
        setSuccessMsg(res.message);
        setShowAddForm(false);
        setEditingDriver(null);
        handleResetForm();
      } else {
        setFormError(res.message);
      }
    } else {
      const res = addDriver(payload);
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
    if (confirm('Are you sure you want to decommission this driver profile?')) {
      const res = deleteDriver(id);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        alert(res.message);
      }
    }
  };

  // Filter / Sort / Paginate
  const filteredDrivers = drivers
    .filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                            d.email.toLowerCase().includes(search.toLowerCase()) ||
                            d.licenseNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'safetyScore') {
        comparison = a.safetyScore - b.safetyScore;
      }
      return sortAsc ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'name' | 'safetyScore') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Driver & Operator Registry</h2>
          <p className="text-xs text-muted-foreground">Manage CDL licensing, safety scores, and vehicle assignments.</p>
        </div>
        <button
          onClick={() => {
            setEditingDriver(null);
            handleResetForm();
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Cancel' : 'Register Operator'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* Add / Edit Form Panel */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">{editingDriver ? 'Edit Operator Profile' : 'Onboard New Operator'}</h3>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Full Name*</label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Contact Number*</label>
              <input
                type="text"
                placeholder="+1 555-0192"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Email Address*</label>
              <input
                type="email"
                placeholder="driver@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Commercial License Number*</label>
              <input
                type="text"
                placeholder="CDL-XXXXX"
                value={licenseNum}
                onChange={(e) => setLicenseNum(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">License Category</label>
              <select
                value={licenseCat}
                onChange={(e) => setLicenseCat(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Class A CDL">Class A CDL (Heavy Combinations)</option>
                <option value="Class B CDL">Class B CDL (Single / Heavy Straight)</option>
                <option value="Class C CDL">Class C CDL (Light / Hazardous)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">License Expiry Date*</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Safety Score (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={safetyScore}
                onChange={(e) => setSafetyScore(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Assigned Fleet Vehicle</label>
              <select
                value={assignedVehicle}
                onChange={(e) => setAssignedVehicle(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">No Vehicle Assigned</option>
                {vehicles.filter(v => v.status === 'Available' || v.id === editingDriver?.assignedVehicleId).map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Driver Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DriverStatus)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="font-semibold text-slate-500">Photo URL</label>
              <input
                type="text"
                placeholder="Link to avatar image"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium cursor-pointer hover:bg-slate-200"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                {editingDriver ? 'Save Profile' : 'Onboard Driver'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drivers by name, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
          />
        </div>
        <div className="flex gap-4 items-center w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-500 font-semibold">Duty:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Operators</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">Operator <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4">License Credentials</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => toggleSort('safetyScore')}>
                <div className="flex items-center gap-1">Safety Index <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4">Assigned vehicle</th>
              <th className="p-4">Duty Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {paginatedDrivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No drivers found matching criteria.</td>
              </tr>
            ) : (
              paginatedDrivers.map((d) => {
                const isLicenseExpired = d.licenseExpiryDate < todayStr;
                const vehicleObj = vehicles.find((v) => v.id === d.assignedVehicleId);

                // Compute license countdown
                const today = new Date();
                const expiry = new Date(d.licenseExpiryDate);
                const diffTime = expiry.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <tr key={d.id} className="hover:bg-slate-50/20">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={d.photo}
                        alt={d.name}
                        className="h-10 w-10 object-cover rounded-full border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-none">{d.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">{d.email}</span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="font-semibold">{d.licenseNumber}</div>
                      <div className="text-[10px] text-slate-500">{d.licenseCategory}</div>
                      <div className={`flex items-center gap-1 text-[10px] font-medium ${
                        isLicenseExpired ? 'text-red-500 font-bold' : diffDays <= 30 ? 'text-amber-500' : 'text-slate-500'
                      }`}>
                        <Calendar size={10} />
                        {isLicenseExpired 
                          ? `Expired (${d.licenseExpiryDate})` 
                          : `${diffDays} days left (${d.licenseExpiryDate})`
                        }
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1 font-mono">
                        <Phone size={10} />
                        {d.contactNumber}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      <div className="flex items-center gap-1">
                        <Award size={12} className={d.safetyScore >= 90 ? 'text-emerald-500' : d.safetyScore >= 75 ? 'text-indigo-500' : 'text-rose-500'} />
                        <span className={d.safetyScore >= 90 ? 'text-emerald-500 font-bold' : d.safetyScore >= 75 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500 font-bold'}>
                          {d.safetyScore}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-medium">
                      {vehicleObj ? (
                        <div>
                          <span>{vehicleObj.registrationNumber}</span>
                          <span className="block text-[10px] text-slate-500 font-sans">{vehicleObj.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' :
                        d.status === 'On Trip' ? 'bg-blue-500/10 text-blue-500' :
                        d.status === 'Off Duty' ? 'bg-slate-500/10 text-slate-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer inline-flex"
                        title="Edit profile"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1 text-slate-500 hover:text-red-500 transition-all cursor-pointer inline-flex"
                        title="Delete profile"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 cursor-pointer font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 cursor-pointer font-semibold"
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
