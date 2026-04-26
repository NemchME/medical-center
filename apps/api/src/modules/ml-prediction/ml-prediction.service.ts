import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ort from 'onnxruntime-node';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

export interface NoShowFeatures {
  dayOfWeek: number;
  hourOfDay: number;
  leadTimeDays: number;
  patientAge: number;
  previousVisits: number;
  previousNoShows: number;
  noShowRate: number;
  sourceChannel: number;
}

@Injectable()
export class MlPredictionService implements OnModuleInit {
  private readonly logger = new Logger(MlPredictionService.name);
  private readonly MODEL_VERSION = 'v1.0-gb';
  private session: ort.InferenceSession | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadModel();
  }

  async loadModel() {
    const fs = await import('fs');

    const candidates: string[] = [];

    if (process.env.ML_MODEL_PATH) {
      const envPath = process.env.ML_MODEL_PATH;
      candidates.push(
        path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath),
      );
    }

    candidates.push(
      path.resolve(process.cwd(), '../../packages/ml-model/model.onnx'),
      path.resolve(process.cwd(), 'packages/ml-model/model.onnx'),
      path.resolve(__dirname, '../../../../../packages/ml-model/model.onnx'),
    );

    const modelPath = candidates.find((p) => fs.existsSync(p));

    if (!modelPath) {
      this.logger.error(
        `ML model not found. Tried:\n  ${candidates.join('\n  ')}`,
      );
      this.session = null;
      return;
    }

    try {
      this.session = await ort.InferenceSession.create(modelPath);
      this.logger.log(`ML model loaded: ${modelPath}`);
    } catch (err) {
      this.logger.error(`Failed to load ML model from ${modelPath}: ${(err as Error).message}`);
      this.session = null;
    }
  }

  findByAppointment(appointmentId: number) {
    return this.prisma.mlPrediction.findUnique({
      where: { appointmentId: BigInt(appointmentId) as any },
    });
  }

  async predict(features: NoShowFeatures): Promise<number> {
    if (!this.session) {
      throw new Error('ML model is not loaded');
    }

    const inputArray = Float32Array.from([
      features.dayOfWeek,
      features.hourOfDay,
      features.leadTimeDays,
      features.patientAge,
      features.previousVisits,
      features.previousNoShows,
      features.noShowRate,
      features.sourceChannel,
    ]);

    const inputTensor = new ort.Tensor('float32', inputArray, [1, 8]);
    const inputName = this.session.inputNames[0];

    const results = await this.session.run({ [inputName]: inputTensor });

    const probsOutput = results[this.session.outputNames[1]];
    const probs = probsOutput.data as Float32Array;
    const noShowProbability = probs[1];

    return Math.round(noShowProbability * 10000) / 10000;
  }

  async predictAndSave(appointmentId: number): Promise<number> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: BigInt(appointmentId) as any },
      include: { patient: true },
    });
    if (!appointment) throw new Error(`Appointment #${appointmentId} not found`);

    const history = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: {
        patientId: appointment.patientId,
        startAt: { lt: appointment.startAt },
        status: { in: ['completed', 'no_show'] },
      },
      _count: true,
    });

    const completed = history.find((h: {status: string; _count: number}) => h.status === 'completed')?._count ?? 0;
    const noShows = history.find((h: {status: string; _count: number}) => h.status === 'no_show')?._count ?? 0;
    const totalVisits = completed + noShows;

    const startAt = new Date(appointment.startAt);
    const createdAt = new Date(appointment.createdAt);

    const patientAge = appointment.patient.birthDate
      ? Math.floor(
          (startAt.getTime() - new Date(appointment.patient.birthDate).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25),
        )
      : 30;

    const sourceChannelNum =
      appointment.sourceChannel === 'phone'
        ? 1
        : appointment.sourceChannel === 'admin'
          ? 2
          : 0;

    const features: NoShowFeatures = {
      dayOfWeek: startAt.getDay(),
      hourOfDay: startAt.getHours(),
      leadTimeDays: Math.max(
        0,
        (startAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
      patientAge,
      previousVisits: totalVisits,
      previousNoShows: noShows,
      noShowRate: totalVisits > 0 ? noShows / totalVisits : 0,
      sourceChannel: sourceChannelNum,
    };

    const probability = await this.predict(features);

    await this.prisma.mlPrediction.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        noShowProbability: probability,
        modelVersion: this.MODEL_VERSION,
      },
      update: {
        noShowProbability: probability,
        modelVersion: this.MODEL_VERSION,
      },
    });

    return probability;
  }

  async reload() {
    await this.loadModel();
    return { status: this.session ? 'ok' : 'error', modelVersion: this.MODEL_VERSION };
  }
}
