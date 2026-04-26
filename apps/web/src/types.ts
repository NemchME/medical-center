export type ID = number | string;

export interface ClinicCenter {
  id: ID;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string;
  isActive?: boolean;
}

export interface DoctorSchedule {
  id: ID;
  doctorId: ID;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMin: number;
  isActive?: boolean;
}

export interface Doctor {
  id: ID;
  userId?: ID | null;
  centerId: ID;
  fullName: string;
  specialization?: string | null;
  photoUrl?: string | null;
  experience?: string | null;
  education?: string | null;
  bio?: string | null;
  center?: ClinicCenter;
  schedules?: DoctorSchedule[];
}

export interface ServicePrice {
  id: ID;
  centerId: ID;
  serviceId: ID;
  price: number | string;
  currency: string;
  center?: ClinicCenter;
}

export interface TestPrice {
  id: ID;
  centerId: ID;
  testId: ID;
  price: number | string;
  currency: string;
  center?: ClinicCenter;
}

export interface Service {
  id: ID;
  code: string;
  name: string;
  description?: string | null;
  durationMinDefault: number;
  isActive?: boolean;
  prices?: ServicePrice[];
}

export interface LabTest {
  id: ID;
  code: string;
  name: string;
  description?: string | null;
  sampleType?: string | null;
  preparation?: string | null;
  isActive?: boolean;
  prices?: TestPrice[];
}

export interface Patient {
  id: ID;
  userId?: ID | null;
  fullName: string;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  address?: string | null;
  appointments?: Appointment[];
  testResults?: TestResult[];
}

export interface MlPrediction {
  id: ID;
  appointmentId: ID;
  noShowProbability: number;
  modelVersion: string;
  createdAt?: string;
}

export interface Prescription {
  id: ID;
  visitId: ID;
  text: string;
  status: string;
  createdAt: string;
}

export interface Visit {
  id: ID;
  appointmentId: ID;
  complaints?: string | null;
  diagnosis?: string | null;
  examination?: string | null;
  notes?: string | null;
  closedAt?: string | null;
  prescriptions?: Prescription[];
  appointment?: Appointment;
}

export interface AppointmentServiceRow {
  id: ID;
  appointmentId: ID;
  serviceId: ID;
  qty: number;
  unitPrice: number | string;
  totalPrice: number | string;
  status: string;
  service?: Service;
}

export interface AppointmentTestRow {
  id: ID;
  appointmentId: ID;
  testId: ID;
  qty: number;
  unitPrice: number | string;
  totalPrice: number | string;
  status: string;
  test?: LabTest;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: ID;
  patientId: ID;
  doctorId: ID;
  centerId: ID;
  startAt: string;
  durationMin: number;
  status: AppointmentStatus;
  createdAt: string;
  sourceChannel?: string | null;
  patient?: Patient;
  doctor?: Doctor;
  center?: ClinicCenter;
  visit?: Visit | null;
  prediction?: MlPrediction | null;
  services?: AppointmentServiceRow[];
  tests?: AppointmentTestRow[];
}

export interface TestResult {
  id: ID;
  patientId: ID;
  testId: ID;
  result: string;
  unit?: string | null;
  refRange?: string | null;
  status: string;
  takenAt: string;
  readyAt?: string | null;
  test?: LabTest;
  patient?: Patient;
}

export interface Notification {
  id: ID;
  appointmentId: ID;
  type: string;
  plannedAt: string;
  sentAt?: string | null;
  status: string;
  appointment?: Appointment;
}

export interface UserProfile {
  userId: ID;
  birthDate?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
}

export interface User {
  id: ID;
  email: string;
  fullName: string;
  isActive?: boolean;
  roles: string[];
  profile?: UserProfile | null;
  doctor?: Doctor | null;
  patient?: Patient | null;
}

export interface AnalyticsOverview {
  totalPatients: number;
  totalAppointments: number;
  totalDoctors: number;
  totalCenters: number;
  appointmentsByStatus: { status: string; count: number }[];
  noShowRate: number;
}
