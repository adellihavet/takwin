
import React, { useState, useEffect } from 'react';
import { MODULES, RANK_DISTRIBUTION } from '../constants';
import { Rank, TrainerAssignment } from '../types';
import { GraduationCap } from 'lucide-react';

const CurriculumTable: React.FC = () => {
  const [selectedRank, setSelectedRank] = useState<Rank>(Rank.CLASS_1);
  const [assignments, setAssignments] = useState<TrainerAssignment[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('takwin_assignments');
    if (saved) {
        try {
            setAssignments(JSON.parse(saved));
        } catch (e) {
            console.error("Error parsing assignments", e);
        }
    }
  }, []);

  const currentRankModules = RANK_DISTRIBUTION[selectedRank] || [];

  const getActualHours = (moduleId: number, sessionId: number) => {
      // نأخذ عينة من أول فوج متاح ينتمي لهذه الرتبة لنرى كم ساعة درس
      const sampleGroup = assignments.find(a => a.groupId.startsWith(selectedRank))?.groupId;
      if (!sampleGroup) return 0;

      return assignments.filter(a => 
          a.sessionId === sessionId && 
          a.moduleId === moduleId && 
          a.groupId === sampleGroup
      ).length;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-dzgreen-500/10 rounded-lg">
                  <GraduationCap className="text-dzgreen-400 w-6 h-6" />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-white">البرنامج البيداغوجي (المنجز الفعلي)</h2>
                  <p className="text-slate-400 text-xs">يتم احتساب الساعات من "التوزيع الزمني" لتعكس حالة النصاب الكلي (80 ساعة)</p>
              </div>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {Object.values(Rank).map(r => (
                  <button 
                    key={r} 
                    onClick={() => setSelectedRank(r)} 
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedRank === r ? 'bg-dzgreen-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      {r}
                  </button>
              ))}
          </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-lg font-bold text-white">استهلاك النصاب لرتبة: <span className="text-dzgreen-400">{selectedRank}</span></h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs font-bold border-b border-slate-800">
                <th className="py-4 px-6">المقياس البيداغوجي</th>
                <th className="py-4 px-6 text-center">المعامل</th>
                <th className="py-4 px-6 text-center">الدورة 1 (منجز)</th>
                <th className="py-4 px-6 text-center">الدورة 2 (منجز)</th>
                <th className="py-4 px-6 text-center font-black text-white bg-slate-800/50">إجمالي المنجز</th>
                <th className="py-4 px-6 text-center">النصاب الكلي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentRankModules.map((item) => {
                const module = MODULES.find(m => m.id === item.moduleId);
                if (!module) return null;
                
                const s1 = getActualHours(module.id, 1);
                const s2 = getActualHours(module.id, 2);
                const totalActual = s1 + s2;

                return (
                  <tr key={module.id} className="hover:bg-slate-800/40">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-200">{module.title}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-slate-800 px-3 py-1 rounded-full text-blue-400 font-black">{item.coeff}</span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-blue-300">{s1} سا</td>
                    <td className="py-4 px-6 text-center font-bold text-purple-300">{s2} سا</td>
                    <td className={`py-4 px-6 text-center font-black text-lg ${totalActual >= item.hours ? 'text-dzgreen-400' : 'text-amber-400'}`}>
                        {totalActual} سا
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 text-xs italic">{item.hours} سا</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurriculumTable;
