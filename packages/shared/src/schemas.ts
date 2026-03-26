import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
});

export const createAppointmentSchema = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive(),
  centerId: z.number().int().positive(),
  startAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(120).default(30),
  sourceChannel: z.enum(['web', 'phone', 'admin']).default('web'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
});

export const createVisitSchema = z.object({
  appointmentId: z.number().int().positive(),
  complaints: z.string().optional(),
  notes: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>;
export type CreateVisitDto = z.infer<typeof createVisitSchema>;
