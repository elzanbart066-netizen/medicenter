import { createContext, useContext, useEffect, useState } from 'react'

const dict = {
  kk: {
    tagline: 'Денсаулыққа бірге қадам',
    navHome: 'Басты бет',
    navClinics: 'Клиникалар',
    navForClinics: 'Клиникаларға',
    signIn: 'Кіру',
    heroTitle: 'Астанадағы клиника мен дәрігерді бір жерден табыңыз',
    heroText: 'Мамандықты, ауданды және бағаны салыстырып, қабылдауға бірнеше минутта жазылыңыз.',
    searchPlaceholder: 'Дәрігер, мамандық немесе клиника',
    allDistricts: 'Барлық аудандар',
    search: 'Іздеу',
    popularSpecialties: 'Танымал мамандықтар',
    featured: 'Ұсынылған клиникалар',
    featuredNote: 'Платформа әкімшісі тексерген клиникалар',
    seeAll: 'Барлығын көру',
    howTitle: 'Қалай жұмыс істейді?',
    how1: 'Іздеңіз', how1t: 'Мамандық, аудан немесе қызмет бойынша сүзіңіз.',
    how2: 'Салыстырыңыз', how2t: 'Дәрігерлерді, бағаларды және бос уақытты қараңыз.',
    how3: 'Жазылыңыз', how3t: 'Ыңғайлы уақытты таңдап, жазылуды растаңыз.',
    clinicsCount: 'клиника',
    doctorsCount: 'дәрігер',
    filters: 'Сүзгілер',
    specialty: 'Мамандық',
    allSpecialties: 'Барлық мамандықтар',
    district: 'Аудан',
    maxPrice: 'Бағасы (дейін)',
    any: 'Кез келген',
    reset: 'Тазалау',
    found: 'Табылды',
    nothingFound: 'Ештеңе табылмады. Сүзгілерді өзгертіп көріңіз.',
    verified: 'Тексерілген',
    ad: 'Жарнама',
    details: 'Толығырақ',
    book: 'Жазылу',
    about: 'Клиника туралы',
    branches: 'Филиалдар',
    doctors: 'Дәрігерлер',
    services: 'Қызметтер мен бағалар',
    experience: 'жыл тәжірибе',
    minutes: 'мин',
    workHours: 'Жұмыс уақыты',
    reviewsNone: 'Пікірлер аяқталған қабылдаудан кейін ғана пайда болады.',
    bookingTitle: 'Қабылдауға жазылу',
    step: 'Қадам',
    stepBranch: 'Филиал мен дәрігер',
    stepService: 'Қызмет',
    stepTime: 'Күн мен уақыт',
    stepContact: 'Байланыс деректері',
    chooseBranch: 'Филиалды таңдаңыз',
    chooseDoctor: 'Дәрігерді таңдаңыз',
    chooseService: 'Қызметті таңдаңыз',
    chooseDate: 'Күнді таңдаңыз',
    chooseTime: 'Бос уақытты таңдаңыз',
    noSlots: 'Бұл күні бос уақыт жоқ.',
    next: 'Әрі қарай',
    back: 'Артқа',
    confirm: 'Жазылуды растау',
    fullName: 'Аты-жөні',
    phone: 'Телефон',
    email: 'Email (міндетті емес)',
    iin: 'ЖСН (міндетті емес)',
    comment: 'Шағым немесе түсініктеме',
    consent: 'Дербес деректерді өңдеуге келісемін',
    summary: 'Жазылу мәліметтері',
    successTitle: 'Сіз сәтті жазылдыңыз!',
    successText: 'Клиника әкімшісі жазылуды растағаннан кейін сізге хабарлама келеді.',
    toHome: 'Басты бетке',
    demo: 'Демо нұсқа: клиникалар мен дәрігерлер ойдан шығарылған, жазылу серверге жіберілмейді.',
    notFound: 'Бет табылмады',
    footerText: 'Астана қаласындағы медициналық орталықтарды іздеу және қабылдауға жазылу платформасы.',
    footerDisclaimer: 'Платформа диагноз қоймайды және дәрігердің кеңесін алмастырмайды.',
    errName: 'Аты-жөнін кемінде 2 әріппен енгізіңіз',
    errPhone: 'Телефон +7 7XX XXX XX XX форматында болуы керек',
    errEmail: 'Email форматы дұрыс емес',
    errIin: 'ЖСН 12 цифрдан тұруы керек',
    errComment: 'Түсініктеме 300 таңбадан аспауы керек',
    errConsent: 'Келісім белгісін қойыңыз',
  },
  ru: {
    tagline: 'Шаг к здоровью вместе',
    navHome: 'Главная',
    navClinics: 'Клиники',
    navForClinics: 'Для клиник',
    signIn: 'Войти',
    heroTitle: 'Клиники и врачи Астаны в одном месте',
    heroText: 'Сравните специальность, район и цены и запишитесь на приём за пару минут.',
    searchPlaceholder: 'Врач, специальность или клиника',
    allDistricts: 'Все районы',
    search: 'Найти',
    popularSpecialties: 'Популярные специальности',
    featured: 'Рекомендуемые клиники',
    featuredNote: 'Клиники, проверенные администратором платформы',
    seeAll: 'Смотреть все',
    howTitle: 'Как это работает?',
    how1: 'Найдите', how1t: 'Фильтруйте по специальности, району или услуге.',
    how2: 'Сравните', how2t: 'Смотрите врачей, цены и свободное время.',
    how3: 'Запишитесь', how3t: 'Выберите удобное время и подтвердите запись.',
    clinicsCount: 'клиник',
    doctorsCount: 'врачей',
    filters: 'Фильтры',
    specialty: 'Специальность',
    allSpecialties: 'Все специальности',
    district: 'Район',
    maxPrice: 'Цена (до)',
    any: 'Любая',
    reset: 'Сбросить',
    found: 'Найдено',
    nothingFound: 'Ничего не найдено. Попробуйте изменить фильтры.',
    verified: 'Проверено',
    ad: 'Реклама',
    details: 'Подробнее',
    book: 'Записаться',
    about: 'О клинике',
    branches: 'Филиалы',
    doctors: 'Врачи',
    services: 'Услуги и цены',
    experience: 'лет опыта',
    minutes: 'мин',
    workHours: 'Часы работы',
    reviewsNone: 'Отзывы появляются только после завершённого приёма.',
    bookingTitle: 'Запись на приём',
    step: 'Шаг',
    stepBranch: 'Филиал и врач',
    stepService: 'Услуга',
    stepTime: 'Дата и время',
    stepContact: 'Контактные данные',
    chooseBranch: 'Выберите филиал',
    chooseDoctor: 'Выберите врача',
    chooseService: 'Выберите услугу',
    chooseDate: 'Выберите дату',
    chooseTime: 'Выберите свободное время',
    noSlots: 'На этот день свободного времени нет.',
    next: 'Далее',
    back: 'Назад',
    confirm: 'Подтвердить запись',
    fullName: 'ФИО',
    phone: 'Телефон',
    email: 'Email (необязательно)',
    iin: 'ИИН (необязательно)',
    comment: 'Жалобы или комментарий',
    consent: 'Согласен(на) на обработку персональных данных',
    summary: 'Детали записи',
    successTitle: 'Вы успешно записаны!',
    successText: 'Вы получите уведомление, когда администратор клиники подтвердит запись.',
    toHome: 'На главную',
    demo: 'Демо-версия: клиники и врачи вымышлены, запись не отправляется на сервер.',
    notFound: 'Страница не найдена',
    footerText: 'Платформа поиска медицинских центров Астаны и записи на приём.',
    footerDisclaimer: 'Платформа не ставит диагнозы и не заменяет консультацию врача.',
    errName: 'Введите ФИО, минимум 2 буквы',
    errPhone: 'Телефон должен быть в формате +7 7XX XXX XX XX',
    errEmail: 'Неверный формат email',
    errIin: 'ИИН должен состоять из 12 цифр',
    errComment: 'Комментарий не должен превышать 300 символов',
    errConsent: 'Отметьте согласие',
  },
}

const weekdays = {
  kk: ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
}

const months = {
  kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
}

const LangContext = createContext(null)

function initialLang() {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'kk' || saved === 'ru') return saved
  } catch {}
  return 'kk'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('lang', lang) } catch {}
  }, [lang])

  // t('key') for UI strings, tr({ kk, ru }) for bilingual data fields
  const t = (key) => dict[lang][key] ?? key
  const tr = (value) => (typeof value === 'string' ? value : value[lang])

  const price = (n) => `${n.toLocaleString('ru-RU')} ₸`
  const priceFrom = (n) => (lang === 'kk' ? `${price(n)} бастап` : `от ${price(n)}`)

  // Formatted by hand: some browsers ship without Kazakh locale data.
  const weekday = (d) => weekdays[lang][d.getDay()]
  const longDate = (d) => `${d.getDate()} ${months[lang][d.getMonth()]}, ${weekday(d)}`

  return <LangContext.Provider value={{ lang, setLang, t, tr, price, priceFrom, weekday, longDate }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
