
export const USE_MOCK = true;


export interface Doctor {
  id: number;
  fullName: string;
  specialization: string;
  photoUrl: string;
  experience: string;
  education: string;
  bio: string;
  centerId: number;
  center: ClinicCenter;
  schedules: DoctorSchedule[];
}

export interface ClinicCenter {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface DoctorSchedule {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMin: number;
}

export interface Service {
  id: number;
  code: string;
  name: string;
  description: string;
  durationMinDefault: number;
  prices: ServicePrice[];
}

export interface ServicePrice {
  id: number;
  centerId: number;
  price: number;
  currency: string;
}

export interface LabTest {
  id: number;
  code: string;
  name: string;
  description: string;
  sampleType: string;
  preparation: string;
  prices: TestPrice[];
}

export interface TestPrice {
  id: number;
  centerId: number;
  price: number;
  currency: string;
}

export interface Patient {
  id: number;
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  gender: string;
  address: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  centerId: number;
  startAt: string;
  durationMin: number;
  status: string;
  createdAt: string;
  sourceChannel: string;
  patient: Patient;
  doctor: Doctor;
  center: ClinicCenter;
  visit?: Visit;
  prediction?: MlPrediction;
}

export interface Visit {
  id: number;
  appointmentId: number;
  complaints: string;
  diagnosis: string;
  examination: string;
  notes: string;
  closedAt: string | null;
  prescriptions: Prescription[];
}

export interface Prescription {
  id: number;
  visitId: number;
  text: string;
  status: string;
  createdAt: string;
}

export interface TestResult {
  id: number;
  patientId: number;
  testId: number;
  result: string;
  unit: string;
  refRange: string;
  status: string;
  takenAt: string;
  readyAt: string | null;
  test: LabTest;
}

export interface Notification {
  id: number;
  appointmentId: number;
  type: string;
  plannedAt: string;
  sentAt: string | null;
  status: string;
}

export interface MlPrediction {
  id: number;
  appointmentId: number;
  noShowProbability: number;
  modelVersion: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
}


export const MOCK_CENTERS: ClinicCenter[] = [
  {
    id: 1,
    code: 'CENTER-1',
    name: 'Медицина на Ленина',
    address: 'г. Воронеж, ул. Ленина, д. 42',
    phone: '+7 (473) 200-10-01',
    email: 'lenina@medecina.ru',
  },
  {
    id: 2,
    code: 'CENTER-2',
    name: 'Медицина на Кирова',
    address: 'г. Воронеж, ул. Кирова, д. 15',
    phone: '+7 (473) 200-10-02',
    email: 'kirova@medecina.ru',
  },
  {
    id: 3,
    code: 'CENTER-3',
    name: 'Медицина на Плехановской',
    address: 'г. Воронеж, ул. Плехановская, д. 53',
    phone: '+7 (473) 200-10-03',
    email: 'plekhanovskaya@medecina.ru',
  },
];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 1,
    fullName: 'Иванова Анна Сергеевна',
    specialization: 'Терапевт',
    photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    experience: '15 лет',
    education: 'ВГМУ им. Н.Н. Бурденко',
    bio: 'Врач высшей категории. Специализация на диагностике и лечении заболеваний внутренних органов.',
    centerId: 1,
    center: MOCK_CENTERS[0],
    schedules: [
      { id: 1, doctorId: 1, dayOfWeek: 0, startTime: '09:00', endTime: '17:00', slotMin: 30 },
      { id: 2, doctorId: 1, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotMin: 30 },
      { id: 3, doctorId: 1, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotMin: 30 },
      { id: 4, doctorId: 1, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotMin: 30 },
      { id: 5, doctorId: 1, dayOfWeek: 4, startTime: '09:00', endTime: '14:00', slotMin: 30 },
    ],
  },
  {
    id: 2,
    fullName: 'Петров Дмитрий Александрович',
    specialization: 'Кардиолог',
    photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    experience: '12 лет',
    education: 'Первый МГМУ им. И.М. Сеченова',
    bio: 'Кандидат медицинских наук. Специалист по заболеваниям сердечно-сосудистой системы.',
    centerId: 1,
    center: MOCK_CENTERS[0],
    schedules: [
      { id: 6, doctorId: 2, dayOfWeek: 0, startTime: '10:00', endTime: '18:00', slotMin: 30 },
      { id: 7, doctorId: 2, dayOfWeek: 2, startTime: '10:00', endTime: '18:00', slotMin: 30 },
      { id: 8, doctorId: 2, dayOfWeek: 4, startTime: '10:00', endTime: '16:00', slotMin: 30 },
    ],
  },
  {
    id: 3,
    fullName: 'Смирнова Елена Викторовна',
    specialization: 'Невролог',
    photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    experience: '8 лет',
    education: 'РНИМУ им. Н.И. Пирогова',
    bio: 'Специалист по заболеваниям нервной системы, головным болям и нарушениям сна.',
    centerId: 2,
    center: MOCK_CENTERS[1],
    schedules: [
      { id: 9, doctorId: 3, dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotMin: 45 },
      { id: 10, doctorId: 3, dayOfWeek: 3, startTime: '08:00', endTime: '16:00', slotMin: 45 },
    ],
  },
  {
    id: 4,
    fullName: 'Козлов Артём Игоревич',
    specialization: 'Хирург',
    photoUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
    experience: '20 лет',
    education: 'ВМА им. С.М. Кирова',
    bio: 'Доктор медицинских наук, хирург высшей категории.',
    centerId: 2,
    center: MOCK_CENTERS[1],
    schedules: [
      { id: 11, doctorId: 4, dayOfWeek: 0, startTime: '09:00', endTime: '15:00', slotMin: 60 },
      { id: 12, doctorId: 4, dayOfWeek: 2, startTime: '09:00', endTime: '15:00', slotMin: 60 },
      { id: 13, doctorId: 4, dayOfWeek: 4, startTime: '09:00', endTime: '13:00', slotMin: 60 },
    ],
  },
  {
    id: 5,
    fullName: 'Новикова Мария Андреевна',
    specialization: 'Дерматолог',
    photoUrl: 'https://randomuser.me/api/portraits/women/90.jpg',
    experience: '6 лет',
    education: 'ВГМУ им. Н.Н. Бурденко',
    bio: 'Специализация — дерматоскопия, лечение аллергических и воспалительных заболеваний кожи.',
    centerId: 3,
    center: MOCK_CENTERS[2],
    schedules: [
      { id: 14, doctorId: 5, dayOfWeek: 1, startTime: '10:00', endTime: '18:00', slotMin: 30 },
      { id: 15, doctorId: 5, dayOfWeek: 3, startTime: '10:00', endTime: '18:00', slotMin: 30 },
      { id: 16, doctorId: 5, dayOfWeek: 4, startTime: '10:00', endTime: '14:00', slotMin: 30 },
    ],
  },
  {
    id: 6,
    fullName: 'Фёдоров Олег Николаевич',
    specialization: 'Офтальмолог',
    photoUrl: 'https://randomuser.me/api/portraits/men/46.jpg',
    experience: '10 лет',
    education: 'Курский ГМУ',
    bio: 'Специалист по диагностике и лечению заболеваний органов зрения.',
    centerId: 3,
    center: MOCK_CENTERS[2],
    schedules: [
      { id: 17, doctorId: 6, dayOfWeek: 0, startTime: '08:30', endTime: '16:30', slotMin: 30 },
      { id: 18, doctorId: 6, dayOfWeek: 2, startTime: '08:30', endTime: '16:30', slotMin: 30 },
    ],
  },
];

const now = new Date();
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};
const dayAt = (offset: number, h: number, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const MOCK_PATIENTS: Patient[] = [
  { id: 1, fullName: 'Сидоров Иван Петрович', birthDate: '1985-03-15', phone: '+7 (900) 111-22-33', email: 'sidorov@mail.ru', gender: 'male', address: 'г. Воронеж, ул. Мира, д. 10' },
  { id: 2, fullName: 'Кузнецова Ольга Дмитриевна', birthDate: '1992-07-22', phone: '+7 (900) 222-33-44', email: 'kuznetsova@mail.ru', gender: 'female', address: 'г. Воронеж, пр. Революции, д. 25' },
  { id: 3, fullName: 'Морозов Алексей Владимирович', birthDate: '1978-11-08', phone: '+7 (900) 333-44-55', email: 'morozov@mail.ru', gender: 'male', address: 'г. Воронеж, ул. Кольцовская, д. 5' },
  { id: 4, fullName: 'Волкова Татьяна Сергеевна', birthDate: '2001-01-30', phone: '+7 (900) 444-55-66', email: 'volkova@mail.ru', gender: 'female', address: 'г. Воронеж, ул. 20-летия Октября, д. 88' },
  { id: 5, fullName: 'Лебедев Максим Юрьевич', birthDate: '1995-06-12', phone: '+7 (900) 555-66-77', email: 'lebedev@mail.ru', gender: 'male', address: 'г. Воронеж, ул. Ворошилова, д. 32' },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 1, patientId: 1, doctorId: 1, centerId: 1,
    startAt: dayAt(1, 10, 0), durationMin: 30, status: 'confirmed',
    createdAt: day(-2), sourceChannel: 'web',
    patient: MOCK_PATIENTS[0], doctor: MOCK_DOCTORS[0], center: MOCK_CENTERS[0],
    prediction: { id: 1, appointmentId: 1, noShowProbability: 0.12, modelVersion: 'v1.0' },
  },
  {
    id: 2, patientId: 2, doctorId: 2, centerId: 1,
    startAt: dayAt(1, 14, 30), durationMin: 30, status: 'confirmed',
    createdAt: day(-1), sourceChannel: 'phone',
    patient: MOCK_PATIENTS[1], doctor: MOCK_DOCTORS[1], center: MOCK_CENTERS[0],
    prediction: { id: 2, appointmentId: 2, noShowProbability: 0.05, modelVersion: 'v1.0' },
  },
  {
    id: 3, patientId: 3, doctorId: 3, centerId: 2,
    startAt: dayAt(2, 9, 0), durationMin: 45, status: 'pending',
    createdAt: day(-1), sourceChannel: 'web',
    patient: MOCK_PATIENTS[2], doctor: MOCK_DOCTORS[2], center: MOCK_CENTERS[1],
    prediction: { id: 3, appointmentId: 3, noShowProbability: 0.35, modelVersion: 'v1.0' },
  },
  {
    id: 4, patientId: 4, doctorId: 1, centerId: 1,
    startAt: dayAt(3, 11, 0), durationMin: 30, status: 'pending',
    createdAt: day(0), sourceChannel: 'admin',
    patient: MOCK_PATIENTS[3], doctor: MOCK_DOCTORS[0], center: MOCK_CENTERS[0],
    prediction: { id: 4, appointmentId: 4, noShowProbability: 0.08, modelVersion: 'v1.0' },
  },
  {
    id: 5, patientId: 1, doctorId: 4, centerId: 2,
    startAt: dayAt(-3, 15, 0), durationMin: 60, status: 'completed',
    createdAt: day(-10), sourceChannel: 'web',
    patient: MOCK_PATIENTS[0], doctor: MOCK_DOCTORS[3], center: MOCK_CENTERS[1],
    visit: {
      id: 1, appointmentId: 5, complaints: 'Боль в правом подреберье', diagnosis: 'Желчнокаменная болезнь',
      examination: 'При пальпации — болезненность в правом подреберье', notes: 'Направлен на УЗИ',
      closedAt: dayAt(-3, 16, 0), prescriptions: [
        { id: 1, visitId: 1, text: 'Урсодезоксихолевая кислота 250мг 2р/д — 30 дней', status: 'active', createdAt: dayAt(-3, 16, 0) },
        { id: 2, visitId: 1, text: 'Диета стол №5', status: 'active', createdAt: dayAt(-3, 16, 0) },
      ],
    },
  },
  {
    id: 6, patientId: 2, doctorId: 5, centerId: 3,
    startAt: dayAt(-1, 12, 0), durationMin: 30, status: 'completed',
    createdAt: day(-5), sourceChannel: 'web',
    patient: MOCK_PATIENTS[1], doctor: MOCK_DOCTORS[4], center: MOCK_CENTERS[2],
    visit: {
      id: 2, appointmentId: 6, complaints: 'Сыпь на руках', diagnosis: 'Контактный дерматит',
      examination: 'Эритематозные высыпания на кистях рук', notes: '',
      closedAt: dayAt(-1, 12, 30), prescriptions: [
        { id: 3, visitId: 2, text: 'Мометазон крем 0.1% — 2р/д 14 дней', status: 'active', createdAt: dayAt(-1, 12, 30) },
      ],
    },
  },
  {
    id: 7, patientId: 5, doctorId: 2, centerId: 1,
    startAt: dayAt(-5, 10, 0), durationMin: 30, status: 'no_show',
    createdAt: day(-8), sourceChannel: 'phone',
    patient: MOCK_PATIENTS[4], doctor: MOCK_DOCTORS[1], center: MOCK_CENTERS[0],
  },
  {
    id: 8, patientId: 3, doctorId: 6, centerId: 3,
    startAt: dayAt(-2, 9, 30), durationMin: 30, status: 'cancelled',
    createdAt: day(-4), sourceChannel: 'web',
    patient: MOCK_PATIENTS[2], doctor: MOCK_DOCTORS[5], center: MOCK_CENTERS[2],
  },
];

export const MOCK_SERVICES: Service[] = [
  { id: 1, code: 'CONSULT-THER', name: 'Консультация терапевта', description: 'Первичный осмотр, сбор анамнеза, назначение обследований', durationMinDefault: 30, prices: [{ id: 1, centerId: 1, price: 2500, currency: 'RUB' }] },
  { id: 2, code: 'CONSULT-CARD', name: 'Консультация кардиолога', description: 'Осмотр, ЭКГ, интерпретация результатов', durationMinDefault: 30, prices: [{ id: 2, centerId: 1, price: 3500, currency: 'RUB' }] },
  { id: 3, code: 'CONSULT-NEUR', name: 'Консультация невролога', description: 'Неврологический осмотр, оценка рефлексов', durationMinDefault: 45, prices: [{ id: 3, centerId: 2, price: 3200, currency: 'RUB' }] },
  { id: 4, code: 'CONSULT-SURG', name: 'Консультация хирурга', description: 'Осмотр, определение необходимости оперативного лечения', durationMinDefault: 60, prices: [{ id: 4, centerId: 2, price: 4000, currency: 'RUB' }] },
  { id: 5, code: 'CONSULT-DERM', name: 'Консультация дерматолога', description: 'Дерматоскопия, осмотр кожных покровов', durationMinDefault: 30, prices: [{ id: 5, centerId: 3, price: 2800, currency: 'RUB' }] },
  { id: 6, code: 'CONSULT-OPHT', name: 'Консультация офтальмолога', description: 'Проверка зрения, осмотр глазного дна', durationMinDefault: 30, prices: [{ id: 6, centerId: 3, price: 3000, currency: 'RUB' }] },
  { id: 7, code: 'ECG', name: 'ЭКГ', description: 'Электрокардиограмма в 12 отведениях', durationMinDefault: 15, prices: [{ id: 7, centerId: 1, price: 1200, currency: 'RUB' }] },
  { id: 8, code: 'UZI-ABD', name: 'УЗИ брюшной полости', description: 'Ультразвуковое исследование органов брюшной полости', durationMinDefault: 30, prices: [{ id: 8, centerId: 1, price: 2000, currency: 'RUB' }] },
];

export const MOCK_TESTS: LabTest[] = [
  { id: 1, code: 'CBC', name: 'Общий анализ крови (ОАК)', description: 'Развёрнутый клинический анализ крови с лейкоцитарной формулой', sampleType: 'Кровь из вены', preparation: 'Натощак, 8-12 часов голодания', prices: [{ id: 1, centerId: 1, price: 800, currency: 'RUB' }] },
  { id: 2, code: 'BMP', name: 'Биохимия крови (базовая)', description: 'Глюкоза, креатинин, АЛТ, АСТ, билирубин, общий белок', sampleType: 'Кровь из вены', preparation: 'Натощак, исключить жирную пищу за 24ч', prices: [{ id: 2, centerId: 1, price: 1500, currency: 'RUB' }] },
  { id: 3, code: 'UA', name: 'Общий анализ мочи', description: 'Физико-химические свойства, микроскопия осадка', sampleType: 'Моча', preparation: 'Утренняя средняя порция', prices: [{ id: 3, centerId: 1, price: 500, currency: 'RUB' }] },
  { id: 4, code: 'TSH', name: 'ТТГ (тиреотропный гормон)', description: 'Оценка функции щитовидной железы', sampleType: 'Кровь из вены', preparation: 'Натощак, до 10:00', prices: [{ id: 4, centerId: 2, price: 700, currency: 'RUB' }] },
  { id: 5, code: 'LIPID', name: 'Липидный профиль', description: 'Холестерин, ЛПВП, ЛПНП, триглицериды', sampleType: 'Кровь из вены', preparation: 'Натощак, 12 часов голодания', prices: [{ id: 5, centerId: 2, price: 1200, currency: 'RUB' }] },
  { id: 6, code: 'HBA1C', name: 'Гликированный гемоглобин (HbA1c)', description: 'Средний уровень сахара за 3 месяца', sampleType: 'Кровь из вены', preparation: 'Не требуется', prices: [{ id: 6, centerId: 3, price: 900, currency: 'RUB' }] },
];

export const MOCK_TEST_RESULTS: TestResult[] = [
  { id: 1, patientId: 1, testId: 1, result: '5.2', unit: '×10⁹/л', refRange: '4.0-9.0', status: 'ready', takenAt: day(-5), readyAt: day(-4), test: MOCK_TESTS[0] },
  { id: 2, patientId: 1, testId: 2, result: '5.8', unit: 'ммоль/л', refRange: '3.9-6.1', status: 'ready', takenAt: day(-5), readyAt: day(-4), test: MOCK_TESTS[1] },
  { id: 3, patientId: 1, testId: 5, result: '6.2', unit: 'ммоль/л', refRange: '< 5.2', status: 'ready', takenAt: day(-5), readyAt: day(-4), test: MOCK_TESTS[4] },
  { id: 4, patientId: 2, testId: 1, result: '4.8', unit: '×10⁹/л', refRange: '4.0-9.0', status: 'ready', takenAt: day(-3), readyAt: day(-2), test: MOCK_TESTS[0] },
  { id: 5, patientId: 1, testId: 4, result: '', unit: 'мМЕ/л', refRange: '0.4-4.0', status: 'pending', takenAt: day(-1), readyAt: null, test: MOCK_TESTS[3] },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, appointmentId: 1, type: 'reminder_24h', plannedAt: dayAt(0, 10, 0), sentAt: dayAt(0, 10, 0), status: 'sent' },
  { id: 2, appointmentId: 1, type: 'reminder_1h', plannedAt: dayAt(1, 9, 0), sentAt: null, status: 'pending' },
  { id: 3, appointmentId: 2, type: 'confirmation', plannedAt: day(-1), sentAt: day(-1), status: 'sent' },
];


export const MOCK_ANALYTICS = {
  appointmentsByStatus: [
    { status: 'completed', count: 156, label: 'Завершённые' },
    { status: 'confirmed', count: 23, label: 'Подтверждённые' },
    { status: 'pending', count: 12, label: 'Ожидают' },
    { status: 'cancelled', count: 34, label: 'Отменённые' },
    { status: 'no_show', count: 18, label: 'Неявки' },
  ],
  appointmentsByMonth: [
    { month: 'Янв', total: 45, noShow: 4 },
    { month: 'Фев', total: 52, noShow: 6 },
    { month: 'Мар', total: 48, noShow: 3 },
    { month: 'Апр', total: 61, noShow: 5 },
    { month: 'Май', total: 55, noShow: 7 },
    { month: 'Июн', total: 67, noShow: 4 },
    { month: 'Июл', total: 58, noShow: 3 },
    { month: 'Авг', total: 50, noShow: 5 },
    { month: 'Сен', total: 63, noShow: 6 },
    { month: 'Окт', total: 70, noShow: 4 },
    { month: 'Ноя', total: 65, noShow: 3 },
    { month: 'Дек', total: 72, noShow: 2 },
  ],
  doctorLoad: [
    { name: 'Иванова А.С.', appointments: 42, load: 85 },
    { name: 'Петров Д.А.', appointments: 35, load: 72 },
    { name: 'Смирнова Е.В.', appointments: 28, load: 60 },
    { name: 'Козлов А.И.', appointments: 22, load: 48 },
    { name: 'Новикова М.А.', appointments: 31, load: 68 },
    { name: 'Фёдоров О.Н.', appointments: 18, load: 40 },
  ],
  noShowRate: 7.4,
  totalPatients: 243,
  totalAppointments: 706,
  avgWaitDays: 3.2,
};

export const MOCK_CURRENT_USER: User = {
  id: 1,
  email: 'sidorov@mail.ru',
  fullName: 'Сидоров Иван Петрович',
  isActive: true,
  roles: ['patient'],
};

export const MOCK_CURRENT_DOCTOR: User = {
  id: 10,
  email: 'ivanova@medecina.ru',
  fullName: 'Иванова Анна Сергеевна',
  isActive: true,
  roles: ['doctor'],
};

export const MOCK_CURRENT_ADMIN: User = {
  id: 100,
  email: 'admin@medecina.ru',
  fullName: 'Администратор Системы',
  isActive: true,
  roles: ['admin'],
};
