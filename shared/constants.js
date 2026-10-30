// Shared by the frontend and the server seed.

export const specialties = [
  { id: 'therapist', icon: '🩺', name: { kk: 'Терапевт', ru: 'Терапевт' } },
  { id: 'pediatrician', icon: '🧸', name: { kk: 'Педиатр', ru: 'Педиатр' } },
  { id: 'cardiologist', icon: '❤️', name: { kk: 'Кардиолог', ru: 'Кардиолог' } },
  { id: 'dentist', icon: '🦷', name: { kk: 'Стоматолог', ru: 'Стоматолог' } },
  { id: 'neurologist', icon: '🧠', name: { kk: 'Невролог', ru: 'Невролог' } },
  { id: 'gynecologist', icon: '🌸', name: { kk: 'Гинеколог', ru: 'Гинеколог' } },
  { id: 'ophthalmologist', icon: '👁️', name: { kk: 'Офтальмолог', ru: 'Офтальмолог' } },
  { id: 'ent', icon: '👂', name: { kk: 'ЛОР', ru: 'ЛОР' } },
]

export const districts = [
  { id: 'esil', name: { kk: 'Есіл ауданы', ru: 'район Есиль' } },
  { id: 'almaty', name: { kk: 'Алматы ауданы', ru: 'район Алматы' } },
  { id: 'saryarka', name: { kk: 'Сарыарқа ауданы', ru: 'район Сарыарка' } },
  { id: 'baikonyr', name: { kk: 'Байқоңыр ауданы', ru: 'район Байконур' } },
  { id: 'nura', name: { kk: 'Нұра ауданы', ru: 'район Нура' } },
]

export const districtIds = districts.map((d) => d.id)
