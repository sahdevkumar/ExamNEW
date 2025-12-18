import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { analyzeStudentPerformance } from '../services/gemini';
import { Student, ClassEntity, PopulatedMark } from '../types';
import { Sparkles, Loader2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Results: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
    const [studentMarks, setStudentMarks] = useState<PopulatedMark[]>([]);
    
    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);

    useEffect(() => {
        setStudents(db.students.getAll());
    }, []);

    const handleSelectStudent = (id: number) => {
        setSelectedStudent(id);
        setAnalysis(null);
        
        // Fetch and populate marks
        const rawMarks = db.marks.getByStudent(id);
        const subjects = db.subjects.getAll();
        const exams = db.exams.getAll();

        const populated: PopulatedMark[] = rawMarks.map(m => {
            const sub = subjects.find(s => s.id === m.subject_id);
            const exam = exams.find(e => e.id === m.exam_id);
            const total = m.subjective_mark + m.objective_mark;
            const max = m.max_subjective + m.max_objective;
            
            return {
                ...m,
                studentName: '', // Not needed for this view specifically
                subjectName: sub?.name || 'Unknown',
                examName: exam?.name || 'Unknown',
                total,
                percentage: (total / max) * 100
            };
        });
        setStudentMarks(populated);
    };

    const runAIAnalysis = async () => {
        if (!selectedStudent) return;
        const student = students.find(s => s.id === selectedStudent);
        if (!student) return;

        setIsAnalyzing(true);
        const result = await analyzeStudentPerformance(student, studentMarks);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
            {/* Student Selector Sidebar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-700">Select Student</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {students.map(s => (
                        <button
                            key={s.id}
                            onClick={() => handleSelectStudent(s.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-colors ${
                                selectedStudent === s.id 
                                ? 'bg-primary text-white shadow-md' 
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            <span className="font-medium">{s.name}</span>
                            <ChevronRight className={`w-4 h-4 ${selectedStudent === s.id ? 'text-white/80' : 'text-gray-400'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                {!selectedStudent ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                        <FileText className="w-12 h-12 mb-2" />
                        <p>Select a student to view their report card.</p>
                    </div>
                ) : (
                    <>
                        {/* Report Card Header */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {students.find(s => s.id === selectedStudent)?.name}
                                    </h2>
                                    <p className="text-gray-500">Student ID: #{selectedStudent}</p>
                                </div>
                                <button
                                    onClick={runAIAnalysis}
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                                >
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate AI Report
                                </button>
                             </div>

                             {/* Marks Table */}
                             {studentMarks.length > 0 ? (
                                 <div className="overflow-hidden rounded-lg border border-gray-200">
                                     <table className="w-full text-sm">
                                         <thead className="bg-gray-50">
                                             <tr>
                                                 <th className="px-4 py-3 text-left">Exam</th>
                                                 <th className="px-4 py-3 text-left">Subject</th>
                                                 <th className="px-4 py-3 text-right">Score</th>
                                                 <th className="px-4 py-3 text-right">Percentage</th>
                                                 <th className="px-4 py-3 text-center">Grade</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-200">
                                             {studentMarks.map((m, idx) => (
                                                 <tr key={idx}>
                                                     <td className="px-4 py-3 text-gray-600">{m.examName}</td>
                                                     <td className="px-4 py-3 font-medium text-gray-900">{m.subjectName}</td>
                                                     <td className="px-4 py-3 text-right text-gray-600">{m.total} / {m.max_subjective + m.max_objective}</td>
                                                     <td className="px-4 py-3 text-right font-bold text-primary">{m.percentage.toFixed(1)}%</td>
                                                     <td className="px-4 py-3 text-center">
                                                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                             m.percentage >= 80 ? 'bg-green-100 text-green-700' :
                                                             m.percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                                             'bg-orange-100 text-orange-700'
                                                         }`}>
                                                             {m.percentage >= 90 ? 'A+' : m.percentage >= 80 ? 'A' : m.percentage >= 70 ? 'B' : m.percentage >= 50 ? 'C' : 'F'}
                                                         </span>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             ) : (
                                 <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                                     No marks recorded yet.
                                 </div>
                             )}
                        </div>

                        {/* AI Analysis Section */}
                        {analysis && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ring-1 ring-purple-100">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-indigo-900">AI Performance Insight</h3>
                                </div>
                                <div className="p-6 prose prose-indigo prose-sm max-w-none">
                                    <ReactMarkdown>{analysis}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};