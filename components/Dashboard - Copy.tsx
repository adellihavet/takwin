
import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  Save, 
  MapPin, 
  UserCircle, 
  School, 
  Settings,
  ArrowDownToLine,
  UploadCloud,
  Layers,
  BookOpen,
  UserPlus,
  Plus,
  Trash2
} from 'lucide-react';
import { InstitutionConfig, TrainerConfig, Level, Rank } from '../types';
import { MODULES } from '../constants';
import { downloadJSON, readJSONFile } from '../utils';

const Dashboard: React.FC = () => {
    const [config, setConfig] = useState<InstitutionConfig>({
        wilaya: '', institute: '', center: '', director: '', rankGroups: {}
    });
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [trainers, setTrainers] = useState<TrainerConfig>({});
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'trainers'>('info');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedConfig = localStorage.getItem('takwin_institution_db');
        if (savedConfig) setConfig(JSON.parse(savedConfig));

        const savedCounts = localStorage.getItem('takwin_trainee_counts');
        if (savedCounts) setCounts(JSON.parse(savedCounts));

        const savedTrainers = localStorage.getItem('takwin_trainers_db');
        if (savedTrainers) setTrainers(JSON.parse(savedTrainers));
    }, []);

    const handleSave = () => {
        localStorage.setItem('takwin_institution_db', JSON.stringify(config));
        localStorage.setItem('takwin_trainee_counts', JSON.stringify(counts));
        localStorage.setItem('takwin_trainers_db', JSON.stringify(trainers));
        setIsEditing(false);
        alert('تم حفظ البيانات بنجاح');
    };

    const exportFullDatabase = () => {
        const fullDB = {
            institution: config,
            trainee_counts: counts,
            trainers: trainers,
            trainees: JSON.parse(localStorage.getItem('takwin_trainees_db') || '[]'),
            grades: JSON.parse(localStorage.getItem('takwin_grades_db') || '{}'),
            attendance: JSON.parse(localStorage.getItem('takwin_attendance_db') || '{}')
        };
        downloadJSON(fullDB, `takwin_db_backup_${config.wilaya || 'unnamed'}.json`);
    };

    const importFullDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readJSONFile(file);
            if (data.institution) {
                setConfig(data.institution);
                localStorage.setItem('takwin_institution_db', JSON.stringify(data.institution));
            }
            if (data.trainers) {
                setTrainers(data.trainers);
                localStorage.setItem('takwin_trainers_db', JSON.stringify(data.trainers));
            }
            if (data.trainees) localStorage.setItem('takwin_trainees_db', JSON.stringify(data.trainees));
            alert('تم استيراد قاعدة البيانات بنجاح');
            window.location.reload();
        } catch (err) {
            alert('خطأ في استيراد الملف. تأكد من أنه ملف JSON صالح.');
        }
    };

    const addTrainerField = (modId: number) => {
        const trainerKey = `t-${Date.now()}`;
        setTrainers(prev => {
            const currentMod = prev[modId] || { names: {}, generalCount: 0 };
            return {
                ...prev,
                [modId]: {
                    ...currentMod,
                    names: { ...currentMod.names, [trainerKey]: '' }
                }
            };
        });
    };

    const removeTrainerField = (modId: number, key: string) => {
        setTrainers(prev => {
            const newNames = { ...prev[modId].names };
            delete newNames[key];
            return {
                ...prev,
                [modId]: { ...prev[modId], names: newNames }
            };
        });
    };

    const updateTrainerName = (modId: number, key: string, name: string) => {
        setTrainers(prev => ({
            ...prev,
            [modId]: {
                ...prev[modId],
                names: { ...prev[modId].names, [key]: name }
            }
        }));
    };

    const updateRankGroupCount = (rank: string, count: number) => {
        setConfig(prev => ({
            ...prev,
            rankGroups: {
                ...(prev.rankGroups || {}),
                [rank]: count
            }
        }));
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Main Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2">لوحة التحكم في المركز</h1>
                        <p className="text-slate-400">إدارة البيانات الشاملة والطاقم التربوي - دورة 2026</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={exportFullDatabase} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-600 transition-all">
                            <ArrowDownToLine size={18}/> حفظ قاعدة البيانات
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-600 transition-all">
                            <UploadCloud size={18}/> استيراد
                        </button>
                        <input type="file" ref={fileInputRef} onChange={importFullDatabase} className="hidden" accept=".json" />
                    </div>
                </div>
            </div>

            {/* Editing Controls */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setActiveTab('info')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                        بيانات المؤسسة والتعداد
                    </button>
                    <button onClick={() => setActiveTab('trainers')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'trainers' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                        إدارة الأساتذة المكونين
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsEditing(!isEditing)} className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isEditing ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-dzgreen-600 text-white shadow-lg shadow-dzgreen-900/40'}`}>
                        {isEditing ? 'إلغاء التعديل' : <><Settings size={18}/> تعديل البيانات</>}
                    </button>
                    {isEditing && (
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                            <Save size={18}/> حفظ التغييرات
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'info' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                                <Building2 className="text-blue-400" /> معلومات المركز
                            </h3>
                            <div className="space-y-4">
                                <DataInput label="ولاية التكوين" icon={<MapPin size={16}/>} value={config.wilaya} disabled={!isEditing} onChange={(v: string) => setConfig({...config, wilaya: v})} placeholder="مثال: الأغواط" />
                                <DataInput label="المعهد الوطني الوصي" icon={<School size={16}/>} value={config.institute} disabled={!isEditing} onChange={(v: string) => setConfig({...config, institute: v})} placeholder="اسم المعهد الوصي" />
                                <DataInput label="مركز التكوين (المقر)" icon={<Building2 size={16}/>} value={config.center} disabled={!isEditing} onChange={(v: string) => setConfig({...config, center: v})} placeholder="اسم المؤسسة المحتضنة" />
                                <DataInput label="المدير البيداغوجي" icon={<UserCircle size={16}/>} value={config.director} disabled={!isEditing} onChange={(v: string) => setConfig({...config, director: v})} placeholder="الاسم الكامل لمدير المركز" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Users className="text-purple-400" /> تعداد المتربصين حسب الرتبة والطور
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="text-slate-500">
                                    <tr>
                                        <th className="p-3">الطور التعليمي</th>
                                        {Object.values(Rank).map(r => <th key={r} className="p-3 text-center">{r}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {Object.values(Level).map(l => (
                                        <tr key={l}>
                                            <td className="p-4 font-bold text-slate-200">{l}</td>
                                            {Object.values(Rank).map(r => (
                                                <td key={r} className="p-2 text-center">
                                                    <input 
                                                        type="number" 
                                                        disabled={!isEditing}
                                                        value={counts[`${l}-${r}`] || ''}
                                                        onChange={(e) => setCounts({...counts, [`${l}-${r}`]: parseInt(e.target.value) || 0})}
                                                        className={`w-24 h-10 bg-slate-950 border text-center rounded-lg font-black transition-all ${isEditing ? 'border-slate-600 text-white focus:border-dzgreen-500' : 'border-transparent text-slate-500'}`}
                                                        placeholder="0"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {/* صف عدد الأفواج الجديد */}
                                    <tr className="bg-dzgreen-950/20 border-t-2 border-slate-700">
                                        <td className="p-4 font-black text-dzgreen-400 flex items-center gap-2">
                                            <Layers size={18}/> عدد الأفواج المقررة
                                        </td>
                                        {Object.values(Rank).map(r => (
                                            <td key={r} className="p-2 text-center">
                                                <div className="flex flex-col items-center">
                                                    <input 
                                                        type="number" 
                                                        disabled={!isEditing}
                                                        value={config.rankGroups?.[r] || ''}
                                                        onChange={(e) => updateRankGroupCount(r, parseInt(e.target.value) || 0)}
                                                        className={`w-24 h-12 bg-slate-900 border text-center rounded-xl font-black text-lg transition-all ${isEditing ? 'border-dzgreen-600 text-dzgreen-400 focus:ring-2 ring-dzgreen-500/20' : 'border-transparent text-dzgreen-600/50'}`}
                                                        placeholder="0"
                                                    />
                                                    <span className="text-[9px] text-slate-500 mt-1 font-bold">فوج تربوي</span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                <span className="text-dzgreen-500 font-bold">ملاحظة:</span> يتم تقسيم المتربصين على عدد الأفواج المدخل أعلاه آلياً. يرجى التأكد من دقة الأرقام لأنها تؤثر على توزيع حصص الأساتذة المكونين.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {MODULES.map(mod => {
                        const modTrainers = trainers[mod.id]?.names || {};
                        const keys = Object.keys(modTrainers);
                        return (
                            <div key={mod.id} className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{mod.shortTitle}</h4>
                                            <p className="text-slate-500 text-[10px] font-black uppercase">
                                                {[3,6,7].includes(mod.id) ? 'مقياس رتبة محددة' : 'مقياس مشترك'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase">{mod.hours} سا</span>
                                        {isEditing && (
                                            <button onClick={() => addTrainerField(mod.id)} className="bg-dzgreen-600 p-1 rounded-md text-white hover:bg-dzgreen-500 transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-2 space-y-3 flex-1 overflow-y-auto max-h-48 custom-scrollbar">
                                    <label className="text-[10px] text-slate-500 font-black mb-1 block uppercase mr-1">الأساتذة المكونون المكلّفون</label>
                                    {keys.map((key) => (
                                        <div key={key} className="flex items-center gap-2 group/field">
                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 text-slate-500">
                                                <UserPlus size={18} />
                                            </div>
                                            <input 
                                                type="text"
                                                disabled={!isEditing}
                                                value={modTrainers[key]}
                                                onChange={(e) => updateTrainerName(mod.id, key, e.target.value)}
                                                placeholder="الاسم الكامل للأستاذ..."
                                                className="flex-1 h-12 bg-slate-950 border border-slate-700 rounded-xl px-4 text-sm font-bold text-white focus:border-dzgreen-500 outline-none transition-all placeholder:text-slate-700 disabled:opacity-50"
                                            />
                                            {isEditing && keys.length > 0 && (
                                                <button onClick={() => removeTrainerField(mod.id, key)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {keys.length === 0 && (
                                        <p className="text-slate-700 text-[10px] italic text-center py-4">انقر على (+) لإضافة أستاذ</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const DataInput = ({ label, icon, value, onChange, disabled, placeholder }: any) => (
    <div className="group">
        <label className="text-slate-500 text-[10px] font-black mb-1 block mr-1 uppercase">{label}</label>
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${disabled ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-950 border-slate-700 focus-within:border-dzgreen-500'}`}>
            <span className="text-slate-500">{icon}</span>
            <input type="text" value={value} disabled={disabled} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-white placeholder:text-slate-700" />
        </div>
    </div>
);

export default Dashboard;