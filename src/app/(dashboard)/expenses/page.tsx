"use client";

import { useState } from 'react';
import { useTransitStore, Expense, ExpenseCategory } from '@/lib/store/transitStore';
import { Plus, DollarSign, Receipt, Filter, Calendar, Folder } from 'lucide-react';

export default function ExpensesPage() {
  const { 
    vehicles, 
    expenses, 
    addExpense 
  } = useTransitStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [category, setCategory] = useState<ExpenseCategory>('Toll');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState('');
  const [department, setDepartment] = useState('Operations');

  // Filters for Report generation
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const handleResetForm = () => {
    setCategory('Toll');
    setDescription('');
    setAmount(100);
    setDate(new Date().toISOString().split('T')[0]);
    setVehicleId('');
    setDepartment('Operations');
    setFormError(null);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!description || amount <= 0) {
      setFormError('Please enter a description and an amount greater than 0.');
      return;
    }

    const payload = {
      category,
      description: description.trim(),
      amount: Number(amount),
      date,
      vehicleId: vehicleId || null,
      department,
    };

    const res = addExpense(payload);
    if (res.success) {
      setSuccessMsg(res.message);
      setShowAddForm(false);
      handleResetForm();
    } else {
      setFormError(res.message);
    }
  };

  // --- REPORT GENERATION LOGIC ---
  const filteredExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    const expYear = expDate.getFullYear().toString();
    const expMonth = (expDate.getMonth() + 1).toString().padStart(2, '0'); // e.g. "07"

    const matchesMonth = selectedMonth === 'All' || expMonth === selectedMonth;
    const matchesYear = selectedYear === 'All' || expYear === selectedYear;
    const matchesDept = selectedDept === 'All' || e.department === selectedDept;

    return matchesMonth && matchesYear && matchesDept;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Grouped cost stats for quick KPIs
  const totalExpensesAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const fuelExpensesTotal = expenses.filter((e) => e.category === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
  const maintExpensesTotal = expenses.filter((e) => e.category === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
  const otherExpensesTotal = totalExpensesAll - (fuelExpensesTotal + maintExpensesTotal);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Expenses Log</h2>
          <p className="text-xs text-muted-foreground font-medium">Record toll charges, parking fees, insurance premiums and taxes, and run report audits.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Cancel' : 'Record Expense'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Total Expenditures</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${totalExpensesAll.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <DollarSign size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Fuel Billing</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${fuelExpensesTotal.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
            <Receipt size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Asset Maintenance</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${maintExpensesTotal.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <Receipt size={18} />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase">Tolls, Taxes & Other</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">${otherExpensesTotal.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <Receipt size={18} />
          </div>
        </div>
      </div>

      {/* Log Expense Form */}
      {showAddForm && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold">Record Operational Expense</h3>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <form onSubmit={handleCreateExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Expense Category*</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Toll">Toll Road Charge</option>
                <option value="Parking">Parking Fee</option>
                <option value="Insurance">Asset Insurance installment</option>
                <option value="Fuel">Fuel billing adjustment</option>
                <option value="Maintenance">Maintenance bill adjustment</option>
                <option value="Repairs">Workshop Repair spare parts</option>
                <option value="Taxes">Road / Fleet Compliance Taxes</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Cost Amount (USD)*</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Transaction Date*</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Description details*</label>
              <input
                type="text"
                placeholder="e.g. Toll refill card transponder"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Related Asset (Optional)</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="">General (No Vehicle)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Corporate Department*</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              >
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Finance">Finance</option>
                <option value="Compliance">Compliance / HR</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                Record Cost
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Query/Report builder widget */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Expenses Audit Statement Builder</h3>
            <p className="text-[10px] text-slate-400">Generate department costs, fiscal reports or monthly summaries.</p>
          </div>
          <div className="font-bold text-indigo-500 dark:text-indigo-400 text-sm">
            Selected Total: ${totalFilteredAmount.toLocaleString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl">
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1"><Calendar size={12} /> Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1"><Calendar size={12} /> Fiscal Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1"><Folder size={12} /> Department</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Logistics">Logistics</option>
              <option value="Finance">Finance</option>
              <option value="Compliance">Compliance / HR</option>
            </select>
          </div>
        </div>

        {/* Filtered Expenses data list */}
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-950/20">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-3">Category</th>
                <th className="p-3">Details</th>
                <th className="p-3">Department</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Billing Date</th>
                <th className="p-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No expense audit transactions for selected query parameter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const veh = vehicles.find((v) => v.id === exp.vehicleId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/20">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          exp.category === 'Fuel' ? 'bg-rose-500/10 text-rose-500' :
                          exp.category === 'Maintenance' || exp.category === 'Repairs' ? 'bg-amber-500/10 text-amber-500' :
                          exp.category === 'Insurance' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{exp.description}</td>
                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{exp.department}</td>
                      <td className="p-3 font-mono font-medium">{veh ? veh.registrationNumber : <span className="text-slate-400">N/A</span>}</td>
                      <td className="p-3 text-slate-500">{exp.date}</td>
                      <td className="p-3 font-bold text-right text-slate-800 dark:text-slate-200">${exp.amount.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
