import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Package, AlertTriangle, TrendingDown, Plus, Search,
  Filter, CheckCircle2, DollarSign, X, ShieldAlert, Sparkles,
  Building2, Activity, ArrowUpRight, Check, AlertCircle, RefreshCw
} from 'lucide-react'
import api from '../services/api'

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form Fields
  const [name, setName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [category, setCategory] = useState('Analgesics')
  const [manufacturer, setManufacturer] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [minStockLevel, setMinStockLevel] = useState('15')
  const [unit, setUnit] = useState('tablets')
  const [requiresPrescription, setRequiresPrescription] = useState(true)
  const [description, setDescription] = useState('')

  const categories = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Antipyretics',
    'Cardiovascular',
    'Gastrointestinal',
    'Respiratory',
    'Antidiabetic',
    'Dermatology',
    'Vitamins & Supplements'
  ]

  const fetchMedicines = async () => {
    try {
      setLoading(true)
      const catParam = categoryFilter !== 'all' ? `&category=${categoryFilter}` : ''
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      const res = await api.get(`/medicines?per_page=100${catParam}${searchParam}`)
      setMedicines(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicines()
  }, [categoryFilter, search])

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Medicine Name is required.')
      return
    }

    setCreating(true)
    setErrorMsg('')
    try {
      const payload = {
        name: name.trim(),
        generic_name: genericName.trim() || undefined,
        category: category,
        manufacturer: manufacturer.trim() || 'Standard Pharmaceuticals',
        unit_price: parseFloat(unitPrice) || 5.0,
        current_stock: parseInt(currentStock, 10) || 100,
        min_stock_level: parseInt(minStockLevel, 10) || 15,
        unit: unit,
        requires_prescription: requiresPrescription,
        description: description.trim() || undefined,
      }

      await api.post('/medicines', payload)
      setSuccessMsg(`Medicine "${name}" added to pharmacy inventory!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      // Reset form & close modal
      setName('')
      setGenericName('')
      setManufacturer('')
      setUnitPrice('')
      setCurrentStock('')
      setDescription('')
      setShowAddModal(false)

      // Refresh list
      fetchMedicines()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add medicine. Please verify your permissions.')
    } finally {
      setCreating(false)
    }
  }

  // Summary Metrics
  const totalStockCount = medicines.reduce((acc, m) => acc + (m.current_stock || 0), 0)
  const lowStockCount = medicines.filter((m) => (m.current_stock || 0) <= (m.min_stock_level || 15)).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-[#070d1e] via-[#0b142c] to-[#070d1e] text-slate-100 relative overflow-hidden">
      {/* Multi-Color Ambient Glow Spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-purple-500/15 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />

      {/* Reduced-Opacity Healthcare Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Smart E-Pharmacy & Drug Dispensary</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center tracking-tight">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-600 text-white flex items-center justify-center mr-3 shadow-lg shadow-teal-500/25">
                <Package className="h-6 w-6" />
              </div>
              Pharmacy Inventory & Stock
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Real-time pharmaceutical stock levels, dosage units, batch dispensing, and automated reorder alerts.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xl shadow-teal-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add New Medicine</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center space-x-2.5 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 Multi-Color Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-teal-500/30 bg-gradient-to-b from-slate-900 to-[#0a241f] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Catalogued Drugs</span>
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{medicines.length}</div>
            <span className="text-xs text-teal-400 font-semibold mt-1 block">Active formulations</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 to-[#0c1c38] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Units in Stock</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{totalStockCount.toLocaleString()}</div>
            <span className="text-xs text-cyan-400 font-semibold mt-1 block">Tablets, vials & syrups</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-[#2e1d08] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Low Stock Warnings</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{lowStockCount}</div>
            <span className="text-xs text-amber-400 font-semibold mt-1 block">Below safety threshold</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900 to-[#1e0f36] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dispensary Status</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-300">Ready</div>
            <span className="text-xs text-purple-400 font-semibold mt-1 block">E-Prescription connected</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by drug name or generic formula..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-teal-400"
            />
          </div>

          {/* Category Dropdown / Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 flex items-center mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-teal-400" /> Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-teal-400"
            >
              {categories.map((c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medicine Inventory Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-9 h-9 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400">Loading pharmaceutical stock...</p>
              </div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No medicines match your search filter</p>
                <p className="text-xs text-slate-500 mt-1">Click "Add New Medicine" above to add new drugs.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-4">Medicine & Formulation</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Manufacturer</th>
                    <th className="px-5 py-4">Current Stock</th>
                    <th className="px-5 py-4">Unit Price</th>
                    <th className="px-5 py-4">Rx Type</th>
                    <th className="px-5 py-4">Inventory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {medicines.map((med, idx) => {
                    const isLowStock = (med.current_stock || 0) <= (med.min_stock_level || 15)
                    return (
                      <motion.tr
                        key={med.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="hover:bg-slate-850/60 transition"
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0 shadow-sm">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-white block text-sm">{med.name}</span>
                              <span className="text-[11px] text-slate-400 font-normal">{med.generic_name || 'Standard Formula'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-cyan-300">
                            {med.category || 'General'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-400 text-xs">
                          {med.manufacturer || 'Standard Labs'}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`font-extrabold text-sm ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {med.current_stock ?? 0}
                          </span>
                          <span className="text-slate-500 text-[11px] ml-1">{med.unit || 'units'}</span>
                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-400 text-sm">
                          ${parseFloat(med.unit_price || 0).toFixed(2)}
                        </td>

                        <td className="px-5 py-4">
                          {med.requires_prescription !== false ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                              Rx Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                              OTC
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {isLowStock ? (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase inline-flex items-center shadow-sm">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase inline-flex items-center shadow-sm">
                              <Check className="w-3 h-3 mr-1" />
                              In Stock
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MULTI-COLOR "ADD MEDICINE" MODAL DIALOG */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="glass-panel max-w-2xl w-full rounded-3xl p-6 sm:p-8 border-2 border-teal-500/40 shadow-2xl shadow-teal-950/80 bg-gradient-to-b from-slate-900 via-[#0a1b2d] to-slate-950 relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Add Medicine to Inventory</h2>
                    <p className="text-xs text-teal-400 mt-0.5">Enter pharmaceutical catalog details</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setErrorMsg('')
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Add Medicine Form */}
              <form onSubmit={handleAddMedicine} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg"
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Generic Formula / Chemical Name
                    </label>
                    <input
                      type="text"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      placeholder="e.g. Acetaminophen, Amoxicillin Trihydrate"
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Therapeutic Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-400"
                    >
                      {categories.filter(c => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Manufacturer / Pharma Brand
                    </label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="e.g. Cipla, Sun Pharma, Abbott"
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2.5 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Unit Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="4.50"
                      className="w-full px-3 py-2.5 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Dosage Form
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-400"
                    >
                      <option value="tablets">Tablets</option>
                      <option value="capsules">Capsules</option>
                      <option value="syrup">Syrup (ml)</option>
                      <option value="injection">Injection (Vials)</option>
                      <option value="ointment">Ointment</option>
                      <option value="drops">Drops</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <label className="flex items-center text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresPrescription}
                      onChange={(e) => setRequiresPrescription(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-teal-500 mr-2 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    Requires Doctor Digital Prescription (Rx Required)
                  </label>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                        <span>Saving to Catalog...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Save Medicine</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
