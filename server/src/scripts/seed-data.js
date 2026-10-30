// Demo data for the seed script: every clinic, doctor and price is fictional.
import { specialties } from '../../../shared/constants.js'

const consult = (spec, price) => ({
  id: `${spec}-consult`,
  specialty: spec,
  name: {
    kk: `${specialties.find((s) => s.id === spec).name.kk} кеңесі`,
    ru: `Консультация: ${specialties.find((s) => s.id === spec).name.ru.toLowerCase()}`,
  },
  price,
  duration: 30,
})

export const clinics = [
  {
    id: 'duman',
    name: 'Duman Clinic',
    featured: true,
    verified: true,
    color: 'from-navy to-brand',
    description: {
      kk: 'Отбасылық медицина орталығы: ересектер мен балаларға арналған кешенді қабылдау, зертхана және УДЗ.',
      ru: 'Центр семейной медицины: комплексный приём взрослых и детей, лаборатория и УЗИ.',
    },
    phone: '+7 717 200 10 10',
    hours: { kk: 'Дс–Сб, 08:00–20:00', ru: 'Пн–Сб, 08:00–20:00' },
    branches: [
      { id: 'duman-1', district: 'esil', address: { kk: 'Қабанбай батыр даңғ., 11', ru: 'пр. Кабанбай батыра, 11' } },
      { id: 'duman-2', district: 'saryarka', address: { kk: 'Сарыарқа даңғ., 24', ru: 'пр. Сарыарка, 24' } },
    ],
    services: [
      consult('therapist', 9000),
      consult('pediatrician', 10000),
      consult('cardiologist', 14000),
      { id: 'ecg', specialty: 'cardiologist', name: { kk: 'ЭКГ', ru: 'ЭКГ' }, price: 5000, duration: 20 },
    ],
    doctors: [
      { id: 'd1', name: 'Айгерім Серікқызы', specialty: 'therapist', experience: 12, branches: ['duman-1', 'duman-2'] },
      { id: 'd2', name: 'Ерлан Төлеуов', specialty: 'cardiologist', experience: 18, branches: ['duman-1'] },
      { id: 'd3', name: 'Мадина Ахметова', specialty: 'pediatrician', experience: 9, branches: ['duman-2'] },
    ],
  },
  {
    id: 'saule',
    name: 'Сәуле Медикал',
    featured: true,
    verified: true,
    color: 'from-brand to-mint',
    description: {
      kk: 'Әйелдер денсаулығы және педиатрия бойынша мамандандырылған клиника.',
      ru: 'Клиника, специализирующаяся на женском здоровье и педиатрии.',
    },
    phone: '+7 717 200 20 20',
    hours: { kk: 'Күн сайын, 09:00–21:00', ru: 'Ежедневно, 09:00–21:00' },
    branches: [
      { id: 'saule-1', district: 'almaty', address: { kk: 'Тәуелсіздік даңғ., 33', ru: 'пр. Тауелсиздик, 33' } },
    ],
    services: [
      consult('gynecologist', 12000),
      consult('pediatrician', 11000),
      { id: 'us-pelvic', specialty: 'gynecologist', name: { kk: 'Кіші жамбас УДЗ', ru: 'УЗИ малого таза' }, price: 10000, duration: 30 },
    ],
    doctors: [
      { id: 'd4', name: 'Гүлнар Омарова', specialty: 'gynecologist', experience: 15, branches: ['saule-1'] },
      { id: 'd5', name: 'Асель Жұмабаева', specialty: 'pediatrician', experience: 7, branches: ['saule-1'] },
    ],
  },
  {
    id: 'aqzhol',
    name: 'Ақ Жол Дент',
    featured: true,
    verified: true,
    color: 'from-mint to-brand',
    description: {
      kk: 'Заманауи жабдықталған стоматология: емдеу, гигиена, балалар стоматологиясы.',
      ru: 'Современная стоматология: лечение, гигиена, детская стоматология.',
    },
    phone: '+7 717 200 30 30',
    hours: { kk: 'Дс–Жм, 09:00–19:00', ru: 'Пн–Пт, 09:00–19:00' },
    branches: [
      { id: 'aqzhol-1', district: 'esil', address: { kk: 'Мәңгілік Ел даңғ., 40', ru: 'пр. Мангилик Ел, 40' } },
      { id: 'aqzhol-2', district: 'nura', address: { kk: 'Тұран даңғ., 55', ru: 'пр. Туран, 55' } },
    ],
    services: [
      consult('dentist', 5000),
      { id: 'cleaning', specialty: 'dentist', name: { kk: 'Кәсіби гигиена', ru: 'Профессиональная гигиена' }, price: 18000, duration: 60 },
      { id: 'filling', specialty: 'dentist', name: { kk: 'Пломба қою', ru: 'Пломбирование' }, price: 22000, duration: 60 },
    ],
    doctors: [
      { id: 'd6', name: 'Нұрлан Қасымов', specialty: 'dentist', experience: 11, branches: ['aqzhol-1', 'aqzhol-2'] },
      { id: 'd7', name: 'Дана Әлімова', specialty: 'dentist', experience: 5, branches: ['aqzhol-2'] },
    ],
  },
  {
    id: 'neuro',
    name: 'NeuroCare Astana',
    featured: false,
    verified: true,
    color: 'from-navy to-mint',
    description: {
      kk: 'Неврология және ЛОР бойынша кеңестер, диагностика.',
      ru: 'Консультации и диагностика по неврологии и ЛОР.',
    },
    phone: '+7 717 200 40 40',
    hours: { kk: 'Дс–Сб, 08:30–18:00', ru: 'Пн–Сб, 08:30–18:00' },
    branches: [
      { id: 'neuro-1', district: 'baikonyr', address: { kk: 'Абай даңғ., 7', ru: 'пр. Абая, 7' } },
    ],
    services: [consult('neurologist', 13000), consult('ent', 10000)],
    doctors: [
      { id: 'd8', name: 'Бауыржан Сейітов', specialty: 'neurologist', experience: 20, branches: ['neuro-1'] },
      { id: 'd9', name: 'Жанар Байжанова', specialty: 'ent', experience: 8, branches: ['neuro-1'] },
    ],
  },
  {
    id: 'koz',
    name: 'Көз Нұры',
    featured: false,
    verified: true,
    sponsored: true,
    color: 'from-brand to-navy',
    description: {
      kk: 'Офтальмология орталығы: көру қабілетін тексеру, линза таңдау.',
      ru: 'Офтальмологический центр: проверка зрения, подбор линз.',
    },
    phone: '+7 717 200 50 50',
    hours: { kk: 'Дс–Жм, 10:00–19:00', ru: 'Пн–Пт, 10:00–19:00' },
    branches: [
      { id: 'koz-1', district: 'almaty', address: { kk: 'Республика даңғ., 18', ru: 'пр. Республики, 18' } },
    ],
    services: [
      consult('ophthalmologist', 9500),
      { id: 'lens', specialty: 'ophthalmologist', name: { kk: 'Линза таңдау', ru: 'Подбор линз' }, price: 7000, duration: 30 },
    ],
    doctors: [
      { id: 'd10', name: 'Самал Мұратова', specialty: 'ophthalmologist', experience: 10, branches: ['koz-1'] },
    ],
  },
  {
    id: 'family',
    name: 'Family Health',
    featured: false,
    verified: true,
    color: 'from-mint to-navy',
    description: {
      kk: 'Отбасылық дәрігерлер және кардиология, қолжетімді бағалар.',
      ru: 'Семейные врачи и кардиология по доступным ценам.',
    },
    phone: '+7 717 200 60 60',
    hours: { kk: 'Дс–Сб, 08:00–19:00', ru: 'Пн–Сб, 08:00–19:00' },
    branches: [
      { id: 'family-1', district: 'nura', address: { kk: 'Қошқарбаев даңғ., 2', ru: 'пр. Кошкарбаева, 2' } },
      { id: 'family-2', district: 'saryarka', address: { kk: 'Бөгенбай батыр даңғ., 60', ru: 'пр. Богенбай батыра, 60' } },
    ],
    services: [consult('therapist', 7000), consult('cardiologist', 12000)],
    doctors: [
      { id: 'd11', name: 'Арман Ибраев', specialty: 'therapist', experience: 6, branches: ['family-1', 'family-2'] },
      { id: 'd12', name: 'Сая Нұрланқызы', specialty: 'cardiologist', experience: 14, branches: ['family-2'] },
    ],
  },
]
