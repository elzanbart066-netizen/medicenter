import { useState } from 'react'
import { useLang } from '../../i18n.jsx'
import { useApi } from '../../api.js'
import { ErrorBox, Loading, toDateParam } from '../../components/ui.jsx'
import { specialties } from '../../../shared/constants.js'
import AppointmentCard from './AppointmentCard.jsx'
import { CabinetHeader, Tabs } from './index.jsx'

export default function DoctorCabinet() {
  const { t, tr } = useLang()
  const { data, error, loading } = useApi('/doctor/appointments')
  const [tab, setTab] = useState('upcoming')

  if (loading) return <Loading />
  if (error) return <ErrorBox error={error} />

  const today = toDateParam(new Date())
  const list = data.appointments.filter((a) => (tab === 'upcoming' ? a.startsAt.slice(0, 10) >= today : a.startsAt.slice(0, 10) < today))
  if (tab === 'past') list.reverse()
  const spec = specialties.find((s) => s.id === data.doctor.specialty)

  return (
    <>
      <CabinetHeader title={t('mySchedule')} subtitle={`${data.doctor.name} · ${tr(spec.name)}`} />
      <Tabs tabs={[['upcoming', t('upcoming')], ['past', t('past')]]} value={tab} onChange={setTab} />
      {list.length ? (
        <div className="space-y-4">
          {list.map((a) => <AppointmentCard key={a.id} appt={a} show={['patient']} />)}
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-500">{t('noSchedule')}</div>
      )}
    </>
  )
}
