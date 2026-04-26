
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(email: string, password: string, fullName: string, roleName: string) {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    create: { name: roleName },
    update: {},
  });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: existing.id, roleId: role.id } },
      create: { userId: existing.id, roleId: role.id },
      update: {},
    });
    return existing;
  }
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      profile: { create: {} },
      roles: { create: { roleId: role.id } },
    },
  });
  return user;
}

async function main() {
  console.log('🌱 Seeding database...');

  for (const name of ['admin', 'doctor', 'patient', 'manager']) {
    await prisma.role.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log('✅ Roles');

  const docTypes = [
    { code: 'PASSPORT', name: 'Паспорт РФ' },
    { code: 'SNILS', name: 'СНИЛС' },
    { code: 'POLIS_OMS', name: 'Полис ОМС' },
    { code: 'POLIS_DMS', name: 'Полис ДМС' },
    { code: 'CERT_DOCTOR', name: 'Сертификат врача' },
  ];
  for (const d of docTypes) {
    await prisma.documentType.upsert({ where: { code: d.code }, create: d, update: {} });
  }
  console.log(`✅ Document types: ${docTypes.length}`);

  const admin = await upsertUser(
    'admin@medecina.ru',
    'admin12345',
    'Администратор Системы',
    'admin',
  );
  console.log(`✅ Admin: ${admin.email} / admin12345`);

  const centersData = [
    {
      code: 'MSK-01',
      name: 'Медецина — Центральный',
      address: 'г. Москва, ул. Тверская, 1',
      phone: '+7 (495) 111-11-11',
      email: 'msk-01@medecina.ru',
    },
    {
      code: 'MSK-02',
      name: 'Медецина — Юго-Запад',
      address: 'г. Москва, Ленинский пр-т, 90',
      phone: '+7 (495) 222-22-22',
      email: 'msk-02@medecina.ru',
    },
    {
      code: 'SPB-01',
      name: 'Медецина — Санкт-Петербург',
      address: 'г. Санкт-Петербург, Невский пр-т, 50',
      phone: '+7 (812) 333-33-33',
      email: 'spb-01@medecina.ru',
    },
  ];
  const centers = [];
  for (const c of centersData) {
    centers.push(
      await prisma.clinicCenter.upsert({
        where: { code: c.code },
        create: { ...c, timezone: 'Europe/Moscow' },
        update: {},
      }),
    );
  }
  console.log(`✅ Centers: ${centers.length}`);

  const servicesData = [
    { code: 'CONS-THER', name: 'Консультация терапевта', duration: 30, price: 1500 },
    { code: 'CONS-CARD', name: 'Консультация кардиолога', duration: 45, price: 2500 },
    { code: 'CONS-NEUR', name: 'Консультация невролога', duration: 45, price: 2500 },
    { code: 'CONS-GYN', name: 'Консультация гинеколога', duration: 45, price: 2500 },
    { code: 'CONS-PED', name: 'Консультация педиатра', duration: 30, price: 2000 },
    { code: 'ECG', name: 'Электрокардиография (ЭКГ)', duration: 20, price: 1200 },
    { code: 'ULTRA-ABD', name: 'УЗИ брюшной полости', duration: 30, price: 2800 },
    { code: 'MASSAGE', name: 'Лечебный массаж (сеанс)', duration: 45, price: 1800 },
  ];
  for (const s of servicesData) {
    const svc = await prisma.service.upsert({
      where: { code: s.code },
      create: { code: s.code, name: s.name, durationMinDefault: s.duration },
      update: {},
    });
    for (const center of centers) {
      const existing = await prisma.servicePrice.findFirst({
        where: { serviceId: svc.id, centerId: center.id, isActive: true },
      });
      if (!existing) {
        await prisma.servicePrice.create({
          data: {
            serviceId: svc.id,
            centerId: center.id,
            price: s.price,
            currency: 'RUB',
          },
        });
      }
    }
  }
  console.log(`✅ Services: ${servicesData.length}`);

  const testsData = [
    {
      code: 'CBC',
      name: 'Общий анализ крови',
      sampleType: 'Кровь из вены',
      preparation: 'Натощак',
      price: 650,
    },
    {
      code: 'BIO',
      name: 'Биохимический анализ крови',
      sampleType: 'Кровь из вены',
      preparation: 'Натощак, за 8-12 часов',
      price: 1200,
    },
    {
      code: 'URIN',
      name: 'Общий анализ мочи',
      sampleType: 'Утренняя моча',
      preparation: 'Гигиена перед сбором',
      price: 450,
    },
    {
      code: 'GLUC',
      name: 'Глюкоза крови',
      sampleType: 'Кровь из пальца',
      preparation: 'Натощак',
      price: 350,
    },
    {
      code: 'TSH',
      name: 'Тиреотропный гормон (ТТГ)',
      sampleType: 'Кровь из вены',
      preparation: 'Натощак',
      price: 850,
    },
    {
      code: 'VITD',
      name: 'Витамин D (25-OH)',
      sampleType: 'Кровь из вены',
      preparation: 'Натощак',
      price: 1700,
    },
  ];
  for (const t of testsData) {
    const test = await prisma.labTest.upsert({
      where: { code: t.code },
      create: {
        code: t.code,
        name: t.name,
        sampleType: t.sampleType,
        preparation: t.preparation,
      },
      update: {},
    });
    for (const center of centers) {
      const existing = await prisma.testPrice.findFirst({
        where: { testId: test.id, centerId: center.id, isActive: true },
      });
      if (!existing) {
        await prisma.testPrice.create({
          data: {
            testId: test.id,
            centerId: center.id,
            price: t.price,
            currency: 'RUB',
          },
        });
      }
    }
  }
  console.log(`✅ Lab tests: ${testsData.length}`);

  const doctorsData = [
    {
      email: 'ivanova@medecina.ru',
      fullName: 'Иванова Анна Сергеевна',
      specialization: 'Терапевт',
      experience: '15 лет',
      education: 'ВГМУ им. Н.Н. Бурденко',
      bio: 'Врач высшей категории.',
      centerIdx: 0,
      photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      schedule: [
        { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '14:00' },
      ],
    },
    {
      email: 'petrov@medecina.ru',
      fullName: 'Петров Дмитрий Александрович',
      specialization: 'Кардиолог',
      experience: '12 лет',
      education: 'Первый МГМУ им. И.М. Сеченова',
      bio: 'Кандидат медицинских наук.',
      centerIdx: 0,
      photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      schedule: [
        { dayOfWeek: 0, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
      ],
    },
    {
      email: 'smirnova@medecina.ru',
      fullName: 'Смирнова Елена Викторовна',
      specialization: 'Невролог',
      experience: '8 лет',
      education: 'РНИМУ им. Н.И. Пирогова',
      bio: 'Специалист по заболеваниям нервной системы.',
      centerIdx: 1,
      photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
      schedule: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
      ],
    },
    {
      email: 'kozlov@medecina.ru',
      fullName: 'Козлов Артём Игоревич',
      specialization: 'Хирург',
      experience: '20 лет',
      education: 'ВМА им. С.М. Кирова',
      bio: 'Доктор медицинских наук.',
      centerIdx: 1,
      photoUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
      schedule: [
        { dayOfWeek: 0, startTime: '09:00', endTime: '15:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '15:00' },
      ],
    },
    {
      email: 'novikova@medecina.ru',
      fullName: 'Новикова Мария Андреевна',
      specialization: 'Дерматолог',
      experience: '6 лет',
      education: 'ВГМУ им. Н.Н. Бурденко',
      bio: 'Специализация — дерматоскопия.',
      centerIdx: 2,
      photoUrl: 'https://randomuser.me/api/portraits/women/90.jpg',
      schedule: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      ],
    },
  ];
  const doctors = [];
  for (const d of doctorsData) {
    const user = await upsertUser(d.email, 'doctor12345', d.fullName, 'doctor');
    let doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor) {
      doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          centerId: centers[d.centerIdx].id,
          fullName: d.fullName,
          specialization: d.specialization,
          experience: d.experience,
          education: d.education,
          bio: d.bio,
          photoUrl: d.photoUrl,
        },
      });
    }
    for (const s of d.schedule) {
      await prisma.doctorSchedule.upsert({
        where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: s.dayOfWeek } },
        create: {
          doctorId: doctor.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotMin: 30,
        },
        update: {
          startTime: s.startTime,
          endTime: s.endTime,
        },
      });
    }
    doctors.push(doctor);
  }
  console.log(`✅ Doctors: ${doctors.length} (пароль для всех: doctor12345)`);

  const patientsData = [
    {
      email: 'sidorov@mail.ru',
      fullName: 'Сидоров Иван Петрович',
      birthDate: '1985-03-15',
      phone: '+7 (900) 111-22-33',
      gender: 'male',
    },
    {
      email: 'kuznetsova@mail.ru',
      fullName: 'Кузнецова Ольга Дмитриевна',
      birthDate: '1992-07-22',
      phone: '+7 (900) 222-33-44',
      gender: 'female',
    },
    {
      email: 'morozov@mail.ru',
      fullName: 'Морозов Алексей Владимирович',
      birthDate: '1978-11-08',
      phone: '+7 (900) 333-44-55',
      gender: 'male',
    },
    {
      email: 'volkova@mail.ru',
      fullName: 'Волкова Татьяна Сергеевна',
      birthDate: '2001-01-30',
      phone: '+7 (900) 444-55-66',
      gender: 'female',
    },
    {
      email: 'lebedev@mail.ru',
      fullName: 'Лебедев Максим Юрьевич',
      birthDate: '1995-06-12',
      phone: '+7 (900) 555-66-77',
      gender: 'male',
    },
  ];
  const patients = [];
  for (const p of patientsData) {
    const user = await upsertUser(p.email, 'patient123', p.fullName, 'patient');
    let patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: user.id,
          fullName: p.fullName,
          birthDate: new Date(p.birthDate),
          phone: p.phone,
          email: p.email,
          gender: p.gender,
        },
      });
    }
    patients.push(patient);
  }
  console.log(`✅ Patients: ${patients.length} (пароль для всех: patient123)`);

  // 9. Исторические приёмы (для формирования истории пациентов)
  const existingAppointments = await prisma.appointment.count();
  if (existingAppointments === 0) {
    const now = new Date();
    const offsetDay = (days: number, h: number, m = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const historical = [
      { pIdx: 0, dIdx: 0, days: -40, hour: 10, status: 'completed' },
      { pIdx: 0, dIdx: 1, days: -15, hour: 14, status: 'completed' },
      { pIdx: 1, dIdx: 0, days: -35, hour: 9, status: 'completed' },
      { pIdx: 1, dIdx: 2, days: -10, hour: 11, status: 'no_show' },
      { pIdx: 2, dIdx: 3, days: -45, hour: 9, status: 'completed' },
      { pIdx: 2, dIdx: 0, days: -20, hour: 10, status: 'no_show' },
      { pIdx: 2, dIdx: 0, days: -5, hour: 10, status: 'no_show' },
      { pIdx: 3, dIdx: 4, days: -30, hour: 15, status: 'completed' },
      { pIdx: 4, dIdx: 1, days: -25, hour: 14, status: 'completed' },
      { pIdx: 4, dIdx: 1, days: -8, hour: 16, status: 'completed' },
    ];
    for (const h of historical) {
      const apt = await prisma.appointment.create({
        data: {
          patientId: patients[h.pIdx].id,
          doctorId: doctors[h.dIdx].id,
          centerId: doctors[h.dIdx].centerId,
          startAt: offsetDay(h.days, h.hour),
          durationMin: 30,
          status: h.status,
          sourceChannel: ['web', 'phone', 'admin'][h.pIdx % 3],
        },
      });
      if (h.status === 'completed') {
        await prisma.visit.create({
          data: {
            appointmentId: apt.id,
            complaints: 'Плановый осмотр',
            diagnosis: 'Здоров',
            examination: 'Без патологии',
            closedAt: offsetDay(h.days, h.hour + 1),
          },
        });
      }
    }

    const upcoming = [
      { pIdx: 0, dIdx: 0, days: 2, hour: 10, status: 'confirmed' },
      { pIdx: 1, dIdx: 1, days: 3, hour: 14, status: 'confirmed' },
      { pIdx: 2, dIdx: 2, days: 5, hour: 9, status: 'pending' },
      { pIdx: 3, dIdx: 0, days: 4, hour: 11, status: 'pending' },
      { pIdx: 4, dIdx: 4, days: 7, hour: 15, status: 'confirmed' },
    ];
    for (const u of upcoming) {
      await prisma.appointment.create({
        data: {
          patientId: patients[u.pIdx].id,
          doctorId: doctors[u.dIdx].id,
          centerId: doctors[u.dIdx].centerId,
          startAt: offsetDay(u.days, u.hour),
          durationMin: 30,
          status: u.status,
          sourceChannel: 'web',
        },
      });
    }
    console.log(`✅ Appointments: ${historical.length + upcoming.length} (${historical.length} past + ${upcoming.length} upcoming)`);
  } else {
    console.log(`⏭️  Appointments: уже есть ${existingAppointments}, пропускаю`);
  }

  const existingResults = await prisma.testResult.count();
  if (existingResults === 0) {
    const cbc = await prisma.labTest.findUnique({ where: { code: 'CBC' } });
    const bio = await prisma.labTest.findUnique({ where: { code: 'BIO' } });
    const gluc = await prisma.labTest.findUnique({ where: { code: 'GLUC' } });
    if (cbc && bio && gluc) {
      const daysAgo = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d;
      };
      const results = [
        {
          patientId: patients[0].id,
          testId: cbc.id,
          result: '5.4',
          unit: '10^9/л',
          refRange: '4.0-9.0',
          status: 'ready',
          takenAt: daysAgo(7),
          readyAt: daysAgo(6),
        },
        {
          patientId: patients[0].id,
          testId: bio.id,
          result: '18',
          unit: 'мкмоль/л',
          refRange: '5-21',
          status: 'ready',
          takenAt: daysAgo(7),
          readyAt: daysAgo(6),
        },
        {
          patientId: patients[0].id,
          testId: gluc.id,
          result: '6.8',
          unit: 'ммоль/л',
          refRange: '3.9-5.8',
          status: 'ready',
          takenAt: daysAgo(3),
          readyAt: daysAgo(2),
        },
        {
          patientId: patients[1].id,
          testId: cbc.id,
          result: '',
          unit: '10^9/л',
          refRange: '4.0-9.0',
          status: 'pending',
          takenAt: daysAgo(1),
        },
      ];
      for (const r of results) {
        await prisma.testResult.create({ data: r });
      }
      console.log(`✅ Test results: ${results.length}`);
    }
  } else {
    console.log(`⏭️  Test results: уже есть ${existingResults}, пропускаю`);
  }

  console.log('');
  console.log('🌱 Seed complete!');
  console.log('');
  console.log('Учётные записи:');
  console.log('  Admin:   admin@medecina.ru   / admin12345');
  console.log('  Doctor:  ivanova@medecina.ru / doctor12345  (и другие врачи)');
  console.log('  Patient: sidorov@mail.ru     / patient123   (и другие пациенты)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
