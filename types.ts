
export enum Level {
  PRIMARY = 'ابتدائي',
  MIDDLE = 'متوسط',
  SECONDARY = 'ثانوي'
}

export enum Rank {
  CLASS_1 = 'أستاذ قسم أول',
  CLASS_2 = 'أستاذ قسم ثاني',
  DISTINGUISHED = 'أستاذ مميز'
}

export interface Specialty {
  id: string;
  name: string;
  level: Level;
  groups: number;
  color: string;
  count?: number;
}

export interface Trainee {
  id: string;
  surname: string;
  name: string;
  dob: string;
  pob: string;
  gender: 'M' | 'F';
  level: Level;
  rank: Rank;
  specialtyId: string;
  groupId: number;
  school?: string;
  municipality?: string;
}

export interface Module {
  id: number;
  title: string;
  shortTitle: string;
  hours: number;
  coefficient: number;
}

export interface TraineeGrades {
  continuousAssessment: number;
  internship: number;
  finalReport: number;
  finalExam: number;
  modules?: Record<number, { s1: number; s2: number; s3: number; exam: number }>;
  report?: number;
}

export type EvaluationDatabase = Record<string, TraineeGrades>;

export interface InstitutionConfig {
  wilaya: string;
  institute: string;
  center: string;
  director: string;
  rankGroups?: Record<string, number>; // تخزين عدد الأفواج لكل رتبة
}

export interface AttendanceDetail {
  status: 'P' | 'A';
}

export type AttendanceRecord = Record<string, AttendanceDetail>;

export interface ExamSlot {
  id: string;
  moduleId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ExamRoom {
  id: number;
  specialtyId: string;
  trainees: Trainee[];
  capacity: number;
}

export interface ProctorAssignment {
  roomId: number;
  examSlotId: string;
  proctor1: string;
  proctor2: string;
}

export interface TrainerConfig {
  [moduleId: number]: {
    names: Record<string, string>;
    specialtyCounts?: Record<string, number>;
    generalCount?: number;
  };
}

export interface TrainerAssignment {
  moduleId: number;
  trainerKey: string;
  groupId: string;
  dayIndex: number;
  hourIndex: number;
  sessionId: number;
}

export interface GroupSchedule {
  groupId: number;
  specialtyId: string;
  days: {
    date: string;
    slots: {
      time: string;
      moduleId: number | null;
      duration: number;
    }[];
  }[];
}

export interface SummaryData {
  introduction: string;
  pedagogicalActivities: string;
  administrativeConditions: string;
  difficulties: string;
  recommendations: string;
  conclusion: string;
}

export interface ReportConfig {
  s1: SummaryData;
  s2: SummaryData;
  s3: SummaryData;
  final: SummaryData;
}
