import React, { useState, useEffect, useRef } from 'react';
import { Users, Upload, Plus, Trash2, Search, Download, ArrowRightLeft, Printer, ClipboardList, Check, X as XIcon, Repeat, X, Grid, CalendarDays, FileText, RefreshCw, Edit, Save } from 'lucide-react';
import { Trainee, InstitutionConfig, AttendanceRecord, Level, Rank } from '../types';

// --- الثوابت ---
const VALID_SUBJECTS = [
    { id: 'ar', name: 'لغة عربية' },
    { id: 'fr', name: 'لغة فرنسية' },
    { id: 'ama', name: 'لغة أمازيغية' }
];

const CYCLE_DATES = {
    1: ['2026-01-24', '2026-01-31', '2026-02-07', '2026-02-14', '2026-02-21', '2026-02-28', '2026-03-07', '2026-03-14'],
    2: ['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25', '2026-05-02', '2026-05-09', '2026-05-16', '2026-05-23']
};

const TraineeManager: React.FC = () => {
    // --- State ---
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [institution, setInstitution] = useState<InstitutionConfig>({ wilaya: '', institute: '', center: '', director: '' });
    const [attendance, setAttendance] = useState<AttendanceRecord>({});

    const [activeTab, setActiveTab] = useState<'list' | 'groups' | 'cycle'>('list');
    const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
    const [filterRank, setFilterRank] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedGroupRank, setSelectedGroupRank] = useState<Rank>(Rank.CLASS_1);
    const [selectedGroupNum, setSelectedGroupNum] = useState<number>(1);
    const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedCycle, setSelectedCycle] = useState<1 | 2>(1);

    const [isAdding, setIsAdding] = useState(false);
    const [transferTarget, setTransferTarget] = useState<Trainee | null>(null);
    const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Load Data ---
    useEffect(() => {
        const savedTrainees = localStorage.getItem('takwin_trainees_db');
        if (savedTrainees) try { setTrainees(JSON.parse(savedTrainees)); } catch(e) {}
        
        const savedInst = localStorage.getItem('takwin_institution_db');
        if (savedInst) try { setInstitution(JSON.parse(savedInst)); } catch(e) {}

        const savedAtt = localStorage.getItem('takwin_attendance_db');
        if (savedAtt) try { setAttendance(JSON.parse(savedAtt)); } catch(e) {}
    }, []);

    // --- Helpers ---
    const saveTrainees = (data: Trainee[]) => {
        setTrainees(data);
        localStorage.setItem('takwin_trainees_db', JSON.stringify(data));
    };

    const saveAttendance = (data: AttendanceRecord) => {
        setAttendance(data);
        localStorage.setItem('takwin_attendance_db', JSON.stringify(data));
    };

    const formatDisplayDate = (isoDate: string) => {
        if (!isoDate || !isoDate.includes('-')) return isoDate;
        const [y, m, d] = isoDate.split('-');
        return `${y}/${m}/${d}`;
    };

    // --- CSV Mapping Helpers (لتحويل النصوص في ملف الإكسل إلى بيانات نظام) ---
    const mapRankText = (text: string): Rank => {
        if (text.includes('أول') || text.includes('1')) return Rank.CLASS_1;
        if (text.includes('ثان') || text.includes('2')) return Rank.CLASS_2;
        if (text.includes('مميز') || text.includes('3')) return Rank.DISTINGUISHED;
        return Rank.CLASS_1;
    };

    const mapSubjectTextToId = (text: string): string => {
        const t = text.trim();
        if (t.includes('فرنسية')) return 'fr';
        if (t.includes('أمازيغية')) return 'ama';
        return 'ar';
    };

    // --- Logic Handlers ---

    const handleUpdateTrainee = () => {
        if (!editingTrainee) return;
        saveTrainees(trainees.map(t => t.id === editingTrainee.id ? editingTrainee : t));
        setEditingTrainee(null);
    };

    const toggleAttendance = (traineeId: string, date: string = attendanceDate) => {
        const key = `${date}-${traineeId}`;
        const currentRecord = attendance[key];
        const newAttendance = { ...attendance };
        if (currentRecord?.status === 'A') delete newAttendance[key]; 
        else newAttendance[key] = { status: 'A' }; 
        saveAttendance(newAttendance);
    };

    const handleTransfer = (newGroupId: number) => {
        if (!transferTarget) return;
        const updatedTrainees = trainees.map(t => 
            t.id === transferTarget.id ? { ...t, groupId: newGroupId } : t
        );
        saveTrainees(updatedTrainees);
        alert(`تم نقل المتربص ${transferTarget.surname} ${transferTarget.name} إلى الفوج ${newGroupId} بنجاح.`);
        setTransferTarget(null);
    };

    const handleAutoGrouping = () => {
        if (trainees.length === 0) return;
        if (!window.confirm("سيتم توزيع المتربصين آلياً على الأفواج. هل أنت متأكد؟")) return;

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

    const handleDelete = (id: string) => { if (window.confirm('هل أنت متأكد؟')) saveTrainees(trainees.filter(t => t.id !== id)); };
    const handleDeleteAll = () => { if (window.confirm(`تحذير: سيتم مسح كافة المتربصين.`)) saveTrainees([]); };

    // --- CSV Import / Export Handlers (تمت إعادتها) ---
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
                    dob: cols[3] || '',
                    pob: cols[6] || '',
                    gender: (cols[4] && (cols[4].includes('أنثى') || cols[4].toLowerCase() === 'f')) ? 'F' : 'M',
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

    const downloadTemplate = () => {
        const BOM = "\uFEFF";
        const headers = ["الرقم", "اللقب", "الاسم", "تاريخ الميلاد (DD/MM/YYYY)", "الجنس", "المؤسسة", "البلدية", "الرتبة", "مادة التدريس"];
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

    // --- Filtering & Stats ---
    const filteredTrainees = trainees.filter(t => {
        const matchesSpec = filterSpecialty === 'all' || t.specialtyId === filterSpecialty;
        const matchesRank = filterRank === 'all' || t.rank === filterRank;
        const matchesSearch = t.surname.includes(searchTerm) || t.name.includes(searchTerm);
        return matchesSpec && matchesRank && matchesSearch;
    }).sort((a, b) => (a.surname + a.name).localeCompare(b.surname + b.name, 'ar'));

    const getStats = () => {
        const total = filteredTrainees.length;
        const males = filteredTrainees.filter(t => t.gender === 'M').length;
        const females = filteredTrainees.filter(t => t.gender === 'F').length;
        return { total, males, females };
    };
    const stats = getStats();

    const groupTrainees = trainees
        .filter(t => t.rank === selectedGroupRank && t.groupId === selectedGroupNum)
        .sort((a, b) => (a.surname + a.name).localeCompare(b.surname + b.name, 'ar'));

    const currentCycleDates = CYCLE_DATES[selectedCycle];

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            
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
                <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-800/60 print:hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">إدارة المتربصين</h2>
                            <p className="text-slate-400 text-sm mt-1">القائمة الشاملة</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                            <button onClick={handleAutoGrouping} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><ArrowRightLeft size={16}/> توزيع آلي</button>
                            
                            {/* --- أزرار الاستيراد والتصدير (تمت إعادتها) --- */}
                            <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><Download size={16}/> نموذج CSV</button>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><Upload size={16}/> استيراد</button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv, .txt" />
                            
                            <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><Plus size={16}/> إضافة</button>
                            {trainees.length > 0 && <button onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><Trash2 size={16}/> حذف الكل</button>}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
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

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950 text-slate-400 font-bold">
                                <tr>
                                    <th className="p-4 w-12">#</th>
                                    <th className="p-4">اللقب والاسم</th>
                                    <th className="p-4 text-center">تاريخ الميلاد</th>
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
                                        <td className="p-4 text-center text-slate-400 font-mono">{formatDisplayDate(t.dob)}</td>
                                        <td className="p-4"><span className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300 font-bold">{t.rank}</span></td>
                                        <td className="p-4 text-center"><span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full font-black">فوج {t.groupId || '-'}</span></td>
                                        <td className="p-4 text-center flex justify-center gap-2">
                                            <button onClick={() => setEditingTrainee(t)} className="text-green-400 hover:bg-green-400/10 p-2 rounded-lg transition-colors" title="تعديل"><Edit size={16}/></button>
                                            <button onClick={() => setTransferTarget(t)} className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors" title="نقل"><Repeat size={16}/></button>
                                            <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB 2: GROUPS (Attendance & Print) --- */}
            {activeTab === 'groups' && (
                <div className="space-y-6">
                    <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800/60 flex flex-wrap gap-6 items-end print:hidden">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">1. اختر الرتبة</label>
                            <select value={selectedGroupRank} onChange={e => { setSelectedGroupRank(e.target.value as Rank); setSelectedGroupNum(1); }} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white w-64 outline-none font-bold">
                                {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">2. رقم الفوج</label>
                            <div className="flex gap-2">
                                {Array.from({ length: institution.rankGroups?.[selectedGroupRank] || 1 }).map((_, idx) => (
                                    <button key={idx} onClick={() => setSelectedGroupNum(idx + 1)} className={`w-10 h-10 rounded-lg font-black flex items-center justify-center transition-all ${selectedGroupNum === idx + 1 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{idx + 1}</button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">3. التاريخ</label>
                            <div className="relative">
                                <CalendarDays className="absolute right-3 top-2.5 text-slate-500 w-4 h-4" />
                                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-white focus:border-purple-500 outline-none w-40 font-bold"/>
                            </div>
                        </div>

                        <div className="mr-auto flex gap-2">
                            <button onClick={() => handlePrint('posting-list-template')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"><FileText size={16} /> القائمة</button>
                            <button onClick={() => handlePrint('attendance-print-template')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"><Printer size={16} /> الحضور</button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden print:hidden">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950 text-slate-400 font-bold">
                                <tr>
                                    <th className="p-4 w-12">#</th>
                                    <th className="p-4">اللقب والاسم</th>
                                    <th className="p-4 text-center">تاريخ الميلاد</th>
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
                                            <td className="p-4 text-center text-slate-400">{formatDisplayDate(t.dob)}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleAttendance(t.id)} className={`w-full py-1.5 rounded flex items-center justify-center gap-2 font-bold transition-colors border ${record?.status === 'A' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
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

            {/* --- TAB 3: CYCLE GRID --- */}
            {activeTab === 'cycle' && (
                <div className="space-y-6">
                     <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800/60 print:hidden">
                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">1. اختر الدورة</label>
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700 w-48">
                            <button onClick={() => setSelectedCycle(1)} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${selectedCycle === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>الدورة 1</button>
                            <button onClick={() => setSelectedCycle(2)} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${selectedCycle === 2 ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>الدورة 2</button>
                        </div>
                     </div>

                     <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-x-auto print:hidden">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950 text-slate-400 font-bold">
                                <tr>
                                    <th className="p-4 w-12 sticky right-0 bg-slate-950">#</th>
                                    <th className="p-4 sticky right-12 bg-slate-950 min-w-[200px]">الاسم واللقب</th>
                                    {currentCycleDates.map((date, i) => (
                                        <th key={date} className="p-2 text-center border-l border-slate-800 min-w-[80px]">
                                            <div className="text-white">{date.slice(5)}</div>
                                            <div className="text-[10px] text-slate-500">س {i+1}</div>
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
                                                <td key={date} className="p-2 text-center border-l border-slate-800 cursor-pointer" onClick={() => toggleAttendance(t.id, date)}>
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

            {/* --- MODALS --- */}
            
            {/* Edit Modal */}
            {editingTrainee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit className="text-green-400" size={24} /> تعديل بيانات المتربص
                            </h3>
                            <button onClick={() => setEditingTrainee(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X size={18}/></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block font-bold">اللقب</label>
                                <input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" value={editingTrainee.surname || ''} onChange={e => setEditingTrainee({...editingTrainee, surname: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block font-bold">الاسم</label>
                                <input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" value={editingTrainee.name || ''} onChange={e => setEditingTrainee({...editingTrainee, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block font-bold">تاريخ الميلاد</label>
                                <input type="date" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" value={editingTrainee.dob || ''} onChange={e => setEditingTrainee({...editingTrainee, dob: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block font-bold">الرتبة</label>
                                <select className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" value={editingTrainee.rank || ''} onChange={e => setEditingTrainee({...editingTrainee, rank: e.target.value as Rank})}>
                                    {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block font-bold">المادة</label>
                                <select className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" value={editingTrainee.specialtyId || ''} onChange={e => setEditingTrainee({...editingTrainee, specialtyId: e.target.value})}>
                                    {VALID_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block font-bold">الجنس</label>
                                <select className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" value={editingTrainee.gender || 'M'} onChange={e => setEditingTrainee({...editingTrainee, gender: e.target.value as 'M'|'F'})}>
                                    <option value="M">ذكر</option>
                                    <option value="F">أنثى</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button onClick={() => setEditingTrainee(null)} className="px-6 py-3 text-slate-300 hover:text-white bg-slate-800 rounded-lg font-bold">إلغاء</button>
                            <button onClick={handleUpdateTrainee} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
                                <Save size={18} /> حفظ التعديلات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {transferTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">نقل الفوج</h3>
                        <p className="text-slate-400 text-sm mb-6">اختر الفوج الجديد للمتربص: {transferTarget.surname}</p>
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({length: institution.rankGroups?.[transferTarget.rank] || 1}).map((_, i) => (
                                <button key={i+1} onClick={() => handleTransfer(i+1)} className="bg-slate-800 hover:bg-purple-600 text-white p-3 rounded-lg font-bold">فوج {i+1}</button>
                            ))}
                        </div>
                        <button onClick={() => setTransferTarget(null)} className="mt-6 text-slate-500 font-bold hover:text-white underline">إغلاق</button>
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
                        <h1 className="text-2xl font-black mt-6 border-2 border-black inline-block px-10 py-2">ورقة الحضور اليومية</h1>
                        <div className="mt-4 flex justify-around text-lg font-bold">
                            <span>الرتبة: {selectedGroupRank}</span>
                            <span>الفوج: {selectedGroupNum}</span>
                            <span>التاريخ: {formatDisplayDate(attendanceDate)}</span>
                        </div>
                    </div>
                    <table className="w-full border-2 border-black text-sm text-center">
                        <thead className="bg-gray-100">
                            <tr className="h-10">
                                <th className="border border-black w-10">رقم</th>
                                <th className="border border-black">اللقب والاسم</th>
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
                                    <td className="border border-black text-xs font-bold">{formatDisplayDate(t.dob)}</td>
                                    <td className="border border-black text-xs">{t.school}</td>
                                    <td className="border border-black"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-12 flex justify-between px-20 font-bold text-lg"><div>إمضاء الأستاذ المكون</div><div>المدير البيداغوجي</div></div>
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
                        <h1 className="text-2xl font-black bg-black text-white py-1 px-6 rounded-md inline-block mb-2">قائمة المتكونين</h1>
                        <h2 className="text-lg font-bold text-gray-800">الرتبة: {selectedGroupRank} | الفوج: {selectedGroupNum}</h2>
                    </div>
                    <div className="flex-1">
                        <table className="w-full border-2 border-black text-center text-sm">
                            <thead className="bg-gray-100 h-8">
                                <tr>
                                    <th className="border border-black w-10 py-1">رقم</th>
                                    <th className="border border-black py-1">اللقب</th>
                                    <th className="border border-black py-1">الاسم</th>
                                    <th className="border border-black w-32 py-1">تاريخ الميلاد</th>
                                    <th className="border border-black w-28 py-1">المادة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupTrainees.map((t, idx) => (
                                    <tr key={t.id} className="h-8">
                                        <td className="border border-black font-bold">{idx + 1}</td>
                                        <td className="border border-black font-bold text-right px-3">{t.surname}</td>
                                        <td className="border border-black font-bold text-right px-3">{t.name}</td>
                                        <td className="border border-black text-xs font-bold">{formatDisplayDate(t.dob)}</td>
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