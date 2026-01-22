import React, { useState, useEffect, useMemo } from 'react';
import { Save, Printer, FileText, Mic, MicOff, Download, PenTool, BarChart2, AlertCircle, Sparkles, UserX, Clock, TrendingUp, FileDown, Layout, CheckCircle, Info, ShieldAlert, Users, PieChart as PieIcon, ListChecks, MessageSquarePlus, ScrollText, Landmark, BadgeAlert, FileWarning, SearchCheck, MapPin, Building, GraduationCap, FileCheck, Presentation, UserPlus } from 'lucide-react';
import { ReportConfig, SummaryData, InstitutionConfig, Specialty, TrainerConfig, Trainee, AttendanceRecord, TrainerAssignment, GroupSchedule, AttendanceDetail } from '../types';
import { SPECIALTIES as DEFAULT_SPECIALTIES, SESSIONS, MODULES, CORRECTED_DISTRIBUTION, MODULE_CONTENTS } from '../constants';
import { formatDate, getWorkingDays, formatDateKey } from '../utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9.svg/960px-%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9.svg.png";

const formatArabicDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ar-DZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return dateStr;
    }
};

// --- إعدادات التقارير ---
const INITIAL_REPORTS: ReportConfig = {
    initial: { introduction: '', pedagogicalActivities: '', administrativeConditions: '', difficulties: '', recommendations: '', conclusion: '', startTime: '08:00', roomsReadiness: 'جاهزة ومهيأة بالكامل', toolsAvailability: 'متوفرة كلياً', scheduleAdjustment: 'تم ضبط رزنامة الحصص وتوزيعها', adminDirector: '', deputyPedagogicalDirector: '' },
    s1: { introduction: 'بناءً على مقتضيات القرار الوزاري رقم 250، وتجسيداً للمخطط الوطني للتكوين، نضع بين أيديكم حصيلة الدورة الأولى التي ركزت على إرساء المعالم الكبرى للعملية التربوية وتوطيد المفاهيم البيداغوجية القاعدية لدى الأساتذة المدمجين...', pedagogicalActivities: '', administrativeConditions: '', difficulties: '', recommendations: '', conclusion: '' },
    s2: { introduction: 'استكمالاً لمسار التكوين البيداغوجي التحضيري، تم تنفيذ الدورة الثانية التي شهدت نقلة نوعية من التنظير إلى الممارسة الميدانية، حيث ركزت الورشات على نماذج المحاكاة الصفيّة وآليات التسيير الفعال للأقسام...', pedagogicalActivities: '', administrativeConditions: '', difficulties: '', recommendations: '', conclusion: '' },
    final: { introduction: 'يعتبر هذا التقرير الوثيقة الاستراتيجية التي تلخص مسار التكوين البيداغوجي التحضيري برسم السنة الدراسية الحالية، متضمناً تحليلاً إحصائياً وبيداغوجياً دقيقاً لكافة مدخلات ومخرجات العملية التكوينية بالمركز...', pedagogicalActivities: '', administrativeConditions: '', difficulties: '', recommendations: '', conclusion: '' }
};

const STRATEGIC_SUGGESTIONS = {
    administrativeConditions: [
        "سجلنا انسيابية تامة في استغلال مرافق المركز.",
        "تم تفعيل المخطط الرقمي للمركز عبر توفير تدفق عالٍ للإنترنت.",
        "استقرار الطاقم الإداري ساهم في نجاح التسيير.",
        "توفير بيئة تكوينية محفزة تعتمد على الوسائل التفاعلية (Data Show).",
        "التنسيق المحكم مع مصالح الإطعام والإيواء."
    ],
    pedagogicalActivities: [
        "تنفيذ الورشات البيداغوجية وفق مقاربة المحاكاة (Micro-teaching).",
        "تفاعل إيجابي لافت مع مقياس 'تعليمية المادة'.",
        "استغلال ناجع للحقائب البيداغوجية الرقمية.",
        "تفعيل أسلوب العمل بالأفواج المصغرة.",
        "التركيز على الجانب الوجداني والالتزام المهني."
    ],
    difficulties: [
        "رصد تفاوت نسبي في المكتسبات القبلية للمتكونين.",
        "كثافة البرنامج الساعي الموزع على دورات قصيرة.",
        "تحديات متعلقة بالربط التقني لبعض الموارد الرقمية.",
        "الحاجة إلى تعزيز الرصيد الوثائقي للمركز بمراجع ورقية."
    ],
    recommendations: [
        "نقترح تمديد فترة التكوين الميداني داخل المؤسسات.",
        "تفعيل منصة تعليمية دائمة (E-learning).",
        "برمجة ندوات بيداغوجية تبادلية بين مراكز التكوين.",
        "تخصيص ميزانية مستقلة لتطوير الموارد الرقمية.",
        "إدراج مقياس متخصص حول 'سيكولوجية الطفل'."
    ]
};

const SummaryReport: React.FC = () => {
    const [reports, setReports] = useState<ReportConfig>(INITIAL_REPORTS);
    const [institution, setInstitution] = useState<InstitutionConfig>({ wilaya: '', institute: '', center: '', director: '' });
    const [specialties, setSpecialties] = useState<Specialty[]>(DEFAULT_SPECIALTIES);
    const [trainerConfig, setTrainerConfig] = useState<TrainerConfig>({});
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord>({});
    const [assignments, setAssignments] = useState<TrainerAssignment[]>([]);
    
    const [activeReport, setActiveReport] = useState<'initial' | 's1' | 's2' | 'final'>('initial');
    const [isListening, setIsListening] = useState<string | null>(null);

    // --- تحميل البيانات (مع إصلاح مشكلة adminDirector) ---
    useEffect(() => {
        // 1. تحميل التقارير مع دمج ذكي للبيانات
        const savedReports = localStorage.getItem('takwin_reports_db');
        if (savedReports) {
            try {
                const parsed = JSON.parse(savedReports);
                setReports(prev => ({
                    ...prev,
                    ...parsed,
                    initial: {
                        ...prev.initial,       // القيم الافتراضية (تحتوي على الحقول الجديدة)
                        ...(parsed.initial || {}) // القيم المحفوظة (تغطي على الافتراضية إذا وجدت)
                    }
                }));
            } catch(e) { console.error("Error loading reports", e); }
        }

        // 2. تحميل باقي البيانات
        const load = (key: string, setter: any) => {
            const data = localStorage.getItem(key);
            if (data) try { setter(JSON.parse(data)); } catch(e){}
        };
        
        load('takwin_institution_db', setInstitution);
        load('takwin_specialties_db', setSpecialties);
        load('takwin_trainers_db', setTrainerConfig);
        load('takwin_trainees_db', setTrainees);
        load('takwin_attendance_db', setAttendance);
        load('takwin_assignments', setAssignments);
    }, []);

    // --- 1. إحصائيات التقرير الأولي ---
    const initialReportStats = useMemo(() => {
        const firstDay = SESSIONS[0].startDate;
        const stats: any[] = [];
        const groupings = new Map<string, Trainee[]>();
        
        trainees.forEach(t => {
            const key = `${t.rank}|${t.specialtyId}|${t.level}`;
            if (!groupings.has(key)) groupings.set(key, []);
            groupings.get(key)?.push(t);
        });

        groupings.forEach((list, key) => {
            const [rank, specId, level] = key.split('|');
            const total = list.length;
            const joined = list.filter(t => attendance[`${formatDateKey(firstDay)}-${t.id}`]?.status !== 'A').length;
            stats.push({
                rank, 
                level,
                spec: DEFAULT_SPECIALTIES.find(s => s.id === specId)?.name || specId,
                total,
                joined,
                absent: total - joined
            });
        });
        return stats;
    }, [trainees, attendance]);

    // --- قائمة المؤطرين للتقرير الأولي ---
    const allInstructorsList = useMemo(() => {
        const namesSet = new Set<string>();
        MODULES.forEach(m => {
            const names = Object.values(trainerConfig[m.id]?.names || {});
            names.forEach(n => { if(n) namesSet.add(n); });
        });
        return Array.from(namesSet).map(name => ({ name }));
    }, [trainerConfig]);

    // --- 2. إحصائيات التقارير الدورية (تم حذف الدورة 3) ---
    const reportAnalytics = useMemo(() => {
        if (activeReport === 'initial') return null;

        const sessionId = activeReport === 'final' ? 1 : parseInt(activeReport[1]);
        const currentSession = SESSIONS.find(s => s.id === sessionId);
        if (!currentSession || trainees.length === 0) return null;

        const days = getWorkingDays(currentSession.startDate, currentSession.endDate);
        const attendeeRecords = trainees.map(t => {
            let missedHours = 0; let missedDays = 0;
            days.forEach((day, idx) => {
                const dateKey = formatDateKey(day);
                const record = attendance[`${dateKey}-${t.id}`] as AttendanceDetail | undefined;
                if (record?.status === 'A') {
                    missedDays++;
                    missedHours += 5; // افتراض 5 ساعات يومياً
                }
            });
            return { ...t, missedDays, missedHours };
        });

        const allAbsentees = attendeeRecords.filter(t => t.missedHours > 0).sort((a,b) => b.missedHours - a.missedHours);
        const muniStats: Record<string, number> = {};
        trainees.forEach(t => {
            const m = t.municipality || 'غير محدد';
            muniStats[m] = (muniStats[m] || 0) + 1;
        });
        const municipalityTable = Object.entries(muniStats).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
        const specStats = specialties.map(s => ({ name: s.name, value: trainees.filter(t => t.specialtyId === s.id).length }));

        const executionTable = MODULES.map(m => {
            const dist = CORRECTED_DISTRIBUTION.find(d => d.moduleId === m.id);
            const planned = (sessionId === 1 ? dist?.s1 : dist?.s2) || 0;
            const content = MODULE_CONTENTS.find(c => c.moduleId === m.id);
            const topics = (sessionId === 1 ? content?.s1Topics : content?.s2Topics) || [];
            const trainerKeys = Array.from(new Set(assignments.filter(a => a.sessionId === sessionId && a.moduleId === m.id).map(a => a.trainerKey)));
            const trainersNames = trainerKeys.map(k => m.id === 1 ? (trainerConfig[1]?.names?.[k] || k) : (trainerConfig[m.id]?.names?.[k] || k)).join('، ');
            return { title: m.title, topics: topics.map(tp => tp.topic).join(' | '), planned, trainers: trainersNames || '---' };
        }).filter(r => r.planned > 0);

        return { currentSession, allAbsentees, executionTable, total: trainees.length, maleCount: trainees.filter(t => t.gender === 'M').length, femaleCount: trainees.filter(t => t.gender === 'F').length, municipalityTable, specStats };
    }, [activeReport, trainees, attendance, assignments, trainerConfig, specialties]);

    const handleSave = () => { localStorage.setItem('takwin_reports_db', JSON.stringify(reports)); alert('تم حفظ المسودة بنجاح.'); };
    
    const updateField = (field: keyof SummaryData, value: string) => { 
        setReports(prev => ({ ...prev, [activeReport]: { ...prev[activeReport], [field]: value } })); 
    };
    
    const updateInitialField = (field: string, value: string) => {
        setReports(prev => ({...prev, initial: {...prev.initial, [field]: value}}));
    };

    const appendSuggestion = (field: keyof SummaryData, text: string) => {
        const current = reports[activeReport as keyof ReportConfig][field] || '';
        updateField(field, current ? `${current}\n- ${text}` : `- ${text}`);
    };

    const handlePrint = () => {
        const templateId = activeReport === 'initial' ? 'initial-report-doc' : 'ministerial-final-doc';
        const content = document.getElementById(templateId);
        let printSection = document.getElementById('print-section');
        if (!printSection) { printSection = document.createElement('div'); printSection.id = 'print-section'; document.body.appendChild(printSection); }
        if (content && printSection) { printSection.innerHTML = ''; const clone = content.cloneNode(true) as HTMLElement; clone.classList.remove('hidden'); printSection.appendChild(clone); window.print(); }
    };

    const handleExportWord = () => {
        const content = document.getElementById('report-paper-view')?.innerHTML;
        if (!content) return;

        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Report Export</title>
            <style>
                body { font-family: 'Times New Roman', serif; direction: rtl; text-align: right; padding: 20px; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                th, td { border: 1px solid black; padding: 5px; text-align: center; }
                h1, h2, h3 { text-align: center; }
                .text-justify { text-align: justify; }
                .underline { text-decoration: underline; }
                .bold { font-weight: bold; }
                .bg-gray { background-color: #f3f4f6; }
                .recharts-wrapper { display: none; }
            </style>
            </head><body>`;
        
        const footer = "</body></html>";
        const sourceHTML = header + content + footer;
        
        const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تقرير_${activeReport}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleDictation = (field: keyof SummaryData) => {
        if (isListening) { setIsListening(null); return; }
        const recognition = new ((window as any).SpeechRecognition || (window as any).webkitRecognition || (window as any).webkitSpeechRecognition)();
        recognition.lang = 'ar-DZ';
        recognition.onstart = () => setIsListening(field);
        recognition.onend = () => setIsListening(null);
        recognition.onresult = (e: any) => updateField(field, (reports[activeReport][field] || '') + ' ' + e.results[0][0].transcript);
        recognition.start();
    };

    return (
        <div className="animate-fadeIn pb-24 font-tajawal">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;700;900&display=swap');
                .font-official { font-family: 'Amiri', serif; }
                .font-title { font-family: 'Tajawal', sans-serif; font-weight: 900; }
                @media print {
                    @page { size: portrait; margin: 15mm; }
                    .page-break { page-break-after: always; }
                    .watermark-overlay { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03 !important; width: 600px; pointer-events: none; z-index: -1; }
                    .text-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.015 !important; font-size: 80pt; font-weight: 900; z-index: -1; white-space: nowrap; }
                    .recharts-surface { opacity: 0.9; }
                    .report-table th, .report-table td { border: 1px solid black !important; padding: 4px; text-align: center; }
                }
            `}</style>

            <div className="bg-slate-900/95 backdrop-blur sticky top-20 z-20 p-4 rounded-2xl shadow-2xl border border-slate-800 mb-8 flex flex-wrap gap-4 justify-between items-center print:hidden">
                <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
                    <button onClick={() => setActiveReport('initial')} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeReport === 'initial' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>التقرير الأولي</button>
                    <button onClick={() => setActiveReport('s1')} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeReport === 's1' ? 'bg-dzgreen-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>الدورة 1</button>
                    <button onClick={() => setActiveReport('s2')} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeReport === 's2' ? 'bg-dzgreen-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>الدورة 2</button>
                    <button onClick={() => setActiveReport('final')} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeReport === 'final' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>الحوصلة الختامية</button>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"><Save className="w-5 h-5" /> حفظ المسودة</button>
                    <button onClick={handleExportWord} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"><FileDown className="w-5 h-5" /> تصدير Word</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-xl transition-transform active:scale-95"><Printer className="w-5 h-5" /> طباعة رسمية</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 print:hidden">
                <div className="space-y-8">
                    {/* --- واجهة الإدخال --- */}
                    {activeReport === 'initial' ? (
                        <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl animate-slideDown">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4"><Landmark className="text-amber-400 w-8 h-8" /><h3 className="text-white font-black text-xl">بيانات انطلاق الدورة</h3></div>
                            
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 mb-4">
                                <h4 className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest"><UserPlus size={14}/> الطاقم الإداري المسير</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="المدير الإداري" value={reports.initial.adminDirector || ''} onChange={v => updateInitialField('adminDirector', v)} />
                                    <InputField label="نائب المدير البيداغوجي" value={reports.initial.deputyPedagogicalDirector || ''} onChange={v => updateInitialField('deputyPedagogicalDirector', v)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="توقيت الانطلاق" value={reports.initial.startTime || ''} onChange={v => updateInitialField('startTime', v)} />
                                <InputField label="جاهزية القاعات" value={reports.initial.roomsReadiness || ''} onChange={v => updateInitialField('roomsReadiness', v)} />
                                <InputField label="توفر الوسائل" value={reports.initial.toolsAvailability || ''} onChange={v => updateInitialField('toolsAvailability', v)} />
                                <InputField label="ضبط الرزنامة" value={reports.initial.scheduleAdjustment || ''} onChange={v => updateInitialField('scheduleAdjustment', v)} />
                            </div>
                            
                            <TextAreaField label="الصعوبات أو النقائص" value={reports.initial.difficulties} onChange={v => updateInitialField('difficulties', v)} onDictate={() => toggleDictation('difficulties')} isListening={isListening==='difficulties'} />
                            <TextAreaField label="الاقتراحات التصحيحية" value={reports.initial.recommendations} onChange={v => updateInitialField('recommendations', v)} onDictate={() => toggleDictation('recommendations')} isListening={isListening==='recommendations'} />
                        </div>
                    ) : (
                        <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group animate-slideDown">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                <Landmark className="text-dzgreen-400 w-8 h-8" />
                                <h3 className="text-white font-black text-xl tracking-tight uppercase">وحدة تحرير التقارير الاستراتيجية</h3>
                            </div>
                            <div className="space-y-10">
                                <StrategicSection label="1. التوطئة البيداغوجية" value={reports[activeReport].introduction} onChange={v => updateField('introduction', v)} onDictate={() => toggleDictation('introduction')} isListening={isListening === 'introduction'} />
                                <StrategicSection label="2. النشاطات المنفذة" value={reports[activeReport].pedagogicalActivities} onChange={v => updateField('pedagogicalActivities', v)} onDictate={() => toggleDictation('pedagogicalActivities')} isListening={isListening === 'pedagogicalActivities'} suggestions={STRATEGIC_SUGGESTIONS.pedagogicalActivities} onSuggest={s => appendSuggestion('pedagogicalActivities', s)} />
                                <StrategicSection label="3. الظروف اللوجستية" value={reports[activeReport].administrativeConditions} onChange={v => updateField('administrativeConditions', v)} onDictate={() => toggleDictation('administrativeConditions')} isListening={isListening === 'administrativeConditions'} suggestions={STRATEGIC_SUGGESTIONS.administrativeConditions} onSuggest={s => appendSuggestion('administrativeConditions', s)} />
                                <StrategicSection label="4. العوائق المسجلة" value={reports[activeReport].difficulties} onChange={v => updateField('difficulties', v)} onDictate={() => toggleDictation('difficulties')} isListening={isListening === 'difficulties'} suggestions={STRATEGIC_SUGGESTIONS.difficulties} onSuggest={s => appendSuggestion('difficulties', s)} />
                                <StrategicSection label="5. التوصيات والمقترحات" value={reports[activeReport].recommendations} onChange={v => updateField('recommendations', v)} onDictate={() => toggleDictation('recommendations')} isListening={isListening === 'recommendations'} suggestions={STRATEGIC_SUGGESTIONS.recommendations} onSuggest={s => appendSuggestion('recommendations', s)} />
                                <StrategicSection label="6. الخاتمة" value={reports[activeReport].conclusion} onChange={v => updateField('conclusion', v)} onDictate={() => toggleDictation('conclusion')} isListening={isListening === 'conclusion'} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    {/* --- المعاينة المباشرة --- */}
                    <div className="sticky top-40 bg-white text-black p-12 rounded-lg shadow-2xl overflow-y-auto max-h-[85vh] border border-slate-300 font-official scrollbar-hide" id="report-paper-view">
                         {activeReport === 'initial' ? (
                             <InitialReportDoc institution={institution} stats={initialReportStats} instructors={allInstructorsList} data={reports.initial} />
                         ) : (
                             <ProfessionalMinisterialTemplate data={reports[activeReport]} institution={institution} analytics={reportAnalytics} specialties={specialties} />
                         )}
                    </div>
                </div>
            </div>

            {/* --- قوالب الطباعة --- */}
            
            <div id="initial-report-doc" className="hidden">
                <div className="bg-white text-black p-[15mm] min-h-screen font-serif" style={{ direction: 'rtl' }}>
                    <InitialReportDoc institution={institution} stats={initialReportStats} instructors={allInstructorsList} data={reports.initial} />
                </div>
            </div>

            <div id="ministerial-final-doc" className="hidden">
                 <div className="bg-white text-black p-[20mm] min-h-screen relative overflow-hidden font-official shadow-none">
                      <div className="text-watermark">وزارة التربية الوطنية</div>
                      <img src={LOGO_URL} className="watermark-overlay grayscale opacity-5" alt="logo" />
                      <ProfessionalMinisterialTemplate data={reports[activeReport]} institution={institution} analytics={reportAnalytics} specialties={specialties} isPrint={true} />
                 </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const InputField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div><label className="text-[10px] text-slate-500 font-black block mb-1 uppercase">{label}</label><input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500" /></div>
);

const TextAreaField = ({ label, value, onChange, onDictate, isListening }: any) => (
    <div><div className="flex justify-between items-center mb-1"><label className="text-[10px] text-slate-500 font-black block uppercase">{label}</label><button onClick={onDictate} className={`p-1 rounded-full ${isListening?'bg-red-500 text-white animate-pulse':'bg-slate-800 text-slate-500'}`}>{isListening?<MicOff size={12}/>:<Mic size={12}/>}</button></div><textarea value={value} onChange={e => onChange(e.target.value)} className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 resize-none" /></div>
);

const StrategicSection: React.FC<{ label: string, value: string, onChange: (v: string) => void, onDictate: () => void, isListening: boolean, suggestions?: string[], onSuggest?: (s: string) => void }> = ({ label, value, onChange, onDictate, isListening, suggestions, onSuggest }) => (
    <div className="group/section">
        <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>
            <button onClick={onDictate} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
        </div>
        <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm outline-none focus:border-dzgreen-500 transition-all resize-none font-medium leading-relaxed" placeholder="أدخل محتوى التقرير..." />
        {suggestions && (
            <div className="flex flex-wrap gap-2 mt-3">
                {suggestions.map((s, i) => (
                    <button key={i} onClick={() => onSuggest?.(s)} className="text-[9px] bg-slate-800 hover:bg-dzgreen-900/30 hover:text-dzgreen-300 text-slate-400 px-3 py-1.5 rounded-full border border-slate-700/50 transition-all flex items-center gap-1.5 active:scale-95">
                        <MessageSquarePlus className="w-3 h-3" /> {s}
                    </button>
                ))}
            </div>
        )}
    </div>
);

// --- 1. قالب التقرير الأولي (المعدل) ---
const InitialReportDoc: React.FC<{ institution: any, stats: any[], instructors: any[], data: SummaryData }> = ({ institution, stats, instructors, data }) => {
    const totalTrainees = stats.reduce((acc, s) => acc + s.total, 0);
    const targetLevel = stats[0]?.level || 'ابتدائي';

    return (
        <div className="text-black">
            <div className="page-content">
                <div className="text-center mb-4">
                    <h3 className="font-bold text-base">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                    <h3 className="font-bold text-base">وزارة التربية الوطنية</h3>
                    <div className="flex justify-between mt-4 text-[10pt] font-bold">
                        <div className="text-right"><p>مديرية التكوين</p><p>المعهد الوطني لتكوين موظفي قطاع التربية الوطنية</p><p>الشيخ زاهية حسين بالأغواط</p></div>
                        <img src={LOGO_URL} className="w-16 h-16 opacity-80" alt="logo" />
                    </div>
                </div>
                <div className="text-center mb-6">
                    <h1 className="text-[18pt] font-black underline decoration-2">تقرير حول انطلاق العملية التكوينية (التقرير الأولي)</h1>
                    <p className="mt-4 font-bold">مركز إجراء التكوين: {institution.center} ................ الولاية: {institution.wilaya}</p>
                </div>
                
                <div className="mb-4">
                    <div className="flex items-center gap-4 mb-2"><h2 className="font-bold text-[12pt]">1- العدد الإجمالي للمتكونين:</h2><div className="border-2 border-black px-6 py-1 font-black text-xl">{totalTrainees}</div></div>
                    <table className="w-full border-collapse border-2 border-black text-[10pt] text-center report-table">
                        <thead className="bg-gray-100"><tr><th>الرتبة</th><th>مادة التخصص</th><th>الطور</th><th>العدد الإجمالي</th><th>الملتحقين فعلياً</th><th>حالات التأخر</th><th>عدم الالتحاق</th></tr></thead>
                        <tbody>
                            {stats.map((s, i) => (
                                <tr key={i}>
                                    <td className="border border-black font-bold">{s.rank}</td>
                                    <td className="border border-black">{s.spec}</td>
                                    <td className="border border-black">{s.level}</td>
                                    <td className="border border-black font-bold">{s.total}</td>
                                    <td className="border border-black">{s.joined}</td>
                                    <td className="border border-black">0</td>
                                    <td className="border border-black font-black">{s.absent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mb-4">
                    <h2 className="font-bold text-[12pt] mb-2">2- هيئة التأطير:</h2>
                    <table className="w-full border-collapse border-2 border-black text-[10pt] text-center report-table">
                        <thead className="bg-gray-100"><tr><th className="w-40">الرتبة</th><th>قائمة المشرفين على العملية التكوينية</th><th>قائمة المؤطرين</th><th>ملاحظات</th></tr></thead>
                        <tbody>
                            <tr>
                                <td className="border border-black font-black">أستاذ التعليم ال{targetLevel}</td>
                                <td className="border border-black text-right px-2 leading-relaxed font-bold">
                                    <p>• {institution.director} (المدير البيداغوجي)</p>
                                    {data.adminDirector && <p>• {data.adminDirector} (المدير الإداري)</p>}
                                    {data.deputyPedagogicalDirector && <p>• {data.deputyPedagogicalDirector} (نائب المدير البيداغوجي)</p>}
                                </td>
                                <td className="border border-black text-right px-2 text-[8pt]">
                                    <div className="grid grid-cols-2 gap-x-2">
                                        {instructors.map((inst, i) => (
                                            <span key={i} className="font-bold">- {inst.name}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="border border-black italic text-[8pt]">هيئة التأطير المسخرة للدورة</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mb-4">
                    <h2 className="font-bold text-[12pt] mb-2">3- تنظيم الانطلاق الفعلي للتكوين:</h2>
                    <div className="space-y-3 text-[11pt] leading-relaxed pr-4">
                        <p>• تاريخ وتوقيت الانطلاق: <span className="font-bold border-b border-dotted border-black px-4">{SESSIONS[0].startDate} على الساعة {data.startTime}</span></p>
                        <p>• جاهزية القاعات: <span className="font-bold border-b border-dotted border-black px-4">{data.roomsReadiness}</span></p>
                        <p>• توفر الوسائل: <span className="font-bold border-b border-dotted border-black px-4">{data.toolsAvailability}</span></p>
                        <p>• ضبط رزنامة الحصص الأولى: <span className="font-bold border-b border-dotted border-black px-4">{data.scheduleAdjustment}</span></p>
                    </div>
                </div>
            </div>
            <div className="page-break"></div>
            <div className="page-content pt-10">
                <div className="mb-10 min-h-[150px]"><h2 className="font-bold text-[12pt] mb-4 underline">الصعوبات أو النقائص المسجلة عند الانطلاق إن وجدت:</h2><p className="border-b border-dotted border-black leading-10 whitespace-pre-wrap">{data.difficulties || 'لم تسجل أي صعوبات تذكر.'}</p></div>
                <div className="mb-10 min-h-[150px]"><h2 className="font-bold text-[12pt] mb-4 underline">الاقتراحات التصحيحية:</h2><p className="border-b border-dotted border-black leading-10 whitespace-pre-wrap">{data.recommendations || 'مواصلة المرافقة البيداغوجية والحرص على انضباط الأساتذة.'}</p></div>
                <div className="mt-20 flex justify-end px-12"><div className="text-center w-64 font-bold"><p className="mb-16 underline decoration-2">المدير البيداغوجي</p><p>...............................</p></div></div>
            </div>
        </div>
    );
};

// --- 2. قالب التقرير الوزاري المفصل ---
const ProfessionalMinisterialTemplate: React.FC<{ data: SummaryData, institution: InstitutionConfig, analytics: any, specialties: Specialty[], isPrint?: boolean }> = ({ data, institution, analytics, specialties, isPrint }) => {
    if (!analytics) return <div className="text-center p-20 text-gray-400 italic font-tajawal">في انتظار البيانات...</div>;
    const { currentSession, allAbsentees, executionTable, total, maleCount, femaleCount, municipalityTable, specStats } = analytics;

    return (
        <div className="leading-relaxed text-black" style={{ direction: 'rtl' }}>
            {/* HEADER */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h4 className="font-bold text-base mb-1">الجمهورية الجزائرية الديمقراطية الشعبية</h4>
                <h4 className="font-bold text-base mb-1">وزارة التربية الوطنية</h4>
                <div className="flex justify-between items-start mt-6 text-[11px] font-bold font-tajawal px-2">
                    <div className="text-right space-y-1">
                        <p>مديرية التربية لولاية {institution.wilaya || '...................'}</p>
                        <p>مصلحة المستخدمين والتكوين والتفتيش</p>
                        <p>مركز التكوين: {institution.center || '...................'}</p>
                    </div>
                </div>
            </div>

            {/* TITLE */}
            <div className="border-4 border-double border-black p-6 text-center rounded-xl mb-10 bg-gray-50/50">
                <h1 className="text-xl font-black mb-1 uppercase tracking-tight font-title">تقرير حصيلة سير {currentSession.name}</h1>
                <h2 className="text-sm font-bold text-gray-700">لفائدة أساتذة المدرسة الابتدائية (دفعة 2025/2026)</h2>
                <div className="w-full h-px bg-black/10 my-3"></div>
                <p className="text-xs font-black">
                    الفترة المرجعية: من {formatArabicDate(currentSession.startDate)} إلى {formatArabicDate(currentSession.endDate)}
                </p>
            </div>

            {/* TECHNICAL CARD */}
            <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm font-black underline mb-3 flex items-center gap-2"><Layout className="w-4 h-4" /> 1. البطاقة الإحصائية والتقنية للدورة:</h3>
                <table className="w-full border-collapse border-2 border-black text-[10px] text-center font-bold font-tajawal">
                    <tbody>
                        <tr className="h-10">
                            <td className="border border-black bg-gray-100 w-1/4">إجمالي المتكونين</td><td className="border border-black w-1/4 text-sm">{total} أستاذ(ة)</td>
                            <td className="border border-black bg-gray-100 w-1/4">المعهد المشرف</td><td className="border border-black w-1/4">{institution.institute || '...................'}</td>
                        </tr>
                        <tr className="h-10">
                            <td className="border border-black bg-gray-100">توزيع (ذكور)</td><td className="border border-black">{maleCount} أستاذ</td>
                            <td className="border border-black bg-gray-100">توزيع (إناث)</td><td className="border border-black">{femaleCount} أستاذة</td>
                        </tr>
                        <tr className="h-10">
                            <td className="border border-black bg-gray-100">الحجم الساعي المنجز</td><td className="border border-black font-black text-blue-900">{currentSession.hoursTotal} سا</td>
                            <td className="border border-black bg-gray-100">المدير البيداغوجي للمركز</td><td className="border border-black font-black">{institution.director || '...................'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* VISUAL ANALYTICS - FIX FOR PRINTING */}
            <div className="grid grid-cols-2 gap-4 mb-10 h-48 break-inside-avoid">
                <div className="border border-black rounded p-2 flex flex-col items-center">
                    <span className="text-[9px] font-bold mb-2">تعداد المتكونين حسب التخصص</span>
                    {!isPrint ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={specStats} innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                                    {specStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 4]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <PieChart width={150} height={120}>
                            <Pie data={specStats} cx={75} cy={60} innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                                {specStats.map((_, index) => (
                                    <Cell key={`cell-print-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 4]} />
                                ))}
                            </Pie>
                        </PieChart>
                    )}
                    <div className="flex gap-2 mt-1">
                        {specStats.map((s, i) => (
                            <span key={i} className="text-[7px] font-bold">• {s.name}</span>
                        ))}
                    </div>
                </div>
                <div className="border border-black rounded p-2 flex flex-col items-center">
                    <span className="text-[9px] font-bold mb-2">مستوى المشاركة والانضباط (%)</span>
                    {!isPrint ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{n: 'الدورة', v: 98.4}]} margin={{top: 5, right: 20, left: 20, bottom: 5}}>
                                <XAxis dataKey="n" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Bar dataKey="v" fill="#000" barSize={30} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <BarChart width={150} height={120} data={[{n: 'الدورة', v: 98.4}]} margin={{top: 5, right: 20, left: 20, bottom: 5}}>
                            <XAxis dataKey="n" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Bar dataKey="v" fill="#000" barSize={30} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                    )}
                    <span className="text-[8px] font-black mt-2">نسبة الحضور التقديرية: 98.4%</span>
                </div>
            </div>

            {/* MUNICIPALITY TABLE */}
            <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm font-black underline mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> 2. التوزيع الجغرافي للمتكونين حسب البلديات:</h3>
                <div className="grid grid-cols-2 gap-x-10">
                    <table className="w-full border-collapse border border-black text-[9px] text-center font-tajawal">
                        <thead className="bg-gray-100"><tr><th className="border border-black p-1">البلدية</th><th className="border border-black p-1">العدد</th></tr></thead>
                        <tbody>
                            {municipalityTable.slice(0, Math.ceil(municipalityTable.length/2)).map((m, i) => (
                                <tr key={i}><td className="border border-black p-1 text-right px-3 font-bold">{m.name}</td><td className="border border-black p-1 font-black">{m.count}</td></tr>
                            ))}
                        </tbody>
                    </table>
                    <table className="w-full border-collapse border border-black text-[9px] text-center font-tajawal">
                        <thead className="bg-gray-100"><tr><th className="border border-black p-1">البلدية</th><th className="border border-black p-1">العدد</th></tr></thead>
                        <tbody>
                            {municipalityTable.slice(Math.ceil(municipalityTable.length/2)).map((m, i) => (
                                <tr key={i}><td className="border border-black p-1 text-right px-3 font-bold">{m.name}</td><td className="border border-black p-1 font-black">{m.count}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EXECUTION MATRIX */}
            <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm font-black underline mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4" /> 3. تنفيذ المحتوى البيداغوجي:</h3>
                <table className="w-full border-collapse border-2 border-black text-[9px] text-center font-tajawal">
                    <thead className="bg-gray-100 font-bold h-10">
                        <tr>
                            <th className="border border-black p-1 w-1/5">المقياس</th>
                            <th className="border border-black p-1 w-2/5">أهم المحاور المنفذة</th>
                            <th className="border border-black p-1 w-12">الحجم</th>
                            <th className="border border-black p-1">الأساتذة المكونون</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executionTable.map((r: any, idx: number) => (
                            <tr key={idx} className="h-10">
                                <td className="border border-black p-1 font-black text-right px-2 bg-gray-50/50">{r.title}</td>
                                <td className="border border-black p-1 text-right leading-relaxed px-2 font-medium">{r.topics}</td>
                                <td className="border border-black p-1 font-black">{r.planned} سا</td>
                                <td className="border border-black p-1 font-black">{r.trainers}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* NARRATIVE SECTIONS */}
            <div className="space-y-10 mb-10">
                {['introduction', 'pedagogicalActivities', 'administrativeConditions', 'difficulties', 'recommendations', 'conclusion'].map((field, i) => data[field as keyof SummaryData] && (
                    <div key={i} className="mb-6">
                        <h3 className="text-sm font-black underline mb-3 text-slate-900 uppercase">
                            {i + 4}. {
                                field === 'introduction' ? 'توطئة بيداغوجية عامة:' : 
                                field === 'pedagogicalActivities' ? 'تقييم النشاطات البيداغوجية والتحصيل:' :
                                field === 'administrativeConditions' ? 'الظروف المادية والتنظيمية:' :
                                field === 'difficulties' ? 'العوائق والصعوبات المسجلة ميدانياً:' :
                                field === 'recommendations' ? 'الاقتراحات والتوصيات الاستراتيجية:' : 'خاتمة التقرير:'
                            }
                        </h3>
                        <p className="text-justify whitespace-pre-wrap leading-7 text-[14px] font-official text-black">
                            {data[field as keyof SummaryData]}
                        </p>
                    </div>
                ))}
            </div>

            {/* ATTENDANCE SUMMARY */}
            <div className="mt-10 mb-10 break-inside-avoid">
                <h3 className="text-sm font-black underline mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
                    <SearchCheck className="w-6 h-6 text-dzgreen-600" /> 
                    {data.conclusion ? '10' : '9'}. كشف إحصائيات الغيابات الفعلية المسجلة:
                </h3>
                {allAbsentees.length > 0 ? (
                    <table className="w-full border-collapse border-2 border-black text-[10px] text-center font-tajawal">
                        <thead className="bg-gray-100 font-black h-10">
                            <tr>
                                <th className="border border-black p-1 w-10">#</th>
                                <th className="border border-black p-1 w-1/2">اللقب والاسم الكامل</th>
                                <th className="border border-black p-1">التخصص</th>
                                <th className="border border-black p-1">أيام الغياب</th>
                                <th className="border border-black p-1 text-blue-900">الحجم الضائع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allAbsentees.map((t: any, idx: number) => (
                                <tr key={idx} className="h-10 font-bold bg-white">
                                    <td className="border border-black">{idx + 1}</td>
                                    <td className="border border-black text-right px-4">{t.surname} {t.name}</td>
                                    <td className="border border-black">{specialties.find(s=>s.id === t.specialtyId)?.name}</td>
                                    <td className="border border-black">{t.missedDays} يوم</td>
                                    <td className="border border-black font-black text-blue-900">{t.missedHours} سا</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-6 border-2 border-dashed border-dzgreen-400 rounded-xl bg-dzgreen-50 text-dzgreen-800 font-black text-center text-sm">
                        لم يتم تسجيل أي حالات غياب طيلة أيام هذه الدورة، مما يعكس انضباطاً عالياً من طرف الأساتذة المكونين والمتكونين.
                    </div>
                )}
            </div>

            {/* FINAL SIGNATURE */}
            <div className="mt-20 flex justify-end px-12 pb-10">
                <div className="text-center w-80">
                    <p className="font-black text-base underline underline-offset-8">المديـر البيداغوجي للمركز</p>
                </div>
            </div>
        </div>
    );
};

export default SummaryReport;