"use client";

import { useState } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { FileText, Plus, Trash2, ShieldAlert, CheckCircle, Search, Calendar, FolderOpen } from 'lucide-react';

export default function DocumentsPage() {
  const { documents, vehicles, drivers, addDocument, deleteDocument } = useTransitStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<'Vehicle' | 'Driver' | 'General'>('General');
  const [entityId, setEntityId] = useState('');
  const [docType, setDocType] = useState('Insurance');
  const [expiryDate, setExpiryDate] = useState('2027-01-01');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleResetForm = () => {
    setName('');
    setEntityType('General');
    setEntityId('');
    setDocType('Insurance');
    setExpiryDate('2027-01-01');
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addDocument({
      entityType,
      entityId: entityId || 'general',
      name: name.trim(),
      fileUrl: `/docs/simulated_upload_${Date.now()}.pdf`,
      expiryDate: expiryDate || null,
      type: docType,
    });

    setShowAddForm(false);
    handleResetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this file from vault?')) {
      deleteDocument(id);
    }
  };

  // Calculations
  const totalCount = documents.length;
  
  const expiredCount = documents.filter((d) => {
    if (!d.expiryDate) return false;
    return d.expiryDate < todayStr;
  }).length;

  const expiringSoonCount = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(d.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }).length;

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || d.entityType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Compliance Documents Vault</h2>
          <p className="text-xs text-muted-foreground">Manage corporate operating permits, driver licenses and vehicle insurance policies.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Cancel' : 'Upload Certification'}
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Stored Files</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{totalCount} Certifications</h3>
          </div>
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <FolderOpen size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Expired Certifications</span>
            <h3 className="text-lg font-bold text-rose-500 mt-1">{expiredCount} Expired</h3>
          </div>
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
            <ShieldAlert size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Expiring In 30 Days</span>
            <h3 className="text-lg font-bold text-amber-500 mt-1">{expiringSoonCount} Impending</h3>
          </div>
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      {/* Add Document Form */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">Register Document Certification</h3>
          <form onSubmit={handleCreateDocument} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Document Label Name*</label>
              <input
                type="text"
                required
                placeholder="e.g. California State Registration"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Entity Group Mapping</label>
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value as any);
                  setEntityId('');
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="General">General Corporate</option>
                <option value="Vehicle">Vehicle Certification</option>
                <option value="Driver">Driver CDL</option>
              </select>
            </div>
            
            {entityType !== 'General' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Select Specific {entityType}</label>
                <select
                  required
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                >
                  <option value="">Select Reference</option>
                  {entityType === 'Vehicle' 
                    ? vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name}</option>)
                    : drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                  }
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Document Category</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Insurance">Insurance Policy</option>
                <option value="Pollution">Pollution Certificate</option>
                <option value="Registration">State Registration</option>
                <option value="License">Operator CDL License</option>
                <option value="General">Other Permit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Certification Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
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
                Store Certification
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
            placeholder="Search documents by label, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
          />
        </div>
        <div className="flex gap-4 items-center w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-slate-500 font-semibold">Scope:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Documents</option>
              <option value="Vehicle">Vehicles Scope</option>
              <option value="Driver">Drivers Scope</option>
              <option value="General">Corporate Scope</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Vault List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="p-4">Document File Name</th>
              <th className="p-4">Classification</th>
              <th className="p-4">Mapped Reference ID</th>
              <th className="p-4">Expiration Date</th>
              <th className="p-4">Audit Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No certifications matched in the secure vault.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const isExpired = doc.expiryDate && doc.expiryDate < todayStr;
                
                // Mapped label matching
                let refLabel = 'General Corporate';
                if (doc.entityType === 'Vehicle') {
                  const veh = vehicles.find(v => v.id === doc.entityId);
                  refLabel = veh ? `Truck: ${veh.registrationNumber}` : 'Vehicle reference deleted';
                } else if (doc.entityType === 'Driver') {
                  const drv = drivers.find(d => d.id === doc.entityId);
                  refLabel = drv ? `CDL: ${drv.name}` : 'Driver profile deleted';
                }

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/20">
                    <td className="p-4 flex items-center gap-3 font-medium">
                      <FileText size={16} className="text-slate-400 shrink-0" />
                      <div>
                        <h4 className="text-slate-800 dark:text-slate-200 font-bold">{doc.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">simulated_binary_upload.pdf</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold">{doc.type}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{refLabel}</td>
                    <td className="p-4 font-mono font-medium">
                      {doc.expiryDate ? doc.expiryDate : <span className="text-slate-400">Non-expiring</span>}
                    </td>
                    <td className="p-4">
                      {doc.expiryDate ? (
                        isExpired ? (
                          <span className="px-2.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold flex items-center gap-1 w-max">
                            <ShieldAlert size={10} /> Expired
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1 w-max">
                            <CheckCircle size={10} /> Compliant
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium">Permanent</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-slate-500 hover:text-red-500 transition-all cursor-pointer inline-flex"
                        title="Purge certificate"
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
      </div>
    </div>
  );
}
