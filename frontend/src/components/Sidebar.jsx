import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard, Users, Calendar, FileText, Activity,
  Pill, FlaskConical, Bed, CreditCard, MessageSquare,
  ShieldCheck, UserCog, HeartPulse, Sparkles, Video, Bot
} from 'lucide-react'
import { getUserRoles, hasAnyRole } from '../utils/auth'

/** Returns the correct dashboard path for a given primary role. */
function getDashboardPath(role) {
  switch (role) {
    case 'admin':          return '/admin/dashboard'
    case 'doctor':         return '/doctor/dashboard'
    case 'nurse':          return '/nurse/dashboard'
    case 'receptionist':   return '/receptionist/dashboard'
    case 'pharmacist':     return '/pharmacy/dashboard'
    case 'lab_technician': return '/laboratory/dashboard'
    case 'patient':        return '/patient/dashboard'
    default:               return '/dashboard'
  }
}

export default function Sidebar({ isOpen, onClose }) {
  const user = useSelector((state) => state.auth.user)
  const userRoles = getUserRoles(user)
  const primaryRole = user?.primary_role || userRoles[0] || 'patient'

  const navItems = [
    { name: 'Dashboard', path: getDashboardPath(primaryRole), icon: LayoutDashboard, color: 'text-emerald-400', activeBg: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/40 text-emerald-300', roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'patient'] },
    { name: 'Staff Management', path: '/admin/staff', icon: UserCog, color: 'text-purple-400', activeBg: 'from-purple-500/20 to-indigo-600/20 border-purple-500/40 text-purple-300', roles: ['admin'] },
    { name: 'Patients Directory', path: '/patients', icon: Users, color: 'text-blue-400', activeBg: 'from-blue-500/20 to-cyan-600/20 border-blue-500/40 text-blue-300', roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { name: 'Appointments & Video', path: '/appointments', icon: Calendar, color: 'text-cyan-400', activeBg: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40 text-cyan-300', roles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient'] },
    { name: 'Prescriptions (Rx)', path: '/prescriptions', icon: Pill, color: 'text-purple-400', activeBg: 'from-purple-500/20 to-pink-600/20 border-purple-500/40 text-purple-300', roles: ['admin', 'doctor', 'pharmacist', 'patient'] },
    { name: 'Pharmacy Inventory', path: '/pharmacy', icon: Activity, color: 'text-amber-400', activeBg: 'from-amber-500/20 to-orange-600/20 border-amber-500/40 text-amber-300', roles: ['admin', 'pharmacist'] },
    { name: 'Pathology Lab', path: '/laboratory', icon: FlaskConical, color: 'text-emerald-400', activeBg: 'from-emerald-500/20 to-green-600/20 border-emerald-500/40 text-emerald-300', roles: ['admin', 'doctor', 'lab_technician', 'patient'] },
    { name: 'Inpatient Beds & ICU', path: '/admissions', icon: Bed, color: 'text-rose-400', activeBg: 'from-rose-500/20 to-pink-600/20 border-rose-500/40 text-rose-300', roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { name: 'Billing & Invoices', path: '/billing', icon: CreditCard, color: 'text-amber-400', activeBg: 'from-amber-500/20 to-yellow-600/20 border-amber-500/40 text-amber-300', roles: ['admin', 'receptionist', 'patient'] },
    { name: 'Hospital Chat', path: '/chat', icon: MessageSquare, color: 'text-teal-400', activeBg: 'from-teal-500/20 to-cyan-600/20 border-teal-500/40 text-teal-300', roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'patient'] },
    { name: 'ArogyaAI Assistant', path: '/arogya-ai', icon: Bot, color: 'text-indigo-400', activeBg: 'from-indigo-500/20 to-purple-600/20 border-indigo-500/40 text-indigo-300', roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'patient'] },
  ]

  const filteredNav = navItems.filter(item => hasAnyRole(user, item.roles))

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#080e22]/95 backdrop-blur-2xl border-r border-slate-800/80 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="h-18 flex items-center px-5 border-b border-slate-800/80 bg-[#060b1b]">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mr-3">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center">
            Arogya<span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent font-black ml-1">HMS</span>
          </h1>
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
            Smart Telehealth Network
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          Hospital Workspace
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group border ${
                  isActive
                    ? `bg-gradient-to-r ${item.activeBg} shadow-lg`
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User / Role Footer (Multi-Color Badge) */}
      <div className="p-4 border-t border-slate-800/80 bg-[#060b1b]/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-purple-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white uppercase shadow-md">
            {user?.first_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Medical Staff'}</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-950 to-purple-950 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider mt-0.5">
              {primaryRole.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
