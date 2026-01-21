
import React, { useState, useEffect } from 'react';
import { SESSIONS, MODULES, SPECIALTIES } from '../constants';
import { GroupSchedule, TrainerAssignment, TrainerConfig, Specialty } from '../types';
import { getWorkingDays, formatDate } from '../utils';
import { AlertTriangle, CheckCircle2, ArrowRightLeft, GripVertical, Clock } from 'lucide-react';

const TimetableEditor: React.FC = () => {
    const [schedule, setSchedule] = useState<GroupSchedule[]>([]);
    const [assignments, setAssignments] = useState<TrainerAssignment[]>([]);
    const [trainerConfig, setTrainerConfig] = useState<TrainerConfig>({});
    const [selectedSessionId, setSelectedSessionId] = useState(1);
    const [selectedGroupGlobalId, setSelectedGroupGlobalId] = useState<string>('');
    const [draggedSlot, setDraggedSlot] = useState<{ dayIdx: number, hourIdx: number, moduleId: number } | null>(null);
    const [dropFeedback, setDropFeedback] = useState<{ status: 'allowed' | 'forbidden', message: string } | null>(null);

    useEffect(() => {
        const s = localStorage.getItem('takwin_schedule');
        const a = localStorage.getItem('takwin_assignments');
        const t = localStorage.getItem('takwin_trainers_db');
        if (s) setSchedule(JSON.parse(s));
        if (a) setAssignments(JSON.parse(a));
        if (t) setTrainerConfig(JSON.parse(t));
    }, []);

    const currentSession = SESSIONS.find(s => s.id === selectedSessionId) || SESSIONS[0];
    const workingDays = getWorkingDays(currentSession.startDate, currentSession.endDate);

    const currentGroupSchedule = schedule.find(g => {
        if (!selectedGroupGlobalId) return false;
        const [specId, localId] = selectedGroupGlobalId.split('-');
        return g.specialtyId === specId && g.groupId === parseInt(localId);
    });

    const getTrainerIdentity = (mId: number, key: string) => {
        const name = trainerConfig[mId]?.names?.[key]?.trim();
        return name && name.length > 1 ? `PRO:${name.toLowerCase()}` : `RAW:${mId}-${key}`;
    };

    const checkConflict = (moduleId: number, targetDayIdx: number, targetHourIdx: number): { conflict: boolean, reason: string } => {
        const existingAssign = assignments.find(a => a.sessionId === selectedSessionId && a.groupId === selectedGroupGlobalId && a.moduleId === moduleId);
        if (!existingAssign) return { conflict: false, reason: '' };
        const identity = getTrainerIdentity(moduleId, existingAssign.trainerKey);
        const conflict = assignments.find(a => a.sessionId === selectedSessionId && a.dayIndex === targetDayIdx && a.hourIndex === targetHourIdx && getTrainerIdentity(a.moduleId, a.trainerKey) === identity && a.groupId !== selectedGroupGlobalId);
        if (conflict) return { conflict: true, reason: `تعارض: الأستاذ يدرس فوجاً آخر في هذا التوقيت.` };
        return { conflict: false, reason: '' };
    };

    const handleDrop = (targetDayIdx: number, targetHourIdx: number) => {
        if (!draggedSlot || !currentGroupSchedule) return;
        const { conflict } = checkConflict(draggedSlot.moduleId, targetDayIdx, targetHourIdx);
        if (conflict) { alert("لا يمكن النقل لوجود تعارض في توقيت الأستاذ."); return; }

        const newSchedule = [...schedule];
        const groupIdx = newSchedule.findIndex(g => `${g.specialtyId}-${g.groupId}` === selectedGroupGlobalId);
        const sourceDate = workingDays[draggedSlot.dayIdx].toISOString();
        const targetDate = workingDays[targetDayIdx].toISOString();

        const sDay = newSchedule[groupIdx].days.find(d => d.date === sourceDate);
        const tDay = newSchedule[groupIdx].days.find(d => d.date === targetDate);

        if (!sDay || !tDay) return;

        const sSlotIdx = sDay.slots.findIndex(s => parseInt(s.time) === (8 + draggedSlot.hourIdx));
        const tSlotIdx = tDay.slots.findIndex(s => parseInt(s.time) === (8 + targetHourIdx));

        const sourceModId = draggedSlot.moduleId;
        let targetModId: number | null = null;

        if (tSlotIdx !== -1) {
            targetModId = tDay.slots[tSlotIdx].moduleId;
            const revCheck = checkConflict(targetModId!, draggedSlot.dayIdx, draggedSlot.hourIdx);
            if (revCheck.conflict) { alert("تعارض عكسي: الأستاذ البديل مشغول في الوقت المصدر."); return; }
        }

        if (sSlotIdx !== -1) sDay.slots.splice(sSlotIdx, 1);
        if (tSlotIdx !== -1) tDay.slots.splice(tSlotIdx, 1);

        tDay.slots.push({ time: `${8+targetHourIdx}:00`, moduleId: sourceModId, duration: 1 });
        if (targetModId) sDay.slots.push({ time: `${8+draggedSlot.hourIdx}:00`, moduleId: targetModId, duration: 1 });

        const updatedAssignments = assignments.map(a => {
            if (a.sessionId === selectedSessionId && a.groupId === selectedGroupGlobalId && a.dayIndex === draggedSlot.dayIdx && a.hourIndex === draggedSlot.hourIdx) return { ...a, dayIndex: targetDayIdx, hourIndex: targetHourIdx };
            if (targetModId && a.sessionId === selectedSessionId && a.groupId === selectedGroupGlobalId && a.dayIndex === targetDayIdx && a.hourIndex === targetHourIdx) return { ...a, dayIndex: draggedSlot.dayIdx, hourIndex: draggedSlot.hourIdx };
            return a;
        });

        setSchedule(newSchedule);
        setAssignments(updatedAssignments);
        localStorage.setItem('takwin_schedule', JSON.stringify(newSchedule));
        localStorage.setItem('takwin_assignments', JSON.stringify(updatedAssignments));
        setDraggedSlot(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><ArrowRightLeft className="text-amber-400" /> تعديل يدوي ذكي (6 حصص)</h2>
                        <div className="flex gap-4 mt-4">
                            <select value={selectedGroupGlobalId} onChange={e => setSelectedGroupGlobalId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white w-64 outline-none">
                                <option value="">-- اختر الفوج للتعديل --</option>
                                {Object.entries(trainerConfig).length > 0 && SPECIALTIES.map(s => Array.from({length: 4}).map((_,i) => <option key={`${s.id}-${i+1}`} value={`${s.id}-${i+1}`}>{s.name} - فوج {i+1}</option>))}
                            </select>
                            <div className="flex bg-slate-800 rounded-lg p-1">
                                {SESSIONS.map(s => <button key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`px-4 py-1.5 rounded-md text-xs font-bold ${selectedSessionId === s.id ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>{s.name}</button>)}
                            </div>
                        </div>
                    </div>
                </div>

                {selectedGroupGlobalId && currentGroupSchedule ? (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                        <div className="grid grid-cols-7 gap-2 text-center min-w-[900px]">
                            <div className="bg-slate-800 p-3 rounded-lg font-bold text-slate-400">اليوم / التوقيت</div>
                            {[0,1,2,3,4,5].map(h => <div key={h} className="bg-slate-800 p-3 rounded-lg font-bold text-slate-300 text-xs">{8+h}:00 - {9+h}:00</div>)}
                            {workingDays.map((day, dIdx) => (
                                <React.Fragment key={dIdx}>
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-[10px] font-bold text-white flex items-center justify-center">{formatDate(day.toISOString())}</div>
                                    {[0,1,2,3,4,5].map(hIdx => {
                                        const daySched = currentGroupSchedule.days.find(d => d.date === day.toISOString());
                                        const slot = daySched?.slots.find(s => parseInt(s.time) === (8 + hIdx));
                                        return (
                                            <div key={hIdx} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(dIdx, hIdx)}
                                                draggable={!!slot} onDragStart={() => slot && setDraggedSlot({ dayIdx: dIdx, hourIdx: hIdx, moduleId: slot.moduleId! })}
                                                className={`h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-2 transition-all ${slot ? 'bg-slate-800 border-blue-500/50 cursor-grab active:cursor-grabbing' : 'bg-slate-900/30 border-slate-800 hover:border-slate-600'}`}
                                            >
                                                {slot ? (
                                                    <><span className="text-[10px] font-black text-white leading-tight">{MODULES.find(m => m.id === slot.moduleId)?.shortTitle}</span>
                                                    <span className="text-[8px] text-slate-500 mt-1">{assignments.find(a => a.sessionId === selectedSessionId && a.groupId === selectedGroupGlobalId && a.dayIndex === dIdx && a.hourIndex === hIdx)?.trainerKey}</span></>
                                                ) : <span className="text-slate-800 text-[10px]">فراغ</span>}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : <div className="p-20 text-center text-slate-600 font-bold border-2 border-dashed border-slate-800 rounded-2xl">يرجى اختيار الفوج من القائمة أعلاه للبدء بالتعديل</div>}
            </div>
        </div>
    );
};

export default TimetableEditor;