
import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowRightLeft, Users, BookOpen, Save, AlertCircle, CheckCircle2, Info, Search, Trash2, Link, Layers, MoreHorizontal, UserCheck, Link2Off, AlertTriangle, Wand2, ChevronRight, Check, X as XIcon, UserCircle, Eye, ShieldAlert, History } from 'lucide-react';
import { TrainerAssignment, TrainerConfig, Specialty, Module } from '../types';
import { MODULES, SESSIONS, SPECIALTIES } from '../constants';
import { formatDate } from '../utils';

interface Props {
    sessionId: number;
    assignments: TrainerAssignment[];
    trainerConfig: TrainerConfig;
    specialties: Specialty[];
    onUpdate: (newAssignments: TrainerAssignment[], newConfig: TrainerConfig) => void;
}

const TrainerAssignmentHub: React.FC<Props> = ({ sessionId, assignments, trainerConfig, specialties, onUpdate }) => {
    // UI State
    const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [newTrainerName, setNewTrainerName] = useState('');
    const [isAddingTrainer, setIsAddingTrainer] = useState(false);
    
    // Wizard State
    const [wizardSpec, setWizardSpec] = useState<string>('pe');
    const [wizardGroupA, setWizardGroupA] = useState<number>(1);
    const [wizardGroupB, setWizardGroupB] = useState<number>(2);
    const [wizardTrainerKey, setWizardTrainerKey] = useState<string>('');
    
    // Preview State (The "Fish in the Net" before buying)
    const [previewMode, setPreviewMode] = useState(false);
    const [proposedSlots, setProposedSlots] = useState<any[]>([]);

    // Manual Control States
    const [activeActionRow, setActiveActionRow] = useState<string | null>(null);

    // Working Data (Local Copy)
    const [localAssignments, setLocalAssignments] = useState<TrainerAssignment[]>([]);
    const [localConfig, setLocalConfig] = useState<TrainerConfig>({});

    useEffect(() => {
        setLocalAssignments([...assignments]);
        setLocalConfig(JSON.parse(JSON.stringify(trainerConfig)));
    }, [assignments, trainerConfig]);

    const currentSession = SESSIONS.find(s => s.id === sessionId);

    // --- LOGIC: GET ALL ASSIGNMENTS FOR SELECTED MODULE ---
    const getModuleAssignments = () => {
        return localAssignments
            .filter(a => a.sessionId === sessionId && a.moduleId === selectedModuleId)
            .filter(a => {
                if (!searchTerm) return true;
                const [specId, gNum] = a.groupId.split('-');
                const specName = SPECIALTIES.find(s => s.id === specId)?.name || '';
                return specName.includes(searchTerm) || gNum.includes(searchTerm);
            })
            .sort((a, b) => a.dayIndex - b.dayIndex || a.hourIndex - b.hourIndex);
    };

    const getAvailableTrainers = () => {
        const conf = localConfig[selectedModuleId] || { names: {} };
        return Object.entries(conf.names).map(([key, name]) => ({ key, name }));
    };

    // --- ACTION: PREVIEW MERGE (WITHOUT SAVING) ---
    const handleGeneratePreview = () => {
        if (wizardGroupA === wizardGroupB) {
            alert("يرجى اختيار فوجين مختلفين.");
            return;
        }
        if (!wizardTrainerKey) {
            alert("يرجى اختيار الأستاذ أولاً لمعاينة توقيته.");
            return;
        }

        const idA = `${wizardSpec}-${wizardGroupA}`;
        const idB = `${wizardSpec}-${wizardGroupB}`;
        // Use type assertion for daysCount
        const daysCount = (currentSession as any)?.daysCount || 10;
        const results = [];

        for (let d = 0; d < daysCount; d++) {
            for (let h = 0; h < 5; h++) {
                const assignA = localAssignments.find(a => a.sessionId === sessionId && a.groupId === idA && a.dayIndex === d && a.hourIndex === h);
                const assignB = localAssignments.find(a => a.sessionId === sessionId && a.groupId === idB && a.dayIndex === d && a.hourIndex === h);
                
                // Check if the trainer is ALREADY busy with something else in this session
                const trainerConflict = localAssignments.find(a => 
                    a.sessionId === sessionId && a.dayIndex === d && a.hourIndex === h && 
                    a.trainerKey === wizardTrainerKey && a.groupId !== idA && a.groupId !== idB
                );

                const isTargetA = assignA?.moduleId === selectedModuleId;
                const isTargetB = assignB?.moduleId === selectedModuleId;

                if (isTargetA || isTargetB) {
                    results.push({
                        day: d,
                        hour: h,
                        type: (isTargetA && isTargetB) ? 'merge' : 'single',
                        conflict: !!trainerConflict,
                        conflictName: trainerConflict ? SPECIALTIES.find(s=>s.id === trainerConflict.groupId.split('-')[0])?.name : '',
                        groups: [isTargetA ? `فوج ${wizardGroupA}` : null, isTargetB ? `فوج ${wizardGroupB}` : null].filter(Boolean).join(' + ')
                    });
                }
            }
        }
        
        if (results.length === 0) {
            alert("لم يتم العثور على حصص مشتركة أو قابلة للدمج لهذا المقياس بين هذين الفوجين.");
            return;
        }

        setProposedSlots(results);
        setPreviewMode(true);
    };

    const confirmAndApplyMerge = () => {
        let updated = [...localAssignments];
        const idA = `${wizardSpec}-${wizardGroupA}`;
        const idB = `${wizardSpec}-${wizardGroupB}`;

        proposedSlots.forEach(p => {
            // Force assign both groups to this trainer in this slot
            const idxA = updated.findIndex(a => a.sessionId === sessionId && a.groupId === idA && a.dayIndex === p.day && a.hourIndex === p.hour);
            const idxB = updated.findIndex(a => a.sessionId === sessionId && a.groupId === idB && a.dayIndex === p.day && a.hourIndex === p.hour);

            if (idxA !== -1) updated[idxA] = { ...updated[idxA], trainerKey: wizardTrainerKey, moduleId: selectedModuleId };
            else updated.push({ sessionId, groupId: idA, dayIndex: p.day, hourIndex: p.hour, moduleId: selectedModuleId, trainerKey: wizardTrainerKey });

            if (idxB !== -1) updated[idxB] = { ...updated[idxB], trainerKey: wizardTrainerKey, moduleId: selectedModuleId };
            else updated.push({ sessionId, groupId: idB, dayIndex: p.day, hourIndex: p.hour, moduleId: selectedModuleId, trainerKey: wizardTrainerKey });
        });

        setLocalAssignments(updated);
        setPreviewMode(false);
        setProposedSlots([]);
        alert("تم اعتماد توقيت الدمج الجديد بنجاح.");
    };

    const handleAddNewTrainer = () => {
        if (!newTrainerName.trim()) return;
        const newKey = `ext-${Date.now()}`;
        const updatedConfig = { ...localConfig };
        if (!updatedConfig[selectedModuleId]) updatedConfig[selectedModuleId] = { names: {}, generalCount: 0 };
        updatedConfig[selectedModuleId].names[newKey] = newTrainerName.trim();
        if (selectedModuleId !== 1) updatedConfig[selectedModuleId].generalCount = (updatedConfig[selectedModuleId].generalCount || 0) + 1;
        setLocalConfig(updatedConfig);
        setNewTrainerName('');
        setIsAddingTrainer(false);
    };

    const handleManualAssign = (assignment: TrainerAssignment, newTrainerKey: string) => {
        const conflict = localAssignments.find(a => 
            a.sessionId === sessionId && a.dayIndex === assignment.dayIndex && a.hourIndex === assignment.hourIndex && a.trainerKey === newTrainerKey && a.groupId !== assignment.groupId
        );
        if (conflict) {
            const [specId, gNum] = conflict.groupId.split('-');
            const specName = SPECIALTIES.find(s => s.id === specId)?.name;
            if (!window.confirm(`تحذير: هذا الأستاذ مبرمج بالفعل مع [${specName} - فوج ${gNum}] في هذا الوقت. هل تريد إجراء دمج بيداغوجي يدوي؟`)) return;
        }
        const updated = localAssignments.map(a => (a.sessionId === sessionId && a.moduleId === assignment.moduleId && a.dayIndex === assignment.dayIndex && a.hourIndex === assignment.hourIndex && a.groupId === assignment.groupId) ? { ...a, trainerKey: newTrainerKey } : a);
        setLocalAssignments(updated);
        setActiveActionRow(null);
    };

    const handleSaveAll = () => {
        onUpdate(localAssignments, localConfig);
        alert("تم حفظ جميع التعديلات والدموجات النهائية.");
    };

    const getTrainerName = (key: string, modId: number) => localConfig[modId]?.names[key] || key;

    const checkMergeStatus = (dayIdx: number, hourIdx: number, trainerKey: string, currentGroupId: string) => {
        return localAssignments.filter(a => a.sessionId === sessionId && a.dayIndex === dayIdx && a.hourIndex === hourIdx && a.trainerKey === trainerKey && a.groupId !== currentGroupId).length > 0;
    };

    const moduleAssignments = getModuleAssignments();
    const availableTrainers = getAvailableTrainers();

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-dzgreen-600/20 rounded-xl border border-dzgreen-500/30">
                        <UserCheck className="w-8 h-8 text-dzgreen-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">مركز التحكم المتقدم في الإسناد والدمج</h2>
                        <p className="text-slate-400 text-sm">أضف أساتذة، عاين الدمج بيداغوجياً، وثبت قراراتك النهائية</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAddingTrainer(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold border border-slate-700 transition-all"><UserPlus className="w-5 h-5 text-emerald-400" /> أستاذ جديد</button>
                    <button onClick={handleSaveAll} className="flex items-center gap-2 bg-dzgreen-600 hover:bg-dzgreen-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-dzgreen-900/40 transition-all"><Save className="w-5 h-5" /> حفظ النهائي</button>
                </div>
            </div>

            {/* SECTION 1: SMART MERGE WIZARD */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Wand2 className="text-blue-400 w-6 h-6" /></div>
                    <h3 className="text-xl font-black text-white">مساعد الدمج البيداغوجي الذكي (معاينة مباشرة)</h3>
                </div>

                {!previewMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500">1. التخصص</label>
                            <select value={wizardSpec} onChange={e => setWizardSpec(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm">
                                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500">2. المقياس</label>
                            <select value={selectedModuleId} onChange={e => setSelectedModuleId(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm">
                                {MODULES.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500">3. الفوج الأول</label>
                            <select value={wizardGroupA} onChange={e => setWizardGroupA(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm">
                                {Array.from({length: specialties.find(s=>s.id===wizardSpec)?.groups || 1}).map((_, i) => <option key={i+1} value={i+1}>فوج {i+1}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500">4. الفوج الثاني</label>
                            <select value={wizardGroupB} onChange={e => setWizardGroupB(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm">
                                {Array.from({length: specialties.find(s=>s.id===wizardSpec)?.groups || 1}).map((_, i) => <option key={i+1} value={i+1}>فوج {i+1}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500">5. الأستاذ المكلف بالدمج</label>
                            <select value={wizardTrainerKey} onChange={e => setWizardTrainerKey(e.target.value)} className="w-full bg-slate-900 border border-dzgreen-500 rounded-lg p-2 text-white text-sm">
                                <option value="">-- اختر الأستاذ --</option>
                                {availableTrainers.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-5 flex justify-end mt-2">
                             <button onClick={handleGeneratePreview} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
                                <Eye className="w-5 h-5" /> عاين التوقيت الجديد قبل الحفظ
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-500/20 rounded-full"><Info className="text-blue-400 w-5 h-5" /></div>
                                <div>
                                    <h4 className="text-white font-bold">معاينة جدول الأستاذ: {getTrainerName(wizardTrainerKey, selectedModuleId)}</h4>
                                    <p className="text-slate-400 text-xs">راجع الحصص المدمجة والمنفردة بعينك قبل اعتماد القرار</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setPreviewMode(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold">إلغاء</button>
                                <button onClick={confirmAndApplyMerge} className="bg-dzgreen-600 hover:bg-dzgreen-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg">تأكيد واعتماد الدمج</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {proposedSlots.map((p, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border-2 flex flex-col gap-2 relative transition-all ${p.conflict ? 'bg-red-500/10 border-red-500/50' : p.type === 'merge' ? 'bg-dzgreen-500/10 border-dzgreen-500/40 shadow-inner' : 'bg-blue-500/10 border-blue-500/40'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">يوم {p.day + 1} - {p.hour + 8}:00</span>
                                        {p.type === 'merge' ? <Link className="text-dzgreen-400 w-4 h-4" /> : <UserCircle className="text-blue-400 w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-lg font-black ${p.conflict ? 'text-red-400' : 'text-white'}`}>{p.groups}</span>
                                        <span className={`text-[10px] font-bold ${p.type === 'merge' ? 'text-dzgreen-400' : 'text-blue-400'}`}>{p.type === 'merge' ? 'حصة مدمجة (فوجين معاً)' : 'حصة منفردة (فوج واحد)'}</span>
                                    </div>
                                    {p.conflict && (
                                        <div className="mt-2 bg-red-500/20 p-2 rounded border border-red-500/30 flex gap-2 items-center">
                                            <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" />
                                            <span className="text-[10px] text-red-300 font-bold leading-none">تنبيه: الأستاذ مشغول في هذا الوقت مع تخصص: {p.conflictName}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 2: INDIVIDUAL ASSIGNMENT LOG */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Layers className="text-dzgreen-400 w-4 h-4" /> سجل الحصص القائمة (إسناد فردي / دمج مفعل)
                    </h3>
                    <div className="flex items-center gap-4 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <Search className="w-3 h-3 text-slate-500 mr-2" />
                        <input type="text" placeholder="بحث في السجل..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none text-xs text-white outline-none w-40" />
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-right text-sm border-collapse">
                        <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-slate-800">الحصة</th>
                                <th className="p-4 border-b border-slate-800">الفوج</th>
                                <th className="p-4 border-b border-slate-800">المكلف حالياً</th>
                                <th className="p-4 border-b border-slate-800 text-center">تعديل الأستاذ</th>
                                <th className="p-4 border-b border-slate-800 text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {moduleAssignments.map((a) => {
                                const [specId, gNum] = a.groupId.split('-');
                                const specName = SPECIALTIES.find(s => s.id === specId)?.name;
                                const isMerged = checkMergeStatus(a.dayIndex, a.hourIndex, a.trainerKey, a.groupId);
                                const rowKey = `${a.groupId}-${a.dayIndex}-${a.hourIndex}`;
                                const isRowActive = activeActionRow === rowKey;
                                
                                return (
                                    <tr key={rowKey} className={`hover:bg-slate-800/40 transition-colors ${isMerged ? 'bg-amber-500/5' : ''}`}>
                                        <td className="p-4 font-medium text-slate-300">
                                            <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold">اليوم {a.dayIndex + 1}</span><span>{8 + a.hourIndex}:00 - {9 + a.hourIndex}:00</span></div>
                                        </td>
                                        <td className="p-4"><span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-white font-bold">{specName} - ف{gNum}</span></td>
                                        <td className="p-4"><div className="flex items-center gap-2"><UserCircle className="w-5 h-5 text-slate-600" /><span className="font-bold text-white">{getTrainerName(a.trainerKey, a.moduleId)}</span></div></td>
                                        <td className="p-4 text-center">
                                            {!isRowActive ? (
                                                <button onClick={() => setActiveActionRow(rowKey)} className="text-blue-400 hover:text-white bg-blue-600/10 hover:bg-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-500/20">تغيير الأستاذ</button>
                                            ) : (
                                                <div className="flex items-center gap-2"><select autoFocus value={a.trainerKey} onChange={(e) => handleManualAssign(a, e.target.value)} className="bg-slate-950 border border-dzgreen-500 rounded p-1 text-xs text-white outline-none w-32">{availableTrainers.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}</select><button onClick={() => setActiveActionRow(null)} className="p-1.5 bg-slate-800 rounded"><XIcon className="w-3 h-3 text-slate-500"/></button></div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {isMerged ? <div className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1"><Link className="w-3 h-3" /> دمج بيداغوجي</div> : <div className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> إسناد خاص</div>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Trainer Modal Overlay */}
            {isAddingTrainer && (
                <div className="fixed inset-0 z-[70000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-zoomIn">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><UserPlus className="text-emerald-400" /> تسجيل أستاذ جديد</h3>
                        <div className="space-y-4">
                            <input type="text" autoFocus placeholder="الاسم الكامل للمكون" value={newTrainerName} onChange={(e) => setNewTrainerName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none text-lg" />
                            <div className="flex gap-3"><button onClick={handleAddNewTrainer} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">تأكيد الإضافة</button><button onClick={() => setIsAddingTrainer(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl">إلغاء</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerAssignmentHub;
