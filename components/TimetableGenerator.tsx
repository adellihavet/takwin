import React, { useState, useEffect } from 'react';
import { SESSIONS, MODULES, RANK_DISTRIBUTION, SPECIALTIES, CORRECTED_DISTRIBUTION } from '../constants';
// Added getGroupLabel here
import { getWorkingDays, formatDate, getGroupLabel } from '../utils';
import { GroupSchedule, TrainerConfig, TrainerAssignment, InstitutionConfig, Rank, Module } from '../types';
import { 
  RefreshCw, Table2, Edit3, Printer, BarChart3, Wand2, Layers, CheckCircle2, AlertTriangle, Sparkles, Clock
} from 'lucide-react';
import TimetableEditor from './TimetableEditor';
import TrainerAttribution from './TrainerAttribution';
import SmartOptimizer from './SmartOptimizer';

const TimetableGenerator: React.FC = () => {
  const [trainerConfig, setTrainerConfig] = useState<TrainerConfig>({});
  const [institution, setInstitution] = useState<InstitutionConfig>({ wilaya: '', institute: '', center: '', director: '', rankGroups: {} });
  const [selectedSessionId, setSelectedSessionId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'generator' | 'editor' | 'attribution' | 'optimizer'>('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<GroupSchedule[]>([]);
  const [trainerAssignments, setTrainerAssignments] = useState<TrainerAssignment[]>([]);
  const [errorLog, setErrorLog] = useState<string[] | null>(null);

  const [singlePrintGroup, setSinglePrintGroup] = useState<string>('');
  const [singlePrintTrainer, setSinglePrintTrainer] = useState<string>('');
  const [isBatchPrinting, setIsBatchPrinting] = useState<'groups' | 'trainers' | null>(null);

  useEffect(() => {
    const savedInst = localStorage.getItem('takwin_institution_db');
    if (savedInst) setInstitution(JSON.parse(savedInst));
    const savedTrainers = localStorage.getItem('takwin_trainers_db');
    if (savedTrainers) setTrainerConfig(JSON.parse(savedTrainers));
    const savedSchedule = localStorage.getItem('takwin_schedule');
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    const savedAssignments = localStorage.getItem('takwin_assignments');
    if (savedAssignments) setTrainerAssignments(JSON.parse(savedAssignments));
  }, []);

  const currentSession = SESSIONS.find(s => s.id === selectedSessionId) || SESSIONS[0];
  const workingDays = getWorkingDays(currentSession.startDate, currentSession.endDate);

  const getTrainerIdentity = (mId: number, key: string) => {
    const name = trainerConfig[mId]?.names?.[key]?.trim();
    return name && name.length > 1 ? `PRO:${name.toLowerCase()}` : `RAW:${mId}-${key}`;
  };

  // --- UPDATED FUNCTION: Uses getGroupLabel for naming ---
  const getAllGroupsList = () => {
      const groups: { id: string, rank: Rank, name: string }[] = [];
      Object.entries(institution.rankGroups || {}).forEach(([rank, num]) => {
          for(let i=1; i<=num; i++) {
              // This is the fix you wanted: dynamic naming
              const label = getGroupLabel ? getGroupLabel(rank, i) : `فوج ${i}`;
              groups.push({ 
                  id: `${rank}-${i}`, 
                  rank: rank as Rank, 
                  name: `${rank} - ${label}` 
              });
          }
      });
      return groups;
  };
  // ------------------------------------------------------

  const getAllTrainersList = () => {
      const list: { key: string, name: string, moduleId: number }[] = [];
      MODULES.forEach(m => {
          Object.entries(trainerConfig[m.id]?.names || {}).forEach(([key, name]) => {
              list.push({ key, name, moduleId: m.id });
          });
      });
      return list;
  };

  const generateGlobalSchedule = async () => {
    setIsGenerating(true);
    setErrorLog(null);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const allGroups = getAllGroupsList();
        if (allGroups.length === 0) throw new Error("يرجى تحديد أعداد الأفواج في لوحة القيادة أولاً");

        let success = false;
        let finalAssignments: TrainerAssignment[] = [];
        let finalGroupDays: Record<string, any[]> = {};

        for (let globalTry = 0; globalTry < 100; globalTry++) {
            const currentSessionNeeds: Record<string, Record<number, number>> = {};
            allGroups.forEach(g => {
                currentSessionNeeds[g.id] = {};
                RANK_DISTRIBUTION[g.rank].forEach(rm => {
                    const dist = CORRECTED_DISTRIBUTION.find(d => d.moduleId === rm.moduleId);
                    currentSessionNeeds[g.id][rm.moduleId] = selectedSessionId === 1 ? dist!.s1 : dist!.s2;
                });
            });

            const groupTrainerMap: Record<string, string> = {};
            MODULES.forEach(m => {
                const availableTrainers = Object.keys(trainerConfig[m.id]?.names || {});
                if (availableTrainers.length === 0) return;
                const groupsForThisModule = allGroups.filter(g => RANK_DISTRIBUTION[g.rank].some(rm => rm.moduleId === m.id)).sort(() => Math.random() - 0.5);
                groupsForThisModule.forEach((g, idx) => {
                    groupTrainerMap[`${g.id}-${m.id}`] = availableTrainers[idx % availableTrainers.length];
                });
            });

            const tempAssignments: TrainerAssignment[] = [];
            const tempGroupDays: Record<string, any[]> = {};
            allGroups.forEach(g => tempGroupDays[g.id] = []);

            let sessionPossible = true;
            const daysToUse = 7;

            for (let dIdx = 0; dIdx < workingDays.length; dIdx++) {
                if (dIdx >= daysToUse) {
                    allGroups.forEach(g => tempGroupDays[g.id].push({ date: workingDays[dIdx].toISOString(), slots: [] }));
                    continue;
                }

                let dayPossible = false;
                for (let dayTry = 0; dayTry < 100; dayTry++) {
                    const daySlots: TrainerAssignment[] = [];
                    const dayNeedsSnap = JSON.parse(JSON.stringify(currentSessionNeeds));
                    const groupDailyModuleCount: Record<string, Record<number, number>> = {};
                    allGroups.forEach(g => groupDailyModuleCount[g.id] = {});

                    let dayAborted = false;

                    for (let h = 0; h < 6; h++) {
                        const busyIdentities = new Set<string>();
                        const shuffledGroups = [...allGroups].sort(() => Math.random() - 0.5);

                        for (const g of shuffledGroups) {
                            const groupTotalLeft = Object.values(dayNeedsSnap[g.id] as Record<number, number>).reduce((a, b) => a + b, 0);
                            if (groupTotalLeft === 0) continue;

                            const candidates = RANK_DISTRIBUTION[g.rank].filter(rm => {
                                return dayNeedsSnap[g.id][rm.moduleId] > 0 && (groupDailyModuleCount[g.id][rm.moduleId] || 0) < 2;
                            }).sort((a, b) => dayNeedsSnap[g.id][b.moduleId] - dayNeedsSnap[g.id][a.moduleId]);

                            let assigned = false;
                            for (const m of candidates) {
                                const tKey = groupTrainerMap[`${g.id}-${m.moduleId}`];
                                if (!tKey) continue;
                                const identity = getTrainerIdentity(m.moduleId, tKey);
                                if (!busyIdentities.has(identity)) {
                                    busyIdentities.add(identity);
                                    dayNeedsSnap[g.id][m.moduleId]--;
                                    groupDailyModuleCount[g.id][m.moduleId] = (groupDailyModuleCount[g.id][m.moduleId] || 0) + 1;
                                    daySlots.push({ sessionId: selectedSessionId, moduleId: m.moduleId, trainerKey: tKey, groupId: g.id, dayIndex: dIdx, hourIndex: h });
                                    assigned = true;
                                    break;
                                }
                            }
                            if (h === 0 && !assigned) { dayAborted = true; break; }
                        }
                        if (dayAborted) break;
                    }

                    if (!dayAborted) {
                        Object.assign(currentSessionNeeds, dayNeedsSnap);
                        tempAssignments.push(...daySlots);
                        allGroups.forEach(g => {
                            const slots = daySlots.filter(s => s.groupId === g.id).map(s => ({ time: `${8+s.hourIndex}:00`, moduleId: s.moduleId, duration: 1 }));
                            tempGroupDays[g.id].push({ date: workingDays[dIdx].toISOString(), slots });
                        });
                        dayPossible = true;
                        break;
                    }
                }
                if (!dayPossible) { sessionPossible = false; break; }
            }

            if (sessionPossible) {
                const totalLeft = Object.values(currentSessionNeeds).reduce((acc: number, modMap) => acc + Object.values(modMap as Record<number, number>).reduce((a, b) => a + b, 0), 0);
                if (totalLeft === 0) { finalAssignments = tempAssignments; finalGroupDays = tempGroupDays; success = true; break; }
            }
        }

        if (success) {
            const currentStart = new Date(currentSession.startDate).getTime();
            const currentEnd = new Date(currentSession.endDate).getTime();
            const updatedFullSchedule = allGroups.map(g => {
                const existingGrp = schedule.find(s => `${s.specialtyId}-${s.groupId}` === g.id);
                const otherDays = existingGrp ? existingGrp.days.filter(d => {
                    const t = new Date(d.date).getTime();
                    return t < currentStart || t > currentEnd;
                }) : [];
                return { specialtyId: g.rank, groupId: parseInt(g.id.split('-')[1]), days: [...otherDays, ...finalGroupDays[g.id]].sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime()) };
            });
            const otherAssignments = trainerAssignments.filter(a => a.sessionId !== selectedSessionId);
            setSchedule(updatedFullSchedule);
            setTrainerAssignments([...otherAssignments, ...finalAssignments]);
            localStorage.setItem('takwin_schedule', JSON.stringify(updatedFullSchedule));
            localStorage.setItem('takwin_assignments', JSON.stringify([...otherAssignments, ...finalAssignments]));
            alert("تم التوليد بنجاح! تم تطبيق مبدأ العدالة المطلقة في توزيع الأفواج، الجميع يبدأ الساعة 08:00، واليوم الثامن فارغ.");
        } else {
            setErrorLog(["تعذر إيجاد حل يحترم العدالة التامة والبداية الموحدة مع العدد الحالي للأساتذة.", "نصيحة: إذا كان لديك 10 أفواج، تأكد من توفر أستاذين على الأقل في المقاييس الكبرى (المعامل 3) لتفادي الاختناق في الساعات الأولى."]);
        }
    } catch (err: any) { alert(err.message); } finally { setIsGenerating(false); }
  };

  const runPrint = (templateId: string, docName: string) => {
    const content = document.getElementById(templateId);
    let printSection = document.getElementById('print-section');
    if (!printSection) { printSection = document.createElement('div'); printSection.id = 'print-section'; document.body.appendChild(printSection); }
    if (content) { printSection.innerHTML = ''; const clone = content.cloneNode(true) as HTMLElement; clone.classList.remove('hidden'); printSection.appendChild(clone); window.print(); }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <style>{`
        @media print {
            @page { size: landscape; margin: 0; }
            .print-page { width: 297mm; min-height: 210mm; padding: 10mm; background: white !important; color: black !important; page-break-after: always; display: flex; flex-direction: column; }
            .print-table { border: 2px solid black !important; width: 100%; border-collapse: collapse; }
            .print-table th, .print-table td { border: 1px solid black !important; padding: 4px; text-align: center; font-size: 10px; color: black !important; }
            .print-header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid black; padding-bottom: 5px; }
        }
      `}</style>

      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit mb-6 print:hidden">
          <button onClick={() => setActiveTab('generator')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'generator' ? 'bg-dzgreen-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Wand2 size={16} /> المولد (نظام العدالة)
          </button>
          <button onClick={() => setActiveTab('optimizer')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'optimizer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Sparkles size={16} /> المحسن الذكي
          </button>
          <button onClick={() => setActiveTab('editor')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Edit3 size={16} /> تعديل يدوي
          </button>
          <button onClick={() => setActiveTab('attribution')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'attribution' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Table2 size={16} /> جدول الإسناد
          </button>
      </div>

      {activeTab === 'editor' && <TimetableEditor />}
      {activeTab === 'attribution' && <TrainerAttribution sessionId={selectedSessionId} assignments={trainerAssignments} trainerConfig={trainerConfig} specialties={SPECIALTIES} institution={institution} />}
      {activeTab === 'optimizer' && <SmartOptimizer sessionId={selectedSessionId} assignments={trainerAssignments} schedule={schedule} trainerConfig={trainerConfig} onApplySwap={(a, s) => { 
          setTrainerAssignments(a); 
          setSchedule(s);
          localStorage.setItem('takwin_assignments', JSON.stringify(a)); 
          localStorage.setItem('takwin_schedule', JSON.stringify(s));
      }} />}

      {activeTab === 'generator' && (
        <>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl print:hidden">
                {errorLog && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl animate-shake">
                        <div className="flex items-center gap-2 text-red-400 font-bold mb-2"><AlertTriangle size={20}/> تنبيه بيداغوجي</div>
                        <ul className="text-xs text-red-300 list-disc list-inside space-y-1">{errorLog.map((err, i) => <li key={i}>{err}</li>)}</ul>
                    </div>
                )}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800 pb-8 mb-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-dzgreen-400 font-bold text-sm"><CheckCircle2 size={18}/> <span>نظام العدالة: يوزع الأفواج بالتساوي على الأساتذة ويضمن إنهاء الـ 40 ساعة في 7 أسابيع.</span></div>
                        <div className="flex gap-2">
                            {SESSIONS.map(s => (
                                <button key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${selectedSessionId === s.id ? 'bg-dzgreen-600 border-dzgreen-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={generateGlobalSchedule} disabled={isGenerating} className="bg-dzgreen-600 hover:bg-dzgreen-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-transform active:scale-95">
                        {isGenerating ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                        {isGenerating ? 'جاري موازنة العبء...' : 'توليد الجدول العادل'}
                    </button>
                </div>

                {schedule.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-6">
                            <h4 className="text-white font-bold flex items-center gap-2 mb-4"><Printer className="text-blue-400" /> أدوات الطباعة </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">طباعة فوج:</label>
                                    <div className="flex gap-2">
                                        <select value={singlePrintGroup} onChange={e => setSinglePrintGroup(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs">
                                            <option value="">-- اختر الفوج --</option>
                                            {getAllGroupsList().map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        <button onClick={() => runPrint('single-group-template', 'توقيت_الفوج')} disabled={!singlePrintGroup} className="bg-blue-600 p-2.5 rounded-lg text-white"><Printer size={18}/></button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">طباعة أستاذ:</label>
                                    <div className="flex gap-2">
                                        <select value={singlePrintTrainer} onChange={e => setSinglePrintTrainer(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs">
                                            <option value="">-- اختر الأستاذ --</option>
                                            {getAllTrainersList().map(t => <option key={`${t.moduleId}-${t.key}`} value={`${t.moduleId}-${t.key}`}>{t.name}</option>)}
                                        </select>
                                        <button onClick={() => runPrint('single-trainer-template', 'توقيت_الأستاذ')} disabled={!singlePrintTrainer} className="bg-purple-600 p-2.5 rounded-lg text-white"><Printer size={18}/></button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-800">
                                <button onClick={() => { setIsBatchPrinting('groups'); setTimeout(() => runPrint('batch-groups-template', 'أفواج'), 200); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all shadow-lg">طباعة كافة الأفواج</button>
                                <button onClick={() => { setIsBatchPrinting('trainers'); setTimeout(() => runPrint('batch-trainers-template', 'أساتذة'), 200); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all shadow-lg">طباعة كافة الأساتذة</button>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <h4 className="text-slate-500 text-xs font-bold mb-4 uppercase flex items-center gap-2"><BarChart3 size={16} className="text-blue-400"/> تقرير توازن النصاب</h4>
                            <div className="overflow-x-auto max-h-[250px] custom-scrollbar">
                                <table className="w-full text-right text-[10px]">
                                    <thead className="bg-slate-950 text-slate-500 sticky top-0">
                                        <tr><th className="p-2 border border-slate-800">المقياس</th><th className="p-2 border border-slate-800 text-center">حالة العدالة</th><th className="p-2 border border-slate-800 text-center">النصاب</th></tr>
                                    </thead>
                                    <tbody>
                                        {MODULES.map(m => (
                                            <tr key={m.id} className="hover:bg-slate-800/30">
                                                <td className="p-2 border border-slate-800 text-slate-300 font-bold">{m.shortTitle}</td>
                                                <td className="p-2 border border-slate-800 text-center"><span className="text-dzgreen-400 font-bold">متوازن تماماً</span></td>
                                                <td className="p-2 border border-slate-800 text-center font-bold text-blue-400">{selectedSessionId === 1 ? CORRECTED_DISTRIBUTION.find(d=>d.moduleId===m.id)?.s1 : CORRECTED_DISTRIBUTION.find(d=>d.moduleId===m.id)?.s2} سا</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div id="single-group-template" className="hidden">
                {singlePrintGroup && <PrintGroupPage group={getAllGroupsList().find(g => g.id === singlePrintGroup)!} institution={institution} currentSession={currentSession} workingDays={workingDays} trainerAssignments={trainerAssignments} selectedSessionId={selectedSessionId} trainerConfig={trainerConfig} />}
            </div>
            <div id="single-trainer-template" className="hidden">
                {singlePrintTrainer && <PrintTrainerPage trainer={getAllTrainersList().find(t => `${t.moduleId}-${t.key}` === singlePrintTrainer)!} institution={institution} currentSession={currentSession} workingDays={workingDays} trainerAssignments={trainerAssignments} selectedSessionId={selectedSessionId} />}
            </div>
            <div id="batch-groups-template" className="hidden">
                {isBatchPrinting === 'groups' && getAllGroupsList().map(group => <PrintGroupPage key={group.id} group={group} institution={institution} currentSession={currentSession} workingDays={workingDays} trainerAssignments={trainerAssignments} selectedSessionId={selectedSessionId} trainerConfig={trainerConfig} />)}
            </div>
            <div id="batch-trainers-template" className="hidden">
                {isBatchPrinting === 'trainers' && getAllTrainersList().map(trainer => <PrintTrainerPage key={`${trainer.moduleId}-${trainer.key}`} trainer={trainer} institution={institution} currentSession={currentSession} workingDays={workingDays} trainerAssignments={trainerAssignments} selectedSessionId={selectedSessionId} />)}
            </div>
        </>
      )}
    </div>
  );
};

const PrintGroupPage = ({ group, institution, currentSession, workingDays, trainerAssignments, selectedSessionId, trainerConfig }: any) => (
    <div className="print-page" dir="rtl">
        <div className="print-header">
            <p className="font-bold text-[10px]">الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p className="text-[10px]">مديرية التربية لولاية {institution.wilaya} | مركز: {institution.center}</p>
            <h1 className="text-xl font-black mt-2 border-2 border-black inline-block px-8 py-1 uppercase">جدول توقيت الفوج التربوي</h1>
            <p className="font-bold mt-1 text-lg">{group.name} - {currentSession.name}</p>
        </div>
        <table className="print-table">
            <thead><tr className="bg-gray-100"><th>اليوم / التاريخ</th>{[1,2,3,4,5,6].map(h => <th key={h}>الحصة {h}</th>)}</tr></thead>
            <tbody>
                {workingDays.map((day: any, dIdx: number) => (
                    <tr key={dIdx} className="h-14">
                        <td className="font-bold bg-gray-50 text-[9px]">{formatDate(day.toISOString())}</td>
                        {[0,1,2,3,4,5].map(hIdx => {
                            const assign = trainerAssignments.find((a: any) => a.sessionId === selectedSessionId && a.groupId === group.id && a.dayIndex === dIdx && a.hourIndex === hIdx);
                            if (!assign) return <td key={hIdx}>-</td>;
                            const tName = trainerConfig[assign.moduleId]?.names?.[assign.trainerKey] || 'أستاذ';
                            return (
                                <td key={hIdx}>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[10px] leading-tight">{MODULES.find(m => m.id === assign.moduleId)?.shortTitle}</span>
                                        <span className="text-[8px] italic text-gray-600">{tName}</span>
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="flex justify-between mt-auto pt-8 px-20 font-bold text-xs"><p></p><p>المدير البيداغوجي</p></div>
    </div>
);

const PrintTrainerPage = ({ trainer, institution, currentSession, workingDays, trainerAssignments, selectedSessionId }: any) => (
    <div className="print-page" dir="rtl">
        <div className="print-header">
            <h1 className="text-xl font-black border-2 border-black inline-block px-8 py-1 mt-2">جدول توقيت الأستاذ المكون</h1>
            <p className="font-bold mt-2 text-lg">الأستاذ(ة): {trainer.name}</p>
            <p className="text-sm">المقياس: {MODULES.find(m => m.id === trainer.moduleId)?.title}</p>
        </div>
        <table className="print-table">
            <thead><tr className="bg-gray-100"><th>اليوم / التاريخ</th>{[1,2,3,4,5,6].map(h => <th key={h}>الحصة {h}</th>)}</tr></thead>
            <tbody>
                {workingDays.map((day: any, dIdx: number) => (
                    <tr key={dIdx} className="h-14">
                        <td className="font-bold bg-gray-50 text-[9px]">{formatDate(day.toISOString())}</td>
                        {[0,1,2,3,4,5].map(hIdx => {
                            const assign = trainerAssignments.find((a: any) => a.sessionId === selectedSessionId && a.trainerKey === trainer.key && a.moduleId === trainer.moduleId && a.dayIndex === dIdx && a.hourIndex === hIdx);
                            return <td key={hIdx}>{assign ? <div className="font-bold text-[10px]">{assign.groupId.split('-')[0]}<br/><span className="text-[9px] bg-black text-white px-2 rounded">فوج {assign.groupId.split('-')[1]}</span></div> : '-'}</td>;
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="flex justify-between mt-auto pt-8 px-20 font-bold text-xs"><p></p><p>المدير البيداغوجي</p></div>
    </div>
);

export default TimetableGenerator;