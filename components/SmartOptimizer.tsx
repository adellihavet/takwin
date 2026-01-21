
import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, ArrowRightLeft, AlertTriangle, CheckCircle2, Clock, Zap, RefreshCw, ShieldAlert, Info, ArrowDown, ChevronLeft, Calendar } from 'lucide-react';
import { TrainerAssignment, GroupSchedule, TrainerConfig } from '../types';
import { MODULES, SESSIONS } from '../constants';

interface Props {
  sessionId: number;
  assignments: TrainerAssignment[];
  schedule: GroupSchedule[];
  trainerConfig: TrainerConfig;
  onApplySwap: (newAssignments: TrainerAssignment[], newSchedule: GroupSchedule[]) => void;
}

interface Issue {
    trainerIdentity: string;
    trainerName: string;
    type: 'CRITICAL_GAP' | 'ISOLATED' | 'LONG_WAIT';
    dayIndex: number;
    hours: number[];
    gapSize?: number;
    label: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
}

const SmartOptimizer: React.FC<Props> = ({ sessionId, assignments, schedule, trainerConfig, onApplySwap }) => {
  const [activeSessionId, setActiveSessionId] = useState<number>(sessionId);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [proposedSwap, setProposedSwap] = useState<any>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    setActiveSessionId(sessionId);
    setSelectedIssue(null);
    setProposedSwap(null);
  }, [sessionId]);

  const getTrainerIdentity = (mId: number, key: string) => {
    const name = trainerConfig[mId]?.names?.[key]?.trim();
    return name && name.length > 1 ? `NAME:${name.toLowerCase()}` : `RAW:${mId}-${key}`;
  };

  const allIssues = useMemo(() => {
    const issues: Issue[] = [];
    const trainerFullSchedules = new Map<string, { name: string, days: Record<number, number[]> }>();

    assignments.filter(a => a.sessionId === activeSessionId && a.moduleId !== 999).forEach(a => {
        const identity = getTrainerIdentity(a.moduleId, a.trainerKey);
        const name = a.moduleId === 1 
            ? trainerConfig[1]?.names?.[a.trainerKey] 
            : trainerConfig[a.moduleId]?.names?.[a.trainerKey];
        
        if (!trainerFullSchedules.has(identity)) {
            trainerFullSchedules.set(identity, { name: name || a.trainerKey, days: {} });
        }
        
        const sched = trainerFullSchedules.get(identity)!;
        if (!sched.days[a.dayIndex]) sched.days[a.dayIndex] = [];
        sched.days[a.dayIndex].push(a.hourIndex);
    });

    trainerFullSchedules.forEach((data, identity) => {
        Object.entries(data.days).forEach(([dayIdxStr, hours]) => {
            const dayIdx = parseInt(dayIdxStr);
            hours.sort((a, b) => a - b);
            
            if (hours.length === 1) {
                issues.push({
                    trainerIdentity: identity, trainerName: data.name, type: 'ISOLATED', dayIndex: dayIdx, hours: hours,
                    label: 'حصة يتيمة', severity: 'medium',
                    description: `الأستاذ ${data.name} يتنقل من أجل حصة واحدة فقط في هذا اليوم.`
                });
            }

            for (let i = 0; i < hours.length - 1; i++) {
                const waitTime = hours[i + 1] - hours[i] - 1;
                if (waitTime >= 3) {
                    issues.push({
                        trainerIdentity: identity, trainerName: data.name, type: 'CRITICAL_GAP', dayIndex: dayIdx, hours: hours,
                        gapSize: waitTime, label: 'فجوة مرهقة', severity: 'high',
                        description: `انتظار ${waitTime} ساعات بين حصص الأستاذ ${data.name}.`
                    });
                } else if (waitTime === 2) {
                    issues.push({
                        trainerIdentity: identity, trainerName: data.name, type: 'LONG_WAIT', dayIndex: dayIdx, hours: hours,
                        gapSize: waitTime, label: 'فجوة زمنية', severity: 'low',
                        description: `الأستاذ ${data.name} لديه ساعتان فراغ بين حصصه.`
                    });
                }
            }
        });
    });

    return issues.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.severity] - priority[a.severity];
    });
  }, [assignments, activeSessionId, trainerConfig]);

  const findSolutions = (issue: Issue) => {
    setAnalyzing(true);
    setSelectedIssue(issue);
    setProposedSwap(null);

    const dayIdx = issue.dayIndex;
    const hourToMove = issue.hours[issue.hours.length - 1]; 
    
    const targetAssignment = assignments.find(a => 
      a.sessionId === activeSessionId && a.dayIndex === dayIdx && a.hourIndex === hourToMove && 
      getTrainerIdentity(a.moduleId, a.trainerKey) === issue.trainerIdentity
    );

    if (!targetAssignment) { setAnalyzing(false); return; }

    const groupAssignmentsInDay = assignments.filter(a => 
        a.sessionId === activeSessionId && a.groupId === targetAssignment.groupId && a.dayIndex === dayIdx
    );

    const possibleSwaps: any[] = [];

    groupAssignmentsInDay.forEach(alt => {
        if (alt.hourIndex === hourToMove) return;
        const altIdentity = getTrainerIdentity(alt.moduleId, alt.trainerKey);

        const isTargetFreeAtAlt = !assignments.some(a => 
            a.sessionId === activeSessionId && a.dayIndex === dayIdx && a.hourIndex === alt.hourIndex && 
            getTrainerIdentity(a.moduleId, a.trainerKey) === issue.trainerIdentity && a.groupId !== targetAssignment.groupId
        );

        const isAltFreeAtTarget = !assignments.some(a => 
            a.sessionId === activeSessionId && a.dayIndex === dayIdx && a.hourIndex === hourToMove && 
            getTrainerIdentity(a.moduleId, a.trainerKey) === altIdentity && a.groupId !== alt.groupId
        );

        if (isTargetFreeAtAlt && isAltFreeAtTarget) {
            const newHours = [...issue.hours.filter(h => h !== hourToMove), alt.hourIndex].sort((a,b)=>a-b);
            let newMaxWait = 0;
            for(let i=0; i<newHours.length-1; i++) newMaxWait = Math.max(newMaxWait, newHours[i+1]-newHours[i]-1);

            if (newMaxWait < (issue.gapSize || 0) || issue.type === 'ISOLATED') {
                possibleSwaps.push({
                    alt, newWait: newMaxWait,
                    altTrainerName: trainerConfig[alt.moduleId]?.names?.[alt.trainerKey] || alt.trainerKey,
                    altModName: MODULES.find(m => m.id === alt.moduleId)?.shortTitle
                });
            }
        }
    });

    if (possibleSwaps.length > 0) {
      setProposedSwap(possibleSwaps.sort((a, b) => a.newWait - b.newWait)[0]);
    }
    setAnalyzing(false);
  };

  const applySwap = () => {
    if (!proposedSwap || !selectedIssue) return;
    const hourToMove = selectedIssue.hours[selectedIssue.hours.length - 1];
    const targetAssignment = assignments.find(a => a.sessionId === activeSessionId && a.dayIndex === selectedIssue.dayIndex && a.hourIndex === hourToMove && getTrainerIdentity(a.moduleId, a.trainerKey) === selectedIssue.trainerIdentity);
    const altAssignment = proposedSwap.alt;
    
    if (!targetAssignment) return;

    // 1. تحديث قائمة الإسنادات
    const newAssignments = assignments.map(a => {
      if (a === targetAssignment) return { ...a, hourIndex: altAssignment.hourIndex };
      if (a === altAssignment) return { ...a, hourIndex: targetAssignment.hourIndex };
      return a;
    });

    // 2. تحديث هيكل الجدول (Schedule) لضمان انعكاس التغيير في جدول الفوج
    const newSchedule = schedule.map(group => {
        if (`${group.specialtyId}-${group.groupId}` !== targetAssignment.groupId) return group;
        
        const newDays = group.days.map((day, dIdx) => {
            if (dIdx !== selectedIssue.dayIndex) return day;
            
            // تبادل الساعات في مصفوفة الحصص (Slots)
            const newSlots = day.slots.map(slot => {
                const hour = parseInt(slot.time);
                if (hour === (8 + targetAssignment.hourIndex)) return { ...slot, moduleId: altAssignment.moduleId };
                if (hour === (8 + altAssignment.hourIndex)) return { ...slot, moduleId: targetAssignment.moduleId };
                return slot;
            });
            
            return { ...day, slots: newSlots };
        });
        
        return { ...group, days: newDays };
    });

    onApplySwap(newAssignments, newSchedule);
    setSelectedIssue(null);
    setProposedSwap(null);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  const getSeverityStyle = (sev: Issue['severity']) => {
      if (sev === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
      if (sev === 'medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Success */}
      {successToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideDown">
              <CheckCircle2 size={24} />
              <span className="font-bold text-lg">تم تطبيق التحسين ومزامنة الجداول بنجاح!</span>
          </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10 rounded-full"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-800/50 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-lg shadow-indigo-500/20 group">
              <Sparkles className="text-white w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">المحسن الذكي المتزامن</h3>
              <p className="text-slate-400 font-medium flex items-center gap-2 mt-1">
                <ShieldAlert size={14} className="text-dzgreen-400" /> ميزة المزامنة الكلية مفعلة: التعديل يشمل كافة الجداول.
              </p>
            </div>
          </div>
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              {SESSIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveSessionId(s.id)} 
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeSessionId === s.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
                      {s.name.toUpperCase()}
                  </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Issues */}
          <div className="lg:col-span-4 space-y-4 max-h-[650px] overflow-y-auto custom-scrollbar pr-3">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900/90 backdrop-blur py-2 z-10">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" /> قائمة الملاحظات البيداغوجية
                </span>
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-bold">{allIssues.length} مشكلة</span>
            </div>

            {allIssues.length === 0 ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-12 rounded-[2rem] text-center">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                        <CheckCircle2 className="text-emerald-400" size={48} />
                    </div>
                    <h5 className="text-white font-black text-xl mb-2">توزيع مثالي!</h5>
                    <p className="text-slate-500 text-sm leading-relaxed">جداول الأساتذة في هذه الدورة لا تحتوي على أي فجوات أو حصص يتيمة.</p>
                </div>
            ) : (
                allIssues.map((issue, idx) => (
                    <button key={idx} onClick={() => findSolutions(issue)}
                      className={`w-full text-right p-6 rounded-[1.5rem] border-2 transition-all group relative overflow-hidden ${selectedIssue === issue ? 'bg-indigo-600/90 border-indigo-400 shadow-2xl scale-[1.03]' : 'bg-slate-800/30 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${getSeverityStyle(issue.severity)}`}>{issue.label}</span>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black">
                            <Calendar size={12}/> اليوم {issue.dayIndex + 1}
                        </div>
                      </div>
                      <p className={`font-black text-base transition-colors ${selectedIssue === issue ? 'text-white' : 'text-slate-200 group-hover:text-indigo-400'}`}>{issue.trainerName}</p>
                      <p className={`text-xs mt-2 leading-relaxed ${selectedIssue === issue ? 'text-indigo-100' : 'text-slate-500'}`}>{issue.description}</p>
                      {selectedIssue === issue && <div className="absolute left-0 top-0 h-full w-1.5 bg-white"></div>}
                    </button>
                ))
            )}
          </div>

          {/* Main Area: Solution Hub */}
          <div className="lg:col-span-8">
            <div className="bg-slate-950/40 rounded-[2.5rem] border border-slate-800 p-10 min-h-[600px] relative flex flex-col shadow-inner backdrop-blur-sm">
              {!selectedIssue ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="p-10 bg-slate-900 rounded-full mb-8 border border-slate-800 shadow-2xl"><Clock size={100} className="text-slate-700" /></div>
                    <h4 className="text-2xl font-black text-slate-500">مختبر التحسين الزمني</h4>
                    <p className="text-slate-600 mt-4 max-w-sm font-medium">اختر أستاذاً من القائمة لبدء فحص إمكانيات "التبادل الآمن" لتقليص فجواته الزمنية.</p>
                </div>
              ) : analyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <RefreshCw className="animate-spin text-indigo-500" size={80} strokeWidth={1} />
                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 w-8 h-8 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-white font-black text-xl">تحليل التوافقية العابرة</h4>
                        <p className="text-slate-500 text-sm mt-2">نفحص حالياً جداول كل الأساتذة الآخرين لضمان عدم حدوث تعارضات..</p>
                    </div>
                </div>
              ) : proposedSwap ? (
                <div className="space-y-10 animate-slideUp flex-1 flex flex-col">
                   <div className="bg-indigo-600/10 border border-indigo-500/30 p-8 rounded-[2rem] flex items-start gap-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-3xl -z-10"></div>
                     <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform"><Zap size={32}/></div>
                     <div>
                        <h4 className="text-indigo-100 font-black text-2xl mb-2">تم رصد فرصة تحسين ذهبية!</h4>
                        <p className="text-slate-400 text-base leading-relaxed">
                            يمكننا ترحيل حصة الأستاذ <strong>{selectedIssue.trainerName}</strong> 
                            إلى وقت آخر عبر التبادل مع مقياس <strong>({proposedSwap.altModName})</strong>. 
                            هذا الإجراء سيقلص الفراغ لديه ويحسن جودة يومه البيداغوجي.
                        </p>
                     </div>
                   </div>
                   
                   <div className="flex-1 flex flex-col justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-slate-900/50 p-12 rounded-[3rem] border border-slate-800 shadow-inner relative">
                            <div className="text-center space-y-4">
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">الموقع الحالي</p>
                                <div className="bg-slate-900 border-2 border-red-500/20 py-8 px-4 rounded-[2rem] shadow-lg">
                                    <span className="block text-3xl font-black text-white">الحصة { (selectedIssue.hours[selectedIssue.hours.length-1]) + 1}</span>
                                    <span className="text-[11px] text-slate-500 font-bold block mt-2">{selectedIssue.trainerName}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-indigo-600/40 shadow-2xl relative z-10">
                                    <ArrowRightLeft className="text-white w-8 h-8" />
                                </div>
                                <div className="h-px bg-slate-800 w-full absolute top-1/2 left-0 -z-10"></div>
                            </div>

                            <div className="text-center space-y-4">
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">الموقع المقترح</p>
                                <div className="bg-indigo-950/40 border-2 border-emerald-500/30 py-8 px-4 rounded-[2rem] shadow-2xl">
                                    <span className="block text-3xl font-black text-white">الحصة {proposedSwap.alt.hourIndex + 1}</span>
                                    <span className="text-[11px] text-emerald-400 font-bold block mt-2">{proposedSwap.altTrainerName}</span>
                                </div>
                            </div>
                        </div>
                   </div>

                   <button onClick={applySwap} className="w-full py-8 bg-dzgreen-600 hover:bg-dzgreen-500 text-white font-black text-2xl rounded-[1.8rem] shadow-2xl transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-4 group">
                        <CheckCircle2 size={32} className="group-hover:rotate-12 transition-transform" /> 
                        اعتماد التعديل والمزامنة فوراً
                   </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                    <div className="p-12 bg-red-500/10 rounded-full mb-10 border border-red-500/20 shadow-2xl"><ShieldAlert size={80} className="text-red-500/60" /></div>
                    <h4 className="text-red-400 font-black text-3xl mb-4">تعذر التبادل التلقائي</h4>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
                        بعد فحص كافة الاحتمالات الرياضية، تبين أن أي عملية تبادل في هذا الفوج ستؤدي حتماً لتضارب في مواعيد الأساتذة الآخرين.
                    </p>
                    <div className="mt-12 p-6 bg-slate-900 rounded-[1.5rem] border border-slate-800 flex items-center gap-5 text-right max-w-md mx-auto">
                        <div className="p-3 bg-indigo-500/10 rounded-xl"><Info size={24} className="text-indigo-400" /></div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            يمكنك استخدام <strong className="text-white">"التعديل اليدوي"</strong> لسحب الحصة بنفسك إلى يوم آخر تماماً، حيث يملك المحرك اليدوي مرونة أكبر من هذا التبادل اليومي.
                        </p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartOptimizer;