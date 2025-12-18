import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Student, ClassEntity, Subject, Exam } from '../types';
import { Save, Settings2 } from 'lucide-react';

export const MarksEntry: React.FC = () => {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Selection State
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [selectedExam, setSelectedExam] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [marksState, setMarksState] = useState<Record<number, { sub: number, obj: number }>>({});
  
  // Settings State
  const [maxSubjective, setMaxSubjective] = useState<number>(60);
  const [maxObjective, setMaxObjective] = useState<number>(40);

  useEffect(() => {
    setClasses(db.classes.getAll());
    setExams(db.exams.getAll());
    setSubjects(db.subjects.getAll());
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setStudents(db.students.getByClass(selectedClass));
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  // Load existing marks when selection changes
  useEffect(() => {
    if (selectedClass && selectedExam && selectedSubject) {
        const currentMarks: Record<number, { sub: number, obj: number }> = {};
        const allMarks = db.marks.getAll();
        
        let detectedMaxSub: number | null = null;
        let detectedMaxObj: number | null = null;

        students.forEach(std => {
            const existing = allMarks.find(m => 
                m.student_id === std.id && 
                m.exam_id === selectedExam && 
                m.subject_id === selectedSubject
            );
            if (existing) {
                currentMarks[std.id] = { 
                    sub: existing.subjective_mark, 
                    obj: existing.objective_mark 
                };
                // Detect max marks from existing data
                if (detectedMaxSub === null) {
                    detectedMaxSub = existing.max_subjective;
                    detectedMaxObj = existing.max_objective;
                }
            } else {
                currentMarks[std.id] = { sub: 0, obj: 0 };
            }
        });
        
        // Update max marks if existing data found
        if (detectedMaxSub !== null && detectedMaxObj !== null) {
            setMaxSubjective(detectedMaxSub);
            setMaxObjective(detectedMaxObj);
        }

        setMarksState(currentMarks);
    }
  }, [selectedClass, selectedExam, selectedSubject, students]);

  const handleMarkChange = (studentId: number, type: 'sub' | 'obj', value: string) => {
    const val = value === '' ? 0 : parseInt(value);
    
    if (isNaN(val)) return;

    // Validation against current max settings
    if (type === 'sub' && val > maxSubjective) return;
    if (type === 'obj' && val > maxObjective) return;

    setMarksState(prev => ({
        ...prev,
        [studentId]: {
            ...prev[studentId],
            [type]: val
        }
    }));
  };

  const handleSave = () => {
      if (!selectedExam || !selectedSubject) return;

      students.forEach(std => {
          const m = marksState[std.id] || { sub: 0, obj: 0 };
          db.marks.upsert({
              student_id: std.id,
              exam_id: selectedExam,
              subject_id: selectedSubject,
              subjective_mark: m.sub,
              objective_mark: m.obj,
              max_subjective: maxSubjective,
              max_objective: maxObjective
          });
      });
      alert('Marks saved successfully!');
  };

  const isReady = selectedClass && selectedExam && selectedSubject;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Enter Exam Marks</h2>
      </div>
      
      {/* Filters & Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white transition-colors" value={selectedClass} onChange={e => setSelectedClass(Number(e.target.value))}>
                    <option value={0}>-- Select Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                <select className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white transition-colors" value={selectedExam} onChange={e => setSelectedExam(Number(e.target.value))}>
                    <option value={0}>-- Select Exam --</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
                <select className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white transition-colors" value={selectedSubject} onChange={e => setSelectedSubject(Number(e.target.value))}>
                    <option value={0}>-- Select Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>

        {/* Max Marks Configuration */}
        <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
                <Settings2 className="w-4 h-4 text-primary" />
                <span>Max Marks Configuration</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Subjective</label>
                    <input 
                        type="number" 
                        min="0"
                        value={maxSubjective}
                        onChange={(e) => setMaxSubjective(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Objective</label>
                    <input 
                        type="number" 
                        min="0"
                        value={maxObjective}
                        onChange={(e) => setMaxObjective(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Marks Table */}
      {isReady && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-semibold text-gray-700">Student List</h3>
                 <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Total Max: {maxSubjective + maxObjective}
                 </div>
             </div>
             <table className="w-full">
                <thead className="bg-gray-50 text-gray-700 font-semibold text-sm border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left">Student Name</th>
                        <th className="px-6 py-3 text-center w-32">
                            Subjective <span className="text-xs font-normal text-gray-500">(Max {maxSubjective})</span>
                        </th>
                        <th className="px-6 py-3 text-center w-32">
                            Objective <span className="text-xs font-normal text-gray-500">(Max {maxObjective})</span>
                        </th>
                        <th className="px-6 py-3 text-center w-32">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {students.map(std => {
                        const m = marksState[std.id] || { sub: 0, obj: 0 };
                        const total = m.sub + m.obj;
                        const maxTotal = maxSubjective + maxObjective;
                        const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                        return (
                            <tr key={std.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{std.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <input 
                                        type="number" 
                                        min="0"
                                        max={maxSubjective}
                                        value={m.sub}
                                        onChange={(e) => handleMarkChange(std.id, 'sub', e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <input 
                                        type="number" 
                                        min="0"
                                        max={maxObjective}
                                        value={m.obj}
                                        onChange={(e) => handleMarkChange(std.id, 'obj', e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="font-bold text-gray-900">{total}</div>
                                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
             </table>
             <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
                 <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                 >
                     <Save className="w-5 h-5" />
                     Save Marks
                 </button>
             </div>
          </div>
      )}
      
      {isReady && students.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
              No students found in this class.
          </div>
      )}
    </div>
  );
};