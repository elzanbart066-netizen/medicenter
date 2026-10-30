import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth.jsx'
import { Loading } from '../../components/ui.jsx'
import PatientCabinet from './PatientCabinet.jsx'
import DoctorCabinet from './DoctorCabinet.jsx'
import ClinicCabinet from './ClinicCabinet.jsx'
import AdminCabinet from './AdminCabinet.jsx'

const byRole = {
  patient: PatientCabinet,
  doctor: DoctorCabinet,
  clinic_admin: ClinicCabinet,
  platform_admin: AdminCabinet,
}

export default function Cabinet() {
  const { user, ready } = useAuth()
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" state={{ from: '/cabinet' }} replace />
  const Page = byRole[user.role]
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <Page user={user} />
    </div>
  )
}

export function CabinetHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-navy md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-100">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${value === id ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
