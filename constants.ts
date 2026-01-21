
import { Level, Rank, Module, Specialty } from './types';

export const SPECIALTIES: Specialty[] = [
  { id: 'ar', name: 'لغة عربية', level: Level.PRIMARY, groups: 1, color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'fr', name: 'لغة فرنسية', level: Level.PRIMARY, groups: 1, color: 'bg-purple-500/10 text-purple-400' },
  { id: 'eng', name: 'لغة إنجليزية', level: Level.PRIMARY, groups: 1, color: 'bg-indigo-500/10 text-indigo-400' },
  { id: 'pe', name: 'تربية بدنية', level: Level.PRIMARY, groups: 1, color: 'bg-blue-500/10 text-blue-400' }
];

export const MODULES: (Module & { description?: string })[] = [
  { id: 1, title: 'التقييم والمعالجة البيداغوجية', shortTitle: 'التقييم والمعالجة', hours: 25, coefficient: 3 },
  { id: 2, title: 'المناهج التعليمية', shortTitle: 'المناهج التعليمية', hours: 20, coefficient: 3 },
  { id: 3, title: 'التسيير التربوي (قسم 1)', shortTitle: 'تسيير تربوي 1', hours: 15, coefficient: 2 },
  { id: 6, title: 'التأطير والمتابعة (قسم 2)', shortTitle: 'تأطير ومتابعة', hours: 15, coefficient: 2 },
  { id: 7, title: 'التسيير والتنشيط التربوي والإداري (مميز)', shortTitle: 'تسيير وتنشيط', hours: 15, coefficient: 2 },
  { id: 4, title: 'تكنولوجيات الإعلام والاتصال', shortTitle: 'تكنولوجيات الإعلام', hours: 10, coefficient: 1 },
  { id: 5, title: 'التشريع المدرسي والنزاعات', shortTitle: 'التشريع المدرسي', hours: 10, coefficient: 1 }
];

export const CORRECTED_DISTRIBUTION = [
  { moduleId: 1, s1: 13, s2: 12 }, 
  { moduleId: 2, s1: 10, s2: 10 }, 
  { moduleId: 3, s1: 7, s2: 8 },   
  { moduleId: 6, s1: 7, s2: 8 },
  { moduleId: 7, s1: 7, s2: 8 },
  { moduleId: 4, s1: 5, s2: 5 },   
  { moduleId: 5, s1: 5, s2: 5 }
];

export const RANK_DISTRIBUTION: Record<Rank, { moduleId: number, hours: number, coeff: number }[]> = {
  [Rank.CLASS_1]: [
    { moduleId: 1, hours: 25, coeff: 3 },
    { moduleId: 2, hours: 20, coeff: 3 },
    { moduleId: 3, hours: 15, coeff: 2 },
    { moduleId: 4, hours: 10, coeff: 1 },
    { moduleId: 5, hours: 10, coeff: 1 }
  ],
  [Rank.CLASS_2]: [
    { moduleId: 1, hours: 25, coeff: 3 },
    { moduleId: 2, hours: 20, coeff: 3 },
    { moduleId: 6, hours: 15, coeff: 2 },
    { moduleId: 4, hours: 10, coeff: 1 },
    { moduleId: 5, hours: 10, coeff: 1 }
  ],
  [Rank.DISTINGUISHED]: [
    { moduleId: 1, hours: 25, coeff: 3 },
    { moduleId: 2, hours: 20, coeff: 3 },
    { moduleId: 7, hours: 15, coeff: 2 },
    { moduleId: 4, hours: 10, coeff: 1 },
    { moduleId: 5, hours: 10, coeff: 1 }
  ]
};

export const SESSIONS = [
  { id: 1, name: 'الدورة الأولى', startDate: '2026-01-24', endDate: '2026-03-14', hoursTotal: 40 },
  { id: 2, name: 'الدورة الثانية', startDate: '2026-04-04', endDate: '2026-05-23', hoursTotal: 40 }
];

export const MODULE_CONTENTS = [
  {
    moduleId: 1,
    s1Topics: [
      { topic: 'التقويم البيداغوجي', duration: 2 },
      { topic: 'أنواع وأغراض التقويم وأهدافه', duration: 1 },
      { topic: 'مجالات ووظائف التقويم ومعاييره', duration: 1 },
      { topic: 'المتابعة و التقويم 01', duration: 1 },
      { topic: 'المتابعة والتقويم 02', duration: 2 },
      { topic: 'المعالجة البيداغوجية', duration: 2 },
      { topic: 'أهمية وأهداف المعالجة البيداغوجية', duration: 1 },
      { topic: 'أنماط المعالجة البيداغوجية', duration: 2 },
      { topic: 'المعالجة والبيداغوجيا الفارقية 01', duration: 1 }
    ],
    s2Topics: [
      { topic: 'المعالجة والبيداغوجيا الفارقية 02', duration: 2 },
      { topic: 'أدوات وطرق المعالجة البيداغوجية', duration: 3 },
      { topic: 'تسيير حصة المعالجة البيداغوجية', duration: 3 },
      { topic: 'إعداد بطاقات المعالجة وشبكة التقويم', duration: 2 },
      { topic: 'تقييم فعالية المعالجة والمتابعة المستمرة', duration: 2 }
    ],
    s3Topics: []
  },
  {
    moduleId: 2,
    s1Topics: [
      { topic: 'مدخل إلى المناهج التعليمية', duration: 3 },
      { topic: 'المبادئ التي بنيت عليها المناهج', duration: 3 },
      { topic: 'مكونات المناهج التعليمية', duration: 4 }
    ],
    s2Topics: [
      { topic: 'خصائص المناهج وأنواعها', duration: 3 },
      { topic: 'الكفاءات المهنية للأستاذ', duration: 4 },
      { topic: 'مهارات القرن الحادي والعشرين', duration: 3 }
    ],
    s3Topics: []
  },
  {
    moduleId: 3,
    s1Topics: [
      { topic: 'التسيير التربوي والنصوص المنظمة له', duration: 2 },
      { topic: 'أنواع وأهداف ومبادئ التسيير التربوي', duration: 2 },
      { topic: 'أدوات وأساليب التسيير التربوي', duration: 3 }
    ],
    s2Topics: [
      { topic: 'وسائل وآليات التسيير البيداغوجي', duration: 2 },
      { topic: 'التنظيم العام للفعل التربوي داخل المؤسسة', duration: 2 },
      { topic: 'مهارات التواصل الفعال في الاجتماعات التربوية', duration: 2 },
      { topic: 'الوساطة المدرسية', duration: 2 }
    ],
    s3Topics: []
  },
  {
    moduleId: 6,
    s1Topics: [
      { topic: 'التأطير البيداغوجي', duration: 3 },
      { topic: 'المتابعة البيداغوجية', duration: 3 },
      { topic: 'البحث التربوي 01', duration: 1 }
    ],
    s2Topics: [
      { topic: 'البحث التربوي 02', duration: 2 },
      { topic: 'هندسة التكوين 01', duration: 3 },
      { topic: 'هندسة التكوين 02', duration: 3 }
    ],
    s3Topics: []
  },
  {
    moduleId: 7,
    s1Topics: [
      { topic: 'مفهوم التسيير التربوي والنصوص المنظمة له', duration: 2 },
      { topic: 'أنواع التسيير (بيداغوجي، إداري، مالي ومادي)', duration: 2 },
      { topic: 'عوامل التسيير التربوي الجيد', duration: 2 },
      { topic: 'أدوات وأساليب التسيير التربوي', duration: 1 }
    ],
    s2Topics: [
      { topic: 'وسائل وآليات التسيير التربوي', duration: 2 },
      { topic: 'التنظيم العام للفعل التربوي', duration: 2 },
      { topic: 'مفهوم التنشيط التربوي', duration: 1 },
      { topic: 'تقنيات التنشيط التربوي', duration: 1 },
      { topic: 'وسائل التنشيط التربوي', duration: 1 },
      { topic: 'تفعيل المجالس التربوية', duration: 1 }
    ],
    s3Topics: []
  },
  {
    moduleId: 4,
    s1Topics: [
      { topic: 'التحول الرقمي في التعليم', duration: 2 },
      { topic: 'الكفاءات الرقمية', duration: 2 },
      { topic: 'تصميم التعلم الرقمي التفاعلي 01', duration: 1 }
    ],
    s2Topics: [
      { topic: 'تصميم التعلم الرقمي التفاعلي 02', duration: 1 },
      { topic: 'تحليل البيانات', duration: 2 },
      { topic: 'التدريس عن بعد', duration: 2 }
    ],
    s3Topics: []
  },
  {
    moduleId: 5,
    s1Topics: [
      { topic: 'مدخل مفاهيمي', duration: 1 },
      { topic: 'القانون الأساسي الخاص بالموظفين 01', duration: 2 },
      { topic: 'القانون الأساسي الخاص بالموظفين 02', duration: 2 }
    ],
    s2Topics: [
      { topic: 'ممارسة الحق النقابي', duration: 2 },
      { topic: 'الوقاية من النزاعات الجماعية للعمل', duration: 2 },
      { topic: 'أخلاقيات المهنة', duration: 1 }
    ],
    s3Topics: []
  }
];
