import { format, eachDayOfInterval, isSaturday, parseISO } from 'date-fns';
import { arDZ } from 'date-fns/locale';
import { Rank } from './types';

export const formatDate = (dateStr: string) => {
  return format(parseISO(dateStr), 'EEEE d MMMM yyyy', { locale: arDZ });
};

/**
 * تحويل كائن التاريخ إلى سلسلة نصية بتنسيق YYYY-MM-DD لاستخدامها كمفتاح في قاعدة البيانات
 */
export const formatDateKey = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * دالة ذكية لتوليد رمز الفوج بناءً على الرتبة (أ، ث، م)
 */
export const getGroupLabel = (rank: Rank | string, groupNum: number | string) => {
  let prefix = 'ف'; // الافتراضي
  if (rank === Rank.CLASS_1 || rank === 'قسم أول') prefix = 'أ';
  else if (rank === Rank.CLASS_2 || rank === 'أستاذ قسم ثاني') prefix = 'ث';
  else if (rank === Rank.DISTINGUISHED || rank === 'أستاذ مميز') prefix = 'م';
  return `${prefix}${groupNum}`;
};

export const getSessionDays = (startDate: string, endDate: string) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = eachDayOfInterval({ start, end });
  
  // تصفية الأيام لإبقاء أيام السبت فقط كما تنص الرزنامة
  return days.filter(day => isSaturday(day));
};

export const isHoliday = (date: Date) => {
  // يمكن إضافة العطل الرسمية المتداخلة هنا إذا لزم الأمر
  return false;
};

export const getWorkingDays = (startDate: string, endDate: string) => {
  return getSessionDays(startDate, endDate);
};

// Database Helpers
export const downloadJSON = (data: object, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const readJSONFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};