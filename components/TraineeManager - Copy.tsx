import React, { useState, useEffect, useRef } from 'react';
import { Users, Upload, Plus, Trash2, Search, Table, Download, ArrowRightLeft, Printer, ClipboardList, Check, X as XIcon, Repeat, X, Grid, CalendarDays, FileText } from 'lucide-react';
import { Trainee, InstitutionConfig, AttendanceRecord, Level, Rank } from '../types';

// المواد المعتمدة
const VALID_SUBJECTS = [
    { id: 'ar', name: 'لغة عربية' },
    { id: 'fr', name: 'لغة فرنسية' },
    { id: 'ama', name: 'لغة أمازيغية' }
];

// --- ثوابت تواريخ الدورات (أيام السبت فقط) ---
const CYCLE_DATES = {
    1: [
        '2026-01-24', '2026-01-31', '2026-02-07', '2026-02-14',
        '2026-02-21', '2026-02-28', '2026-03-07', '2026-03-14'
    ],
    2: [
        '2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25',
        '2026-05-02', '2026-05-09', '2026-05-16', '2026-05-23'
    ]
};

const TraineeManager: React.FC = () => {
    // --- Data State ---
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [institution, setInstitution] = useState<InstitutionConfig>({ wilaya: '', institute: '', center: '', director: '' });
    const [attendance, setAttendance] = useState<AttendanceRecord>({});

    // --- UI State ---
    const [activeTab, setActiveTab] = useState<'list' | 'groups' | 'cycle'>('list');
    const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
    const [filterRank, setFilterRank] = useState<string>('all');
    
    // Group View State
    const [selectedGroupRank, setSelectedGroupRank] = useState<Rank>(Rank.CLASS_1);
    const [selectedGroupNum, setSelectedGroupNum] = useState<number>(1);
    const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    // Cycle View State
    const [selectedCycle, setSelectedCycle] = useState<1 | 2>(1);

    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [transferTarget, setTransferTarget] = useState<Trainee | null>(null);

    // --- Form State ---
    const [newTrainee, setNewTrainee] = useState<Partial<Trainee>>({
        gender: 'M',
        specialtyId: 'ar',
        rank: Rank.CLASS_1
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedTrainees = localStorage.getItem('takwin_trainees_db');
        if (savedTrainees) try { setTrainees(JSON.parse(savedTrainees)); } catch(e) {}
        
        const savedInst = localStorage.getItem('takwin_institution_db');
        if (savedInst) try { setInstitution(JSON.parse(savedInst)); } catch(e) {}

        const savedAtt = localStorage.getItem('takwin_attendance_db');
        if (savedAtt) try { setAttendance(JSON.parse(savedAtt)); } catch(e) {}
    }, []);

    const saveTrainees = (data: Trainee[]) => {
        setTrainees(data);
        localStorage.setItem('takwin_trainees_db', JSON.stringify(data));
    };

    const saveAttendance = (data: AttendanceRecord) => {
        setAttendance(data);
        localStorage.setItem('takwin_attendance_db', JSON.stringify(data));
    };

    const toggleAttendance = (traineeId: string, date: string = attendanceDate) => {
        const key = `${date}-${traineeId}`;
        const currentRecord = attendance[key];
        const newAttendance = { ...attendance };

        if (currentRecord?.status === 'A') {
            delete newAttendance[key]; 
        } else {
            newAttendance[key] = { status: 'A' }; 
        }
        saveAttendance(newAttendance);
    };

    const handleTransfer = (newGroupId: number) => {
        if (!transferTarget) return;
        const updatedTrainees = trainees.map(t => 
            t.id === transferTarget.id ? { ...t, groupId: newGroupId } : t
        );
        saveTrainees(updatedTrainees);
        setTransferTarget(null);
        alert(`تم نقل المتربص ${transferTarget.surname} ${transferTarget.name} إلى الفوج ${newGroupId} بنجاح.`);
    };

    const handleSmartAdd = () => {
        if (!newTrainee.surname || !newTrainee.name) return;
        const targetRank = (newTrainee.rank as Rank) || Rank.CLASS_1;
        const maxGroups = institution.rankGroups?.[targetRank] || 1;
        let targetGroupId = 1;

        if (maxGroups > 1) {
            const counts: Record<number, number> = {};
            for(let i=1; i<=maxGroups; i++) counts[i] = 0;
            trainees.filter(t => t.rank === targetRank).forEach(t => {
                if (t.groupId) counts[t.groupId] = (counts[t.groupId] || 0) + 1;
            });
            let minCount = Infinity;
            let candidateGroups: number[] = [];
            for(let i=1; i<=maxGroups; i++) {
                if (counts[i] < minCount) { minCount = counts[i]; candidateGroups = [i]; } 
                else if (counts[i] === minCount) { candidateGroups.push(i); }
            }
            targetGroupId = candidateGroups[Math.floor(Math.random() * candidateGroups.length)];
        }
        
        const t: Trainee = {
            id: Math.random().toString(36).substr(2, 9),
            surname: newTrainee.surname!,
            name: newTrainee.name!,
            dob: newTrainee.dob || '',
            pob: newTrainee.pob || '',
            gender: newTrainee.gender as 'M' | 'F',
            school: newTrainee.school || '',
            municipality: newTrainee.municipality || '',
            specialtyId: newTrainee.specialtyId || 'ar',
            rank: targetRank,
            level: Level.PRIMARY,
            groupId: targetGroupId
        };
        saveTrainees([...trainees, t]);
        setNewTrainee({ gender: 'M', specialtyId: newTrainee.specialtyId, rank: newTrainee.rank });
        setIsAdding(false);
        alert(`تمت الإضافة للفوج ${targetGroupId} (موازنة آلية).`);
    };

    const handleAutoGrouping = () => {
        if (trainees.length === 0) return;
        if (!window.confirm("سيتم توزيع المتربصين آلياً على الأفواج بناءً على الرتبة. هل أنت متأكد؟")) return;

        const updatedTrainees = [...trainees];
        Object.values(Rank).forEach(rank => {
            const filtered = updatedTrainees.filter(t => t.rank === rank);
            if (filtered.length === 0) return;
            filtered.sort((a, b) => (a.surname + a.name).localeCompare(b.surname + b.name, 'ar'));
            const groupCount = institution.rankGroups?.[rank] || 1;
            filtered.forEach((t, index) => {
                const groupNum = (index % groupCount) + 1;
                const mainIndex = updatedTrainees.findIndex(x => x.id === t.id);
                if (mainIndex !== -1) updatedTrainees[mainIndex].groupId = groupNum;
            });
        });
        saveTrainees(updatedTrainees);
        alert("تم التوزيع الآلي للأفواج بنجاح.");
    };

    const downloadTemplate = () => {
        const BOM = "\uFEFF";
        const headers = ["الرقم", "اللقب", "الاسم", "تاريخ الميلاد (DD/MM/YYYY)", "الجنس (ذكر/أنثى)", "المؤسسة", "البلدية", "الرتبة (أول/ثان/مميز)", "مادة التدريس"];
        const csvContent = BOM + headers.join(",") + "\n1,بن فلان,فلان,20/05/1985,ذكر,مدرسة 01 نوفمبر,الأغواط,أستاذ مكون في التعليم الابتدائي,عربية";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'نموذج_قائمة_المتكونين.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- FIX 1: Date Cleaning Logic ---
    const cleanDate = (d: string): string => {
        if (!d) return '';
        const clean = d.replace(/[^0-9]/g, ''); // remove slashes or dashes temporarily
        
        // Case: 12082002 (8 digits)
        if (clean.length === 8) {
            const day = clean.substr(0, 2);
            const month = clean.substr(2, 2);
            const year = clean.substr(4, 4);
            return `${year}-${month}-${day}`; // ISO format for HTML input
        }
        // Case: already formatted but imported as string
        if (d.includes('/')) {
            const parts = d.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY to YYYY-MM-DD
        }
        return d;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split(/\r\n|\n/);
            const importedTrainees: Trainee[] = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const cols = line.split(/[,;]/).map(c => c.replace(/^"|"$/g, '').trim());
                if (cols.length < 5) continue;

                importedTrainees.push({
                    id: Math.random().toString(36).substr(2, 9),
                    surname: cols[1] || '',
                    name: cols[2] || '',
                    dob: cleanDate(cols[3] || ''), // Apply cleaning
                    pob: cols[6] || '',
                    gender: (cols[4] && cols[4].includes('أنثى')) ? 'F' : 'M',
                    school: cols[5] || '',
                    municipality: cols[6] || '',
                    rank: mapRankText(cols[7] || ''),
                    specialtyId: mapSubjectTextToId(cols[8] || ''),
                    level: Level.PRIMARY,
                    groupId: 0
                });
            }
            if (importedTrainees.length > 0) {
                if (window.confirm(`تم العثور على ${importedTrainees.length} متربص. إضافة؟`)) {
                    saveTrainees([...trainees, ...importedTrainees]);
                }
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const mapRankText = (text: string): Rank => {
        if (text.includes('أول') || text.includes('1')) return Rank.CLASS_1;
        if (text.includes('ثان') || text.includes('ثاني') || text.includes('2')) return Rank.CLASS_2;
        if (text.includes('مميز') || text.includes('3')) return Rank.DISTINGUISHED;
        return Rank.CLASS_1;
    };

    const mapSubjectTextToId = (text: string): string => {
        const t = text.trim();
        if (t.includes('فرنسية')) return 'fr';
        if (t.includes('أمازيغية')) return 'ama';
        return 'ar';
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد؟')) saveTrainees(trainees.filter(t => t.id !== id));
    };

    const handleDeleteAll = () => {
        if (window.confirm(`تحذير: سيتم مسح كافة المتربصين.`)) saveTrainees([]);
    };

    // Print Handlers
    const handlePrint = (templateId: string) => {
        const content = document.getElementById(templateId);
        let printSection = document.getElementById('print-section');
        if (!printSection) {
            printSection = document.createElement('div');
            printSection.id = 'print-section';
            document.body.appendChild(printSection);
        }
        if (content && printSection) {
            printSection.innerHTML = '';
            const clone = content.cloneNode(true) as HTMLElement;
            clone.classList.remove('hidden');
            clone.style.display = 'block';
            printSection.appendChild(clone);
            window.print();
        }
    };

    const filteredTrainees = trainees.filter(t => {
        const matchesSpec = filterSpecialty === 'all' || t.specialtyId === filterSpecialty;
        const matchesRank = filterRank === 'all' || t.rank === filterRank;
        const matchesSearch = t.surname.includes(searchTerm) || t.name.includes(searchTerm);
        return matchesSpec && matchesRank && matchesSearch;
    });

    const groupTrainees = trainees
        .filter(t => t.rank === selectedGroupRank && t.groupId === selectedGroupNum)
        .sort((a, b) => (a.surname + a.name).localeCompare(b.surname + b.name, 'ar'));

    const getStats = () => {
        const total = filteredTrainees.length;
        const males = filteredTrainees.filter(t => t.gender === 'M').length;
        const females = filteredTrainees.filter(t => t.gender === 'F').length;
        return { total, males, females };
    };
    const stats = getStats();

    // --- FIX 3: Cycle Grid Logic (Using hardcoded Saturdays) ---
    const currentCycleDates = CYCLE_DATES[selectedCycle];

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit mb-6 print:hidden">
                <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <Users className="w-4 h-4" /> القائمة
                </button>
                <button onClick={() => setActiveTab('groups')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'groups' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <ClipboardList className="w-4 h-4" /> السجل اليومي
                </button>
                <button onClick={() => setActiveTab('cycle')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'cycle' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <Grid className="w-4 h-4" /> شبكة الدورة
                </button>
            </div>

            {/* --- TAB 1: LIST --- */}
            {activeTab === 'list' && (
                <>
                    <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-800/60 print:hidden">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">إدارة المتربصين</h2>
                                <p className="text-slate-400 text-sm mt-1">تسيير حسب الرتب</p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <button onClick={handleAutoGrouping} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-colors"><ArrowRightLeft size={16}/> توزيع آلي</button>
                                <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-colors"><Download size={16}/> نموذج CSV</button>
                                <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-colors"><Upload size={16}/> استيراد</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv, .txt" />
                                <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-colors"><Plus size={16}/> إضافة</button>
                                {trainees.length > 0 && <button onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-colors"><Trash2 size={16}/> حذف الكل</button>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4 print:hidden">
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold">المجموع</span>
                                <span className="text-white font-bold">{stats.total}</span>
                            </div>
                            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20 flex justify-between items-center">
                                <span className="text-blue-400 text-xs font-bold">ذكور</span>
                                <span className="text-blue-200 font-bold">{stats.males}</span>
                            </div>
                            <div className="bg-pink-900/20 p-3 rounded-lg border border-pink-500/20 flex justify-between items-center">
                                <span className="text-pink-400 text-xs font-bold">إناث</span>
                                <span className="text-pink-200 font-bold">{stats.females}</span>
                            </div>
                        </div>

                        {isAdding && (
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-6 animate-slideDown">
                                <h3 className="font-bold text-white mb-4">إضافة متربص</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input placeholder="اللقب" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.surname || ''} onChange={e => setNewTrainee({...newTrainee, surname: e.target.value})} />
                                    <input placeholder="الاسم" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.name || ''} onChange={e => setNewTrainee({...newTrainee, name: e.target.value})} />
                                    <input type="date" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.dob || ''} onChange={e => setNewTrainee({...newTrainee, dob: e.target.value})} />
                                    <select className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.rank} onChange={e => setNewTrainee({...newTrainee, rank: e.target.value as Rank})}>
                                        {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <select className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.specialtyId} onChange={e => setNewTrainee({...newTrainee, specialtyId: e.target.value})}>
                                        {VALID_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <select className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.gender} onChange={e => setNewTrainee({...newTrainee, gender: e.target.value as 'M'|'F'})}>
                                        <option value="M">ذكر</option>
                                        <option value="F">أنثى</option>
                                    </select>
                                    <input placeholder="المؤسسة" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.school || ''} onChange={e => setNewTrainee({...newTrainee, school: e.target.value})} />
                                    <input placeholder="البلدية" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={newTrainee.municipality || ''} onChange={e => setNewTrainee({...newTrainee, municipality: e.target.value})} />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={handleSmartAdd} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold">حفظ</button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute right-3 top-2.5 text-slate-500 w-4 h-4" />
                                <input type="text" placeholder="بحث..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-white outline-none focus:border-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none font-bold" value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
                                <option value="all">كل المواد</option>
                                {VALID_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none font-bold" value={filterRank} onChange={e => setFilterRank(e.target.value)}>
                                <option value="all">كل الرتب</option>
                                {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {transferTarget && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Repeat className="text-purple-400" /> نقل المتربص
                                        </h3>
                                        <button onClick={() => setTransferTarget(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                                    </div>
                                    <div className="mb-6 bg-slate-800 p-4 rounded-xl">
                                        <div className="text-sm text-slate-400 mb-1">المتربص المحدد:</div>
                                        <div className="font-bold text-white text-lg">{transferTarget.surname} {transferTarget.name}</div>
                                        <div className="text-xs text-purple-400 mt-1">الرتبة: {transferTarget.rank} | الفوج: {transferTarget.groupId}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.from({ length: institution.rankGroups?.[transferTarget.rank] || 1 })
                                            .map((_, i) => i + 1)
                                            .filter(gNum => gNum !== transferTarget.groupId)
                                            .map(gNum => (
                                                <button key={gNum} onClick={() => handleTransfer(gNum)} className="bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 border border-slate-700 rounded-lg py-3 font-bold transition-all">
                                                    الفوج {gNum}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-950 text-slate-400 font-bold">
                                    <tr>
                                        <th className="p-4 w-12">#</th>
                                        <th className="p-4">اللقب والاسم</th>
                                        <th className="p-4">الرتبة</th>
                                        <th className="p-4 text-center">الفوج</th>
                                        <th className="p-4 text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredTrainees.map((t, idx) => (
                                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4 text-slate-500">{idx + 1}</td>
                                            <td className="p-4 font-bold text-white">{t.surname} {t.name}</td>
                                            <td className="p-4"><span className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300 font-bold">{t.rank}</span></td>
                                            <td className="p-4 text-center"><span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full font-black border border-purple-500/20">فوج {t.groupId || '-'}</span></td>
                                            <td className="p-4 text-center flex justify-center gap-2">
                                                <button onClick={() => setTransferTarget(t)} className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors" title="نقل"><Repeat size={16}/></button>
                                                <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* --- TAB 2: DAILY ATTENDANCE --- */}
            {activeTab === 'groups' && (
                <div className="space-y-6">
                    <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800/60 flex flex-wrap gap-6 items-end print:hidden">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">1. اختر الرتبة</label>
                            <select value={selectedGroupRank} onChange={e => { setSelectedGroupRank(e.target.value as Rank); setSelectedGroupNum(1); }} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white w-64 outline-none font-bold focus:border-purple-500">
                                {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">2. رقم الفوج</label>
                            <div className="flex gap-2">
                                {Array.from({ length: institution.rankGroups?.[selectedGroupRank] || 1 }).map((_, idx) => (
                                    <button key={idx} onClick={() => setSelectedGroupNum(idx + 1)} className={`w-10 h-10 rounded-lg font-black flex items-center justify-center transition-all ${selectedGroupNum === idx + 1 ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{idx + 1}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2">3. التاريخ</label>
                            <div className="relative">
                                <CalendarDays className="absolute right-3 top-2.5 text-slate-500 w-4 h-4" />
                                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-white focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div className="mr-auto flex gap-2">
                            <button onClick={() => handlePrint('posting-list-template')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"><FileText size={16} /> القائمة</button>
                            <button onClick={() => handlePrint('attendance-print-template')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"><Printer size={16} /> الحضور</button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden print:hidden">
                        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">سجل الحضور: {selectedGroupRank} - الفوج {selectedGroupNum}</h3>
                            <span className="text-xs text-slate-400">{attendanceDate}</span>
                        </div>
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950 text-slate-400 font-bold">
                                <tr>
                                    <th className="p-4 w-12">#</th>
                                    <th className="p-4">اللقب والاسم</th>
                                    <th className="p-4 text-center w-32">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {groupTrainees.map((t, idx) => {
                                    const record = attendance[`${attendanceDate}-${t.id}`];
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-800/50">
                                            <td className="p-4 text-slate-500">{idx + 1}</td>
                                            <td className="p-4 font-bold text-white">{t.surname} {t.name}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleAttendance(t.id)} className={`w-full py-1.5 rounded flex items-center justify-center gap-2 font-bold transition-colors border ${record?.status === 'A' ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                    {record?.status === 'A' ? <><XIcon size={16} /> غائب</> : <><Check size={16} /> حاضر</>}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB 3: CYCLE GRID (Saturdays Only) --- */}
            {activeTab === 'cycle' && (
                <div className="space-y-6">
                     <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800/60 flex flex-wrap gap-6 items-end print:hidden">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">1. اختر الدورة</label>
                            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700 w-48">
                                <button onClick={() => setSelectedCycle(1)} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${selectedCycle === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>الدورة 1 (جانفي)</button>
                                <button onClick={() => setSelectedCycle(2)} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${selectedCycle === 2 ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>الدورة 2 (أفريل)</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">2. الرتبة</label>
                            <select value={selectedGroupRank} onChange={e => { setSelectedGroupRank(e.target.value as Rank); setSelectedGroupNum(1); }} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white w-56 outline-none font-bold">
                                {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">3. الفوج</label>
                            <div className="flex gap-2">
                                {Array.from({ length: institution.rankGroups?.[selectedGroupRank] || 1 }).map((_, idx) => (
                                    <button key={idx} onClick={() => setSelectedGroupNum(idx + 1)} className={`w-10 h-10 rounded-lg font-black flex items-center justify-center transition-all ${selectedGroupNum === idx + 1 ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{idx + 1}</button>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden print:hidden overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950 text-slate-400 font-bold">
                                <tr>
                                    <th className="p-4 w-12 sticky right-0 bg-slate-950">#</th>
                                    <th className="p-4 sticky right-12 bg-slate-950 min-w-[200px]">الاسم واللقب</th>
                                    {currentCycleDates.map((date, i) => (
                                        <th key={date} className="p-2 text-center border-l border-slate-800 min-w-[80px]">
                                            <div className="text-white">{date.slice(5)}</div> {/* Show MM-DD only */}
                                            <div className="text-[10px] text-slate-500">السبت {i+1}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {groupTrainees.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-slate-800/40">
                                        <td className="p-4 text-slate-500 sticky right-0 bg-slate-900/90">{idx + 1}</td>
                                        <td className="p-4 font-bold text-white sticky right-12 bg-slate-900/90">{t.surname} {t.name}</td>
                                        {currentCycleDates.map(date => {
                                            const isAbsent = attendance[`${date}-${t.id}`]?.status === 'A';
                                            return (
                                                <td key={date} className="p-2 text-center border-l border-slate-800 cursor-pointer hover:bg-white/5" onClick={() => toggleAttendance(t.id, date)}>
                                                    {isAbsent ? <div className="w-6 h-6 rounded bg-red-500/20 text-red-500 mx-auto flex items-center justify-center"><XIcon size={14}/></div> : <div className="w-2 h-2 rounded-full bg-slate-700 mx-auto"></div>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            )}

            {/* --- PRINT TEMPLATES --- */}
            <div id="attendance-print-template" className="hidden">
                <div className="p-8 bg-white text-black h-full" style={{ direction: 'rtl' }}>
                    <div className="text-center mb-6 border-b-2 border-black pb-4">
                        <h3 className="font-bold text-lg">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                        <h3 className="font-bold text-lg">وزارة التربية الوطنية</h3>
                        <div className="flex justify-between mt-4 text-sm font-bold">
                            <span>مديرية التربية لولاية {institution.wilaya}</span>
                            <span>مركز التكوين {institution.center}</span>
                        </div>
                        <h1 className="text-2xl font-black mt-6 border-2 border-black inline-block px-10 py-2 uppercase">ورقة الحضور اليومية</h1>
                        <div className="mt-4 flex justify-around text-lg font-bold">
                            <span>الرتبة: {selectedGroupRank}</span>
                            <span>الفوج: {selectedGroupNum}</span>
                            <span>التاريخ: {attendanceDate}</span>
                        </div>
                    </div>
                    <table className="w-full border-2 border-black text-sm text-center">
                        <thead className="bg-gray-100">
                            <tr className="h-10">
                                <th className="border border-black w-10">رقم</th>
                                <th className="border border-black">اللقب والاسم</th>
                                {/* FIX 2: Added DOB column explicitly */}
                                <th className="border border-black w-32">تاريخ الميلاد</th>
                                <th className="border border-black w-32">المؤسسة</th>
                                <th className="border border-black w-40">الإمضاء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupTrainees.map((t, idx) => (
                                <tr key={t.id} className="h-10">
                                    <td className="border border-black font-bold">{idx + 1}</td>
                                    <td className="border border-black text-right px-4 font-bold">{t.surname} {t.name}</td>
                                    {/* Display DOB cleanly */}
                                    <td className="border border-black text-xs font-bold">{t.dob.split('-').reverse().join('/')}</td>
                                    <td className="border border-black text-xs">{t.school}</td>
                                    <td className="border border-black"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-12 flex justify-between px-20 font-bold text-lg">
                        <div>إمضاء الأستاذ المكون</div>
                        <div>المدير البيداغوجي</div>
                    </div>
                </div>
            </div>

            <div id="posting-list-template" className="hidden">
                <div className="p-4 bg-white text-black h-full border-4 border-gray-800 rounded-lg flex flex-col" style={{ direction: 'rtl' }}>
                    <div className="text-center mb-2">
                        <h3 className="font-bold text-base mb-1">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                        <h3 className="font-bold text-base">وزارة التربية الوطنية</h3>
                        <div className="flex justify-between mt-2 border-t border-black pt-1 text-xs font-bold px-2">
                            <span>مديرية التربية: {institution.wilaya}</span>
                            <span>مركز التكوين: {institution.center}</span>
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-black bg-black text-white py-1 px-6 rounded-md inline-block shadow-md mb-2">
                            قائمة المتكونين
                        </h1>
                        <div className="flex items-center justify-center gap-3">
                            <h2 className="text-lg font-bold text-gray-800">
                                الرتبة: {selectedGroupRank}
                            </h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded border border-gray-300">
                                <span className="text-xl font-bold">فــــــــوج:</span>
                                <span className="text-3xl font-black">{selectedGroupNum}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <table className="w-full border-2 border-black text-center text-sm table-fixed">
                            <thead className="bg-gray-100 h-8 border-b-2 border-black">
                                <tr>
                                    <th className="border border-black w-10 py-1">رقم</th>
                                    <th className="border border-black py-1">اللقب</th>
                                    <th className="border border-black py-1">الاسم</th>
                                    <th className="border border-black w-28 py-1">المادة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupTrainees.map((t, idx) => (
                                    <tr key={t.id} className={`h-8 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="border border-black font-bold">{idx + 1}</td>
                                        <td className="border border-black font-bold text-right px-3">{t.surname}</td>
                                        <td className="border border-black font-bold text-right px-3">{t.name}</td>
                                        <td className="border border-black font-bold text-xs">{VALID_SUBJECTS.find(s=>s.id===t.specialtyId)?.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 pt-2 border-t-2 border-black flex justify-between items-end px-4">
                        <div className="text-sm font-bold">
                            العدد الإجمالي: {groupTrainees.length} متربص
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-sm mb-8">المدير البيداغوجي</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraineeManager;