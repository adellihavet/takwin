
import { Level, Rank, Module, Specialty } from './types';

export const SPECIALTIES: Specialty[] = [
  { id: 'pri-ar', name: 'لغة عربية (ابتدائي)', level: Level.PRIMARY, groups: 2, color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'mid-math', name: 'رياضيات (متوسط)', level: Level.MIDDLE, groups: 1, color: 'bg-blue-500/10 text-blue-400' },
  { id: 'sec-phy', name: 'فيزياء (ثانوي)', level: Level.SECONDARY, groups: 1, color: 'bg-purple-500/10 text-purple-400' }
];

/**
 * المقاييس الرسمية - مع مراعاة التسميات الخاصة بكل رتبة في المقياس الثالث
 */
export const MODULES: (Module & { description?: string })[] = [
  { id: 1, title: 'التقييم والمعالجة', shortTitle: 'التقييم والمعالجة', hours: 25, coefficient: 3 },
  { id: 2, title: 'المناهج التعليمية', shortTitle: 'المناهج التعليمية', hours: 20, coefficient: 3 },
  // المقياس الثالث المتغير حسب الرتبة
  { id: 3, title: 'التسيير التربوي', shortTitle: 'تسيير تربوي', hours: 15, coefficient: 2 }, // للقسم الأول
  { id: 6, title: 'التأطير والمتابعة', shortTitle: 'التأطير والمتابعة', hours: 15, coefficient: 2 }, // للقسم الثاني
  { id: 7, title: 'التسيير والتنشيط التربوي والإداري', shortTitle: 'تسيير وتنشيط', hours: 15, coefficient: 2 }, // للمميز
  // المقاييس المشتركة المتبقية
  { id: 4, title: 'تكنولوجيات الإعلام والاتصال', shortTitle: 'تكنولوجيات الإعلام', hours: 10, coefficient: 1 },
  { id: 5, title: 'التشريع المدرسي', shortTitle: 'التشريع', hours: 10, coefficient: 1 }
];

/**
 * توزيع الساعات الدقيق على الدورتين
 */
export const CORRECTED_DISTRIBUTION = [
  { moduleId: 1, s1: 13, s2: 12 }, 
  { moduleId: 2, s1: 10, s2: 10 }, 
  { moduleId: 3, s1: 7, s2: 8 },   
  { moduleId: 4, s1: 5, s2: 5 },   
  { moduleId: 5, s1: 5, s2: 5 },
  { moduleId: 6, s1: 7, s2: 8 },
  { moduleId: 7, s1: 7, s2: 8 }
];

export const RANK_DISTRIBUTION: Record<Rank, { moduleId: number, hours: number, coeff: number }[]> = {
  [Rank.CLASS_1]: [
    { moduleId: 1, hours: 25, coeff: 3 },
    { moduleId: 2, hours: 20, coeff: 3 },
    { moduleId: 3, hours: 15, coeff: 2 }, // تسيير تربوي
    { moduleId: 4, hours: 10, coeff: 1 },
    { moduleId: 5, hours: 10, coeff: 1 }
  ],
  [Rank.CLASS_2]: [
    { moduleId: 1, hours: 25, coeff: 3 },
    { moduleId: 2, hours: 20, coeff: 3 },
    { moduleId: 6, hours: 15, coeff: 2 }, // التأطير والمتابعة
    { moduleId: 4, hours: 10, coeff: 1 },
    { moduleId: 5, hours: 10, coeff: 1 }
  ],
  [Rank.DISTINGUISHED]: [
    { moduleId: 1, hours: 25, coeff: 3 },
    { moduleId: 2, hours: 20, coeff: 3 },
    { moduleId: 7, hours: 15, coeff: 2 }, // التسيير والتنشيط التربوي والإداري
    { moduleId: 4, hours: 10, coeff: 1 },
    { moduleId: 5, hours: 10, coeff: 1 }
  ]
};

export const SESSIONS = [
  { id: 1, name: 'الدورة الأولى', startDate: '2026-01-24', endDate: '2026-03-14', hoursTotal: 40 },
  { id: 2, name: 'الدورة الثانية', startDate: '2026-04-04', endDate: '2026-05-23', hoursTotal: 40 }
];

export const MODULE_CONTENTS = MODULES.map(m => ({
  moduleId: m.id,
  s1Topics: [{ topic: 'محاور الدورة الأولى', duration: 5 }],
  s2Topics: [{ topic: 'محاور الدورة الثانية', duration: 5 }],
  s3Topics: []
}));
