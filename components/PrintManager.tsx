import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { Student, ClassEntity, Exam, PopulatedMark } from '../types';
import { Printer, Settings, Upload, X, Image as ImageIcon, LayoutTemplate, Save, ChevronDown, Move, ArrowDownRight, Crop as CropIcon, Check, AlignLeft, AlignCenter, AlignRight, Type, Ruler, Download, Plus, Trash2 } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake vfs
if (pdfMake.vfs === undefined && pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
   pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

interface GradeThreshold {
    label: string;
    min: number;
}

interface SchoolSettings {
    name: string;
    address: string;
    logo: string;
    watermark: string;
    backgroundImage: string;
    backgroundImageOpacity: number;
    logoWidth: number;
    logoX: number;
    logoY: number;
    watermarkSize: number;
    addressX: number;
    addressY: number;
    addressAlign: 'left' | 'center' | 'right';
    titleX: number;
    titleY: number;
    customTitle: string;
    headerLineY: number;
    studentDetailsX: number;
    studentDetailsY: number;
    marksTableX: number;
    marksTableY: number;
    signatureX: number;
    signatureY: number;
    signatureLeftText: string;
    signatureRightText: string;
    // Table Headers
    tableHeaderSubject: string;
    tableHeaderMarks: string;
    tableHeaderTotal: string;
    tableHeaderGrade: string;
    // Grading
    gradingScale: GradeThreshold[];
}

// Helper for default center crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const PrintManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bulk' | 'single'>('bulk');
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Selection State
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [selectedExam, setSelectedExam] = useState<number>(0);
  const [selectedStudent, setSelectedStudent] = useState<number>(0);
  
  // Data for printing
  const [reportCards, setReportCards] = useState<{student: Student, marks: PopulatedMark[]}[]>([]);

  // Settings State
  const [showSettings, setShowSettings] = useState(true);
  
  const defaultGradingScale: GradeThreshold[] = [
    { label: 'A+', min: 90 },
    { label: 'A', min: 80 },
    { label: 'B', min: 70 },
    { label: 'C', min: 50 },
    { label: 'F', min: 0 }
  ];

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
      name: '',
      address: '',
      logo: '',
      watermark: '',
      backgroundImage: '',
      backgroundImageOpacity: 100,
      logoWidth: 100,
      logoX: 20,
      logoY: 20,
      watermarkSize: 75,
      addressX: 150,
      addressY: 20,
      addressAlign: 'center',
      titleX: 150,
      titleY: 80,
      customTitle: '',
      headerLineY: 190,
      studentDetailsX: 0,
      studentDetailsY: 220,
      marksTableX: 0,
      marksTableY: 400,
      signatureX: 0,
      signatureY: 650,
      signatureLeftText: 'Class Teacher Signature',
      signatureRightText: 'Principal Signature',
      tableHeaderSubject: 'Subject',
      tableHeaderMarks: 'Marks Obtained',
      tableHeaderTotal: 'Total Marks',
      tableHeaderGrade: 'Grade',
      gradingScale: defaultGradingScale
  });

  // Dragging State
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [activeElement, setActiveElement] = useState<'logo' | 'address' | 'title' | 'studentDetails' | 'marksTable' | 'signature' | 'headerLine' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialElementState, setInitialElementState] = useState({ x: 0, y: 0, w: 0 });

  // Inline Editing State
  const [editingTextElement, setEditingTextElement] = useState<'address' | 'title' | 'sigLeft' | 'sigRight' | 'tblSubject' | 'tblMarks' | 'tblTotal' | 'tblGrade' | null>(null);

  // Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImgSrc, setTempImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [editingField, setEditingField] = useState<'logo' | 'watermark' | 'background' | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setClasses(db.classes.getAll());
    setExams(db.exams.getAll());
    setStudents(db.students.getAll());
    
    // Load Settings with defaults for new fields
    const saved = db.settings.get();
    setSchoolSettings({
        ...saved,
        addressX: saved.addressX ?? 150,
        addressY: saved.addressY ?? 20,
        addressAlign: saved.addressAlign ?? 'center',
        titleX: saved.titleX ?? 150,
        titleY: saved.titleY ?? 80,
        customTitle: saved.customTitle ?? '',
        headerLineY: saved.headerLineY ?? 190,
        studentDetailsX: saved.studentDetailsX ?? 0,
        studentDetailsY: saved.studentDetailsY ?? 220,
        marksTableX: saved.marksTableX ?? 0,
        marksTableY: saved.marksTableY ?? 400,
        signatureX: saved.signatureX ?? 0,
        signatureY: saved.signatureY ?? 650,
        signatureLeftText: saved.signatureLeftText ?? 'Class Teacher Signature',
        signatureRightText: saved.signatureRightText ?? 'Principal Signature',
        tableHeaderSubject: saved.tableHeaderSubject ?? 'Subject',
        tableHeaderMarks: saved.tableHeaderMarks ?? 'Marks Obtained',
        tableHeaderTotal: saved.tableHeaderTotal ?? 'Total Marks',
        tableHeaderGrade: saved.tableHeaderGrade ?? 'Grade',
        backgroundImage: saved.backgroundImage ?? '',
        backgroundImageOpacity: saved.backgroundImageOpacity ?? 100,
        gradingScale: saved.gradingScale ?? defaultGradingScale,
    });
  }, []);

  // --- Grade Calculation ---
  const calculateGrade = (percentage: number) => {
    const scale = schoolSettings.gradingScale && schoolSettings.gradingScale.length > 0 
        ? schoolSettings.gradingScale 
        : defaultGradingScale;
    
    // Sort descending by min percentage to find the highest match first
    const sorted = [...scale].sort((a, b) => b.min - a.min);
    const match = sorted.find(g => percentage >= g.min);
    return match ? match.label : 'F';
  };

  // --- Drag and Drop Logic ---

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize', element: 'logo' | 'address' | 'title' | 'studentDetails' | 'marksTable' | 'signature' | 'headerLine') => {
    if (!showSettings) return; // Only allow editing when settings panel is open
    // Prevent drag if we are clicking into an input/textarea
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setActiveElement(element);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Store initial positions
    const settings = schoolSettings;
    if (element === 'logo') setInitialElementState({ x: settings.logoX, y: settings.logoY, w: settings.logoWidth });
    else if (element === 'address') setInitialElementState({ x: settings.addressX, y: settings.addressY, w: 0 });
    else if (element === 'title') setInitialElementState({ x: settings.titleX, y: settings.titleY, w: 0 });
    else if (element === 'studentDetails') setInitialElementState({ x: settings.studentDetailsX, y: settings.studentDetailsY, w: 0 });
    else if (element === 'marksTable') setInitialElementState({ x: settings.marksTableX, y: settings.marksTableY, w: 0 });
    else if (element === 'signature') setInitialElementState({ x: settings.signatureX, y: settings.signatureY, w: 0 });
    else if (element === 'headerLine') setInitialElementState({ x: 0, y: settings.headerLineY, w: 0 });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !dragType || !activeElement) return;

        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        if (dragType === 'move') {
            if (activeElement === 'logo') {
                setSchoolSettings(prev => ({ ...prev, logoX: Math.max(0, initialElementState.x + dx), logoY: Math.max(0, initialElementState.y + dy) }));
            } else if (activeElement === 'address') {
                setSchoolSettings(prev => ({ ...prev, addressX: Math.max(0, initialElementState.x + dx), addressY: Math.max(0, initialElementState.y + dy) }));
            } else if (activeElement === 'title') {
                setSchoolSettings(prev => ({ ...prev, titleX: Math.max(0, initialElementState.x + dx), titleY: Math.max(0, initialElementState.y + dy) }));
            } else if (activeElement === 'studentDetails') {
                setSchoolSettings(prev => ({ ...prev, studentDetailsX: Math.max(0, initialElementState.x + dx), studentDetailsY: Math.max(0, initialElementState.y + dy) }));
            } else if (activeElement === 'marksTable') {
                setSchoolSettings(prev => ({ ...prev, marksTableX: Math.max(0, initialElementState.x + dx), marksTableY: Math.max(0, initialElementState.y + dy) }));
            } else if (activeElement === 'signature') {
                setSchoolSettings(prev => ({ ...prev, signatureX: Math.max(0, initialElementState.x + dx), signatureY: Math.max(0, initialElementState.y + dy) }));
            } else if (activeElement === 'headerLine') {
                setSchoolSettings(prev => ({ ...prev, headerLineY: Math.max(0, initialElementState.y + dy) }));
            }
        } else if (dragType === 'resize' && activeElement === 'logo') {
             setSchoolSettings(prev => ({
                ...prev,
                logoWidth: Math.max(50, initialElementState.w + dx) // Minimum width 50px
            }));
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            setDragType(null);
            setActiveElement(null);
        }
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragStart, activeElement, initialElementState]);

  // --- End Drag and Drop Logic ---

  // --- Inline Edit Logic ---
  const handleDoubleClick = (e: React.MouseEvent, element: 'address' | 'title' | 'sigLeft' | 'sigRight' | 'tblSubject' | 'tblMarks' | 'tblTotal' | 'tblGrade') => {
      if (!showSettings) return;
      e.stopPropagation();
      setEditingTextElement(element);
  };
  // --- End Inline Edit Logic ---

  // --- Cropping Logic ---

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'watermark' | 'background') => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setTempImgSrc(reader.result?.toString() || '');
        setEditingField(field);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Default to square center crop
    const center = centerAspectCrop(width, height, 1);
    setCrop(center);
  };

  const saveCroppedImage = async () => {
    if (completedCrop && imgRef.current) {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Better quality
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
      );
      
      const base64 = canvas.toDataURL('image/png');
      
      if (editingField === 'logo') {
        setSchoolSettings(prev => ({ ...prev, logo: base64 }));
      } else if (editingField === 'watermark') {
        setSchoolSettings(prev => ({ ...prev, watermark: base64 }));
      } else if (editingField === 'background') {
        setSchoolSettings(prev => ({ ...prev, backgroundImage: base64 }));
      }
    } else {
        // Fallback if no crop happened (rare with init)
        if (editingField === 'logo') setSchoolSettings(prev => ({ ...prev, logo: tempImgSrc }));
        else if (editingField === 'watermark') setSchoolSettings(prev => ({ ...prev, watermark: tempImgSrc }));
        else if (editingField === 'background') setSchoolSettings(prev => ({ ...prev, backgroundImage: tempImgSrc }));
    }
    setCropModalOpen(false);
  };

  // --- End Cropping Logic ---

  // --- PDF Export Logic ---
  const handleExportPDF = () => {
    if (reportCards.length === 0) return;

    const docDefinition: any = {
      content: [],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        address: {
          fontSize: 10,
          alignment: schoolSettings.addressAlign,
          margin: [0, 0, 0, 20],
          color: '#555'
        },
        title: {
          fontSize: 14,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 15],
          color: '#000',
          decoration: 'underline'
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'black',
          fillColor: '#f3f4f6'
        },
        studentInfo: {
            fontSize: 10,
            margin: [0, 0, 0, 20]
        },
        marksTable: {
            margin: [0, 10, 0, 20]
        },
        signature: {
            fontSize: 10,
            bold: true,
            margin: [0, 50, 0, 0]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Add Background if exists
    if (schoolSettings.backgroundImage) {
        docDefinition.background = (currentPage: number) => {
            return {
                image: schoolSettings.backgroundImage,
                width: 595, // A4 width
                height: 842, // A4 height
                opacity: schoolSettings.backgroundImageOpacity / 100
            };
        };
    }

    reportCards.forEach((rc, index) => {
        // Page Break for subsequent pages
        if (index > 0) {
            docDefinition.content.push({ text: '', pageBreak: 'before' });
        }

        const contentStack = [];

        // 1. Logo & Address Header
        const headerColumns: any[] = [];
        
        if (schoolSettings.logo) {
            headerColumns.push({
                image: schoolSettings.logo,
                width: 60,
                alignment: 'center'
            });
        }

        contentStack.push({
            columns: [
                schoolSettings.logo ? { width: 80, stack: [{ image: schoolSettings.logo, width: 60 }] } : { width: 0, text: '' },
                {
                    width: '*',
                    stack: [
                         { text: schoolSettings.address, style: 'address' }
                    ]
                }
            ],
            columnGap: 10,
            margin: [0, 0, 0, 10]
        });

        // 2. Horizontal Line (Header Line)
        contentStack.push({
            canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1.5 }]
        });
        
        // 3. Exam Title
        contentStack.push({
            text: schoolSettings.customTitle || rc.marks[0]?.examName || 'Report Card',
            style: 'title',
            margin: [0, 20, 0, 20]
        });

        // 4. Student Details
        const currentClass = classes.find(c => c.id === rc.student.class_id);
        
        contentStack.push({
            columns: [
                {
                    width: '50%',
                    stack: [
                        { text: `Student Name: ${rc.student.name}`, margin: [0, 2] },
                        { text: `Roll No / ID: #${rc.student.id}`, margin: [0, 2] },
                        { text: `Class: ${currentClass?.name || 'N/A'}`, margin: [0, 2] },
                    ],
                    style: 'studentInfo'
                },
                {
                    width: '50%',
                    stack: [
                         { text: `Parent Name: ${rc.student.parent}`, margin: [0, 2] },
                         { text: `Date of Birth: ${rc.student.dob}`, margin: [0, 2] },
                         { text: `Date Issued: ${new Date().toLocaleDateString()}`, margin: [0, 2] },
                    ],
                    style: 'studentInfo'
                }
            ]
        });

        // 5. Marks Table
        const tableBody: any[] = [
            [
                { text: schoolSettings.tableHeaderSubject, style: 'tableHeader' },
                { text: schoolSettings.tableHeaderMarks, style: 'tableHeader', alignment: 'center' },
                { text: schoolSettings.tableHeaderTotal, style: 'tableHeader', alignment: 'center' },
                { text: schoolSettings.tableHeaderGrade, style: 'tableHeader', alignment: 'center' }
            ]
        ];

        rc.marks.forEach(m => {
             tableBody.push([
                 { text: m.subjectName },
                 { text: m.total.toString(), alignment: 'center' },
                 { text: (m.max_subjective + m.max_objective).toString(), alignment: 'center' },
                 { 
                     text: calculateGrade(m.percentage), 
                     alignment: 'center', 
                     bold: true 
                 }
             ]);
        });
        
        // Totals Row
        const totalObtained = rc.marks.reduce((sum, m) => sum + m.total, 0);
        const totalMax = rc.marks.reduce((sum, m) => sum + (m.max_subjective + m.max_objective), 0);
        const totalPercentage = totalMax ? (totalObtained / totalMax) * 100 : 0;
        const finalGrade = calculateGrade(totalPercentage);

        tableBody.push([
            { text: 'Total Result', bold: true, fillColor: '#f9fafb' },
            { text: totalObtained.toString(), alignment: 'center', bold: true, fillColor: '#f9fafb' },
            { text: totalMax.toString(), alignment: 'center', bold: true, fillColor: '#f9fafb' },
            { text: finalGrade, alignment: 'center', bold: true, fillColor: '#f9fafb' }
        ]);

        contentStack.push({
            table: {
                headerRows: 1,
                widths: ['*', 80, 80, 60],
                body: tableBody
            },
            layout: 'lightHorizontalLines',
            style: 'marksTable'
        });

        // 6. Signatures
        contentStack.push({
            columns: [
                {
                    stack: [
                         { text: schoolSettings.signatureLeftText, alignment: 'center', decoration: 'overline' }
                    ],
                    style: 'signature'
                },
                {
                    stack: [
                         { text: schoolSettings.signatureRightText, alignment: 'center', decoration: 'overline' }
                    ],
                    style: 'signature'
                }
            ],
            margin: [0, 60, 0, 0]
        });

        docDefinition.content.push(contentStack);
    });

    pdfMake.createPdf(docDefinition).download(`Report_Cards_${new Date().toISOString().slice(0,10)}.pdf`);
  };
  // --- End PDF Export Logic ---

  const generateReportData = (studentId: number | null, classId: number | null, examId: number) => {
    const targetStudents = studentId 
        ? students.filter(s => s.id === studentId)
        : students.filter(s => s.class_id === classId);
    
    const subjects = db.subjects.getAll();
    const exam = exams.find(e => e.id === examId);

    const data = targetStudents.map(std => {
        const rawMarks = db.marks.getByStudent(std.id).filter(m => m.exam_id === examId);
        const populated: PopulatedMark[] = rawMarks.map(m => {
            const sub = subjects.find(s => s.id === m.subject_id);
            const total = m.subjective_mark + m.objective_mark;
            const max = m.max_subjective + m.max_objective;
            return {
                ...m,
                studentName: std.name,
                subjectName: sub?.name || 'Unknown',
                examName: exam?.name || 'Unknown',
                total,
                percentage: max > 0 ? (total / max) * 100 : 0
            };
        });
        return { student: std, marks: populated };
    });
    setReportCards(data);
  };

  useEffect(() => {
     if (activeTab === 'bulk' && selectedClass && selectedExam) {
         generateReportData(null, selectedClass, selectedExam);
     } else if (activeTab === 'single' && selectedStudent && selectedExam) {
         generateReportData(selectedStudent, null, selectedExam);
     } else {
         setReportCards([]);
     }
  }, [activeTab, selectedClass, selectedExam, selectedStudent]);

  const handlePrint = () => {
    window.print();
  };

  const saveSettings = () => {
      db.settings.save(schoolSettings);
      alert('Layout configuration saved successfully!');
  };

  // --- Rulers ---
  const renderHorizontalRuler = () => (
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gray-50 border-b border-gray-300 select-none print:hidden overflow-hidden flex font-mono text-[9px] text-gray-400 z-40">
          {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-none relative w-[50px] h-full border-l border-gray-200">
                  <span className="absolute top-0 left-1">{i * 50}</span>
                  <div className="absolute bottom-0 left-0 w-px h-2 bg-gray-400" />
                  {[10, 20, 30, 40].map(off => (
                      <div key={off} className="absolute bottom-0 w-px h-1 bg-gray-300" style={{ left: `${off}px` }} />
                  ))}
              </div>
          ))}
      </div>
  );

  const renderVerticalRuler = () => (
      <div className="absolute top-0 -left-6 bottom-0 w-6 bg-gray-50 border-r border-gray-300 select-none print:hidden overflow-hidden flex flex-col font-mono text-[9px] text-gray-400 z-40">
          {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-none relative h-[50px] w-full border-t border-gray-200">
                  <span className="absolute top-1 left-1 rotate-90 origin-top-left translate-x-3">{i * 50}</span>
                  <div className="absolute top-0 right-0 h-px w-2 bg-gray-400" />
                  {[10, 20, 30, 40].map(off => (
                      <div key={off} className="absolute right-0 h-px w-1 bg-gray-300" style={{ top: `${off}px` }} />
                  ))}
              </div>
          ))}
      </div>
  );

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Print Management</h2>
            <p className="text-sm text-gray-500">Generate and print student report cards</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    showSettings 
                        ? 'bg-gray-100 text-gray-800 font-semibold border border-gray-200' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
                {showSettings ? <LayoutTemplate className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                {showSettings ? 'Hide Layout Editor' : 'Edit Layout'}
            </button>
            <button 
                onClick={handleExportPDF} 
                disabled={reportCards.length === 0} 
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
            >
                <Download className="w-4 h-4" /> 
                Export PDF
            </button>
            <button 
                onClick={handlePrint} 
                disabled={reportCards.length === 0} 
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4" /> 
                Print Now
            </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
           
           {/* Left/Main: Preview & Controls */}
           <div className="flex-1 w-full min-w-0 space-y-6">
               
               {/* Controls & Filters */}
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200 mb-4">
                        <button 
                            onClick={() => { setActiveTab('bulk'); setSelectedStudent(0); }}
                            className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'bulk' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Bulk Print
                        </button>
                        <button 
                            onClick={() => { setActiveTab('single'); setSelectedClass(0); }}
                            className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Individual Print
                        </button>
                    </div>

                    {/* Filter Inputs */}
                    {activeTab === 'bulk' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                                <div className="relative">
                                    <select className="w-full p-2 pr-8 border rounded-lg appearance-none bg-white" value={selectedClass} onChange={e => setSelectedClass(Number(e.target.value))}>
                                        <option value={0}>Select Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                                <div className="relative">
                                    <select className="w-full p-2 pr-8 border rounded-lg appearance-none bg-white" value={selectedExam} onChange={e => setSelectedExam(Number(e.target.value))}>
                                        <option value={0}>Select Exam</option>
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                                <div className="relative">
                                    <select className="w-full p-2 pr-8 border rounded-lg appearance-none bg-white" value={selectedStudent} onChange={e => setSelectedStudent(Number(e.target.value))}>
                                        <option value={0}>Select Student</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({classes.find(c => c.id === s.class_id)?.name})</option>)}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                                <div className="relative">
                                    <select className="w-full p-2 pr-8 border rounded-lg appearance-none bg-white" value={selectedExam} onChange={e => setSelectedExam(Number(e.target.value))}>
                                        <option value={0}>Select Exam</option>
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    )}
               </div>

               {/* Preview Area */}
               <div id="print-area" className="space-y-12 pl-6 pt-6">
                {reportCards.length > 0 ? reportCards.map((rc, idx) => (
                    <div key={idx} className="relative">
                        {/* Rulers Overlay */}
                        {showSettings && renderHorizontalRuler()}
                        {showSettings && renderVerticalRuler()}

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:break-after-page min-h-[800px] relative overflow-hidden transition-all duration-300">
                            
                            {/* Background Image Overlay */}
                            {schoolSettings.backgroundImage && (
                                <div className="absolute inset-0 z-0 pointer-events-none">
                                    <img 
                                        src={schoolSettings.backgroundImage} 
                                        alt="Background" 
                                        className="w-full h-full object-cover"
                                        style={{ opacity: schoolSettings.backgroundImageOpacity / 100 }}
                                    />
                                </div>
                            )}

                            {/* Watermark Overlay */}
                            {schoolSettings.watermark && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <img 
                                        src={schoolSettings.watermark} 
                                        alt="Watermark" 
                                        className="object-contain opacity-10"
                                        style={{ 
                                            width: `${schoolSettings.watermarkSize}%`, 
                                            height: `${schoolSettings.watermarkSize}%` 
                                        }}
                                    />
                                </div>
                            )}

                            <div className="relative z-10">
                                {/* Header Container (Relative reference for absolute children) */}
                                <div ref={headerRef} className="relative h-[200px] mb-6">
                                    
                                    {/* Draggable Header Line */}
                                    <div 
                                        className={`absolute left-0 w-full h-0.5 bg-gray-800 z-30 group cursor-ns-resize ${showSettings ? 'hover:h-1 hover:bg-primary transition-all' : ''}`}
                                        style={{ top: `${schoolSettings.headerLineY}px` }}
                                        onMouseDown={(e) => handleMouseDown(e, 'move', 'headerLine')}
                                    >
                                        {showSettings && <div className="absolute -top-2 w-full h-4 bg-transparent group-hover:bg-primary/5"></div>}
                                    </div>

                                    {/* Draggable Logo */}
                                    {schoolSettings.logo && (
                                        <div 
                                            className={`absolute z-20 group ${showSettings ? 'cursor-move' : ''}`}
                                            style={{ 
                                                left: `${schoolSettings.logoX}px`, 
                                                top: `${schoolSettings.logoY}px`,
                                                width: `${schoolSettings.logoWidth}px`
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, 'move', 'logo')}
                                        >
                                            <img 
                                                src={schoolSettings.logo} 
                                                alt="Logo" 
                                                className={`w-full h-auto object-contain select-none pointer-events-none ${showSettings ? 'ring-2 ring-transparent group-hover:ring-primary/50 rounded-lg' : ''}`}
                                            />
                                            
                                            {/* Resize Handle */}
                                            {showSettings && (
                                                <div 
                                                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                                    onMouseDown={(e) => handleMouseDown(e, 'resize', 'logo')}
                                                >
                                                    <ArrowDownRight className="w-3 h-3 text-gray-500" />
                                                </div>
                                            )}
                                            
                                            {/* Drag Indicator Overlay */}
                                            {showSettings && (
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none print:hidden border border-dashed border-primary"></div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Draggable & Editable Address */}
                                    {schoolSettings.address && (
                                        <div
                                            className={`absolute z-20 group ${showSettings ? 'cursor-move' : ''}`}
                                            style={{ 
                                                left: `${schoolSettings.addressX}px`, 
                                                top: `${schoolSettings.addressY}px`,
                                                maxWidth: '400px',
                                                textAlign: schoolSettings.addressAlign
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, 'move', 'address')}
                                            onDoubleClick={(e) => handleDoubleClick(e, 'address')}
                                        >
                                            {editingTextElement === 'address' ? (
                                                <textarea
                                                    autoFocus
                                                    value={schoolSettings.address}
                                                    onChange={(e) => setSchoolSettings({...schoolSettings, address: e.target.value})}
                                                    onBlur={() => setEditingTextElement(null)}
                                                    className="w-full min-w-[300px] h-24 bg-white/90 p-2 border border-primary rounded shadow-lg resize-none outline-none z-50 relative"
                                                    style={{ textAlign: schoolSettings.addressAlign }}
                                                />
                                            ) : (
                                                <p className={`text-gray-600 select-none whitespace-pre-wrap ${showSettings ? 'ring-2 ring-transparent group-hover:ring-primary/50 rounded-lg p-2 hover:bg-white/50' : ''}`}>
                                                    {schoolSettings.address}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Draggable & Editable Title (Exam Name) */}
                                    <div
                                        className={`absolute z-20 group ${showSettings ? 'cursor-move' : ''}`}
                                        style={{ 
                                            left: `${schoolSettings.titleX}px`, 
                                            top: `${schoolSettings.titleY}px`
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'move', 'title')}
                                        onDoubleClick={(e) => handleDoubleClick(e, 'title')}
                                    >
                                        {editingTextElement === 'title' ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={schoolSettings.customTitle || rc.marks[0]?.examName || 'Report Card'}
                                                onChange={(e) => setSchoolSettings({...schoolSettings, customTitle: e.target.value})}
                                                onBlur={() => setEditingTextElement(null)}
                                                className="px-4 py-1 text-xl font-bold text-black border border-primary rounded shadow-lg outline-none w-64"
                                            />
                                        ) : (
                                            <div className={`inline-block rounded border border-gray-400 bg-gray-50 px-4 py-1 select-none ${showSettings ? 'ring-2 ring-transparent group-hover:ring-primary/50' : ''}`}>
                                                <h2 className="text-xl font-bold text-black">
                                                    {schoolSettings.customTitle || rc.marks[0]?.examName || 'Report Card'}
                                                </h2>
                                            </div>
                                        )}
                                    </div>

                                </div>
                                
                                {/* Draggable Student Details */}
                                <div 
                                    className={`absolute z-20 group ${showSettings ? 'cursor-move' : ''}`}
                                    style={{ 
                                        left: `${schoolSettings.studentDetailsX}px`, 
                                        top: `${schoolSettings.studentDetailsY}px`,
                                        width: '100%'
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move', 'studentDetails')}
                                >
                                    <div className={`grid grid-cols-2 gap-8 text-sm text-black select-none ${showSettings ? 'ring-2 ring-transparent group-hover:ring-primary/50 rounded-lg p-2 bg-white/80' : ''}`}>
                                        <div className="space-y-3 pointer-events-none">
                                            <div className="flex border-b border-gray-200 pb-1">
                                                <span className="font-bold w-32">Student Name:</span>
                                                <span>{rc.student.name}</span>
                                            </div>
                                            <div className="flex border-b border-gray-200 pb-1">
                                                <span className="font-bold w-32">Roll No / ID:</span>
                                                <span>#{rc.student.id}</span>
                                            </div>
                                            <div className="flex border-b border-gray-200 pb-1">
                                                <span className="font-bold w-32">Class:</span>
                                                <span>{classes.find(c => c.id === rc.student.class_id)?.name}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pointer-events-none">
                                            <div className="flex border-b border-gray-200 pb-1">
                                                <span className="font-bold w-32">Parent Name:</span>
                                                <span>{rc.student.parent}</span>
                                            </div>
                                            <div className="flex border-b border-gray-200 pb-1">
                                                <span className="font-bold w-32">Date of Birth:</span>
                                                <span>{rc.student.dob}</span>
                                            </div>
                                            <div className="flex border-b border-gray-200 pb-1">
                                                <span className="font-bold w-32">Date Issued:</span>
                                                <span>{new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Draggable Marks Table */}
                                <div 
                                    className={`absolute z-20 group ${showSettings ? 'cursor-move' : ''}`}
                                    style={{ 
                                        left: `${schoolSettings.marksTableX}px`, 
                                        top: `${schoolSettings.marksTableY}px`,
                                        width: '100%'
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move', 'marksTable')}
                                >
                                    <div className={`${showSettings ? 'ring-2 ring-transparent group-hover:ring-primary/50 rounded-lg p-1 bg-white/80' : ''}`}>
                                        <table className="w-full border-collapse border border-gray-400 text-sm text-black bg-white/50 select-none">
                                            <thead className="bg-gray-100 print:bg-gray-200">
                                                <tr>
                                                    {/* Editable Header: Subject */}
                                                    <th 
                                                        className="border border-gray-400 px-4 py-2 text-left cursor-text hover:bg-gray-200"
                                                        onDoubleClick={(e) => handleDoubleClick(e, 'tblSubject')}
                                                    >
                                                        {editingTextElement === 'tblSubject' ? (
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                value={schoolSettings.tableHeaderSubject}
                                                                onChange={(e) => setSchoolSettings({...schoolSettings, tableHeaderSubject: e.target.value})}
                                                                onBlur={() => setEditingTextElement(null)}
                                                                className="bg-transparent border-b border-primary outline-none w-full"
                                                            />
                                                        ) : schoolSettings.tableHeaderSubject}
                                                    </th>
                                                    
                                                    {/* Editable Header: Marks Obtained */}
                                                    <th 
                                                        className="border border-gray-400 px-4 py-2 text-center w-32 cursor-text hover:bg-gray-200"
                                                        onDoubleClick={(e) => handleDoubleClick(e, 'tblMarks')}
                                                    >
                                                         {editingTextElement === 'tblMarks' ? (
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                value={schoolSettings.tableHeaderMarks}
                                                                onChange={(e) => setSchoolSettings({...schoolSettings, tableHeaderMarks: e.target.value})}
                                                                onBlur={() => setEditingTextElement(null)}
                                                                className="bg-transparent border-b border-primary outline-none w-full text-center"
                                                            />
                                                        ) : schoolSettings.tableHeaderMarks}
                                                    </th>
                                                    
                                                    {/* Editable Header: Total Marks */}
                                                    <th 
                                                        className="border border-gray-400 px-4 py-2 text-center w-32 cursor-text hover:bg-gray-200"
                                                        onDoubleClick={(e) => handleDoubleClick(e, 'tblTotal')}
                                                    >
                                                         {editingTextElement === 'tblTotal' ? (
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                value={schoolSettings.tableHeaderTotal}
                                                                onChange={(e) => setSchoolSettings({...schoolSettings, tableHeaderTotal: e.target.value})}
                                                                onBlur={() => setEditingTextElement(null)}
                                                                className="bg-transparent border-b border-primary outline-none w-full text-center"
                                                            />
                                                        ) : schoolSettings.tableHeaderTotal}
                                                    </th>

                                                    {/* Editable Header: Grade */}
                                                    <th 
                                                        className="border border-gray-400 px-4 py-2 text-center w-24 cursor-text hover:bg-gray-200"
                                                        onDoubleClick={(e) => handleDoubleClick(e, 'tblGrade')}
                                                    >
                                                         {editingTextElement === 'tblGrade' ? (
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                value={schoolSettings.tableHeaderGrade}
                                                                onChange={(e) => setSchoolSettings({...schoolSettings, tableHeaderGrade: e.target.value})}
                                                                onBlur={() => setEditingTextElement(null)}
                                                                className="bg-transparent border-b border-primary outline-none w-full text-center"
                                                            />
                                                        ) : schoolSettings.tableHeaderGrade}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rc.marks.map((m, i) => (
                                                    <tr key={i}>
                                                        <td className="border border-gray-400 px-4 py-2 font-medium">{m.subjectName}</td>
                                                        <td className="border border-gray-400 px-4 py-2 text-center">{m.total}</td>
                                                        <td className="border border-gray-400 px-4 py-2 text-center">{m.max_subjective + m.max_objective}</td>
                                                        <td className="border border-gray-400 px-4 py-2 text-center font-bold">
                                                            {calculateGrade(m.percentage)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {rc.marks.length === 0 && (
                                                    <tr><td colSpan={4} className="text-center p-4 border border-gray-400">No marks found</td></tr>
                                                )}
                                            </tbody>
                                            <tfoot className="bg-gray-50 print:bg-gray-100 font-bold">
                                                <tr>
                                                    <td className="border border-gray-400 px-4 py-2">Total Result</td>
                                                    <td className="border border-gray-400 px-4 py-2 text-center">
                                                        {rc.marks.reduce((sum, m) => sum + m.total, 0)}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-2 text-center">
                                                        {rc.marks.reduce((sum, m) => sum + (m.max_subjective + m.max_objective), 0)}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-2 text-center">
                                                        {(() => {
                                                            const totalObtained = rc.marks.reduce((sum, m) => sum + m.total, 0);
                                                            const totalMax = rc.marks.reduce((sum, m) => sum + (m.max_subjective + m.max_objective), 0);
                                                            const percentage = totalMax ? (totalObtained / totalMax) * 100 : 0;
                                                            return calculateGrade(percentage);
                                                        })()}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                
                                {/* Draggable & Editable Signature Section */}
                                <div 
                                    className={`absolute z-20 group ${showSettings ? 'cursor-move' : ''}`}
                                    style={{ 
                                        left: `${schoolSettings.signatureX}px`, 
                                        top: `${schoolSettings.signatureY}px`,
                                        width: '100%'
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move', 'signature')}
                                >
                                    <div className={`flex justify-between pt-8 select-none ${showSettings ? 'ring-2 ring-transparent group-hover:ring-primary/50 rounded-lg p-2 bg-white/80' : ''}`}>
                                        <div className="text-center" onDoubleClick={(e) => handleDoubleClick(e, 'sigLeft')}>
                                            <div className="h-12 border-b border-gray-800 w-48 mb-2"></div>
                                            {editingTextElement === 'sigLeft' ? (
                                                 <input
                                                    autoFocus
                                                    type="text"
                                                    value={schoolSettings.signatureLeftText}
                                                    onChange={(e) => setSchoolSettings({...schoolSettings, signatureLeftText: e.target.value})}
                                                    onBlur={() => setEditingTextElement(null)}
                                                    className="text-sm font-bold text-gray-800 border-b border-primary outline-none text-center bg-transparent w-full"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-gray-800">{schoolSettings.signatureLeftText}</span>
                                            )}
                                        </div>
                                        <div className="text-center" onDoubleClick={(e) => handleDoubleClick(e, 'sigRight')}>
                                            <div className="h-12 border-b border-gray-800 w-48 mb-2"></div>
                                            {editingTextElement === 'sigRight' ? (
                                                 <input
                                                    autoFocus
                                                    type="text"
                                                    value={schoolSettings.signatureRightText}
                                                    onChange={(e) => setSchoolSettings({...schoolSettings, signatureRightText: e.target.value})}
                                                    onBlur={() => setEditingTextElement(null)}
                                                    className="text-sm font-bold text-gray-800 border-b border-primary outline-none text-center bg-transparent w-full"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-gray-800">{schoolSettings.signatureRightText}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 print:hidden flex flex-col items-center justify-center mr-6">
                        <Printer className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-600">No Preview Available</p>
                        <p className="text-sm">Please select a class or student to generate report cards.</p>
                    </div>
                )}
              </div>
           </div>

           {/* Right: Settings Sidebar (Sticky) */}
           {showSettings && (
               <div className="w-full lg:w-96 shrink-0 print:hidden lg:sticky lg:top-4">
                   <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                       <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2">
                               <Settings className="w-4 h-4 text-gray-500" />
                               Configuration
                           </h3>
                           <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200">
                               <X className="w-4 h-4" />
                           </button>
                       </div>
                       
                       <div className="p-5 space-y-6 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
                            {/* Help Banner */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 space-y-2">
                                <div className="flex items-start gap-2">
                                    <Move className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    <span>Drag elements to position them. Move the black horizontal line to adjust header height.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Type className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    <span><b>Double-click</b> on Address, Title, Table Headers, or Signatures in the preview to edit text instantly.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Ruler className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    <span>Use rulers to align elements precisely.</span>
                                </div>
                            </div>

                            {/* Text Settings */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">School Address</label>
                                        <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                                            <button 
                                                onClick={() => setSchoolSettings({...schoolSettings, addressAlign: 'left'})}
                                                className={`p-1 rounded ${schoolSettings.addressAlign === 'left' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <AlignLeft className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => setSchoolSettings({...schoolSettings, addressAlign: 'center'})}
                                                className={`p-1 rounded ${schoolSettings.addressAlign === 'center' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <AlignCenter className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => setSchoolSettings({...schoolSettings, addressAlign: 'right'})}
                                                className={`p-1 rounded ${schoolSettings.addressAlign === 'right' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <AlignRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea 
                                        rows={2}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm resize-none" 
                                        value={schoolSettings.address}
                                        onChange={e => setSchoolSettings({...schoolSettings, address: e.target.value})}
                                        placeholder="Enter Address"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Report Title Override</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                        value={schoolSettings.customTitle}
                                        onChange={e => setSchoolSettings({...schoolSettings, customTitle: e.target.value})}
                                        placeholder="Leave empty to use Exam Name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Left Signature</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                            value={schoolSettings.signatureLeftText}
                                            onChange={e => setSchoolSettings({...schoolSettings, signatureLeftText: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Right Signature</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                            value={schoolSettings.signatureRightText}
                                            onChange={e => setSchoolSettings({...schoolSettings, signatureRightText: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <hr className="border-gray-100" />

                            {/* Grading Scale Settings */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Grading Scale</label>
                                    <button 
                                        onClick={() => {
                                            setSchoolSettings(prev => ({
                                                ...prev,
                                                gradingScale: [...prev.gradingScale, { label: 'New', min: 0 }].sort((a,b) => b.min - a.min)
                                            }));
                                        }}
                                        className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
                                    >
                                        <Plus className="w-3 h-3" /> Add Grade
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {schoolSettings.gradingScale.sort((a,b) => b.min - a.min).map((grade, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input 
                                                type="text" 
                                                value={grade.label}
                                                onChange={(e) => {
                                                    const newScale = [...schoolSettings.gradingScale];
                                                    newScale[idx].label = e.target.value;
                                                    setSchoolSettings({...schoolSettings, gradingScale: newScale});
                                                }}
                                                className="w-16 p-2 bg-gray-50 border border-gray-200 rounded text-center text-sm font-bold"
                                                placeholder="Label"
                                            />
                                            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2">
                                                <span className="text-xs text-gray-500">Min %</span>
                                                <input 
                                                    type="number" 
                                                    value={grade.min}
                                                    onChange={(e) => {
                                                        const newScale = [...schoolSettings.gradingScale];
                                                        newScale[idx].min = Number(e.target.value);
                                                        setSchoolSettings({...schoolSettings, gradingScale: newScale});
                                                    }}
                                                    className="w-full p-2 bg-transparent outline-none text-sm"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                     const newScale = schoolSettings.gradingScale.filter((_, i) => i !== idx);
                                                     setSchoolSettings({...schoolSettings, gradingScale: newScale});
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Logo Settings */}
                            <div>
                                <div className="flex justify-between items-baseline mb-3">
                                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">School Logo</label>
                                     <span className="text-xs text-primary font-medium">{schoolSettings.logoWidth}px</span>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 shrink-0 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {schoolSettings.logo ? (
                                                <>
                                                    <img src={schoolSettings.logo} alt="Preview" className="w-full h-full object-contain p-1" />
                                                    <button 
                                                        onClick={() => setSchoolSettings({...schoolSettings, logo: ''})}
                                                        className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-all">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>Upload & Crop</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectFile(e, 'logo')} />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <input 
                                            type="range" 
                                            min="50" 
                                            max="300" 
                                            value={schoolSettings.logoWidth} 
                                            onChange={(e) => setSchoolSettings({...schoolSettings, logoWidth: Number(e.target.value)})}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Watermark Settings */}
                            <div>
                                 <div className="flex justify-between items-baseline mb-3">
                                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Watermark</label>
                                     <span className="text-xs text-primary font-medium">{schoolSettings.watermarkSize}%</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 shrink-0 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {schoolSettings.watermark ? (
                                                <>
                                                    <img src={schoolSettings.watermark} alt="Preview" className="w-full h-full object-contain p-1 opacity-50" />
                                                    <button 
                                                        onClick={() => setSchoolSettings({...schoolSettings, watermark: ''})}
                                                        className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-all">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>Upload & Crop</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectFile(e, 'watermark')} />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <input 
                                            type="range" 
                                            min="20" 
                                            max="100" 
                                            value={schoolSettings.watermarkSize} 
                                            onChange={(e) => setSchoolSettings({...schoolSettings, watermarkSize: Number(e.target.value)})}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Background Image Settings */}
                            <div>
                                 <div className="flex justify-between items-baseline mb-3">
                                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Background Image</label>
                                     <span className="text-xs text-primary font-medium">{schoolSettings.backgroundImageOpacity}% Opacity</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 shrink-0 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {schoolSettings.backgroundImage ? (
                                                <>
                                                    <img src={schoolSettings.backgroundImage} alt="Preview" className="w-full h-full object-cover p-1 opacity-80" />
                                                    <button 
                                                        onClick={() => setSchoolSettings({...schoolSettings, backgroundImage: ''})}
                                                        className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-all">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>Upload & Crop</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectFile(e, 'background')} />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={schoolSettings.backgroundImageOpacity} 
                                            onChange={(e) => setSchoolSettings({...schoolSettings, backgroundImageOpacity: Number(e.target.value)})}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                       </div>
                       
                       <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button 
                                onClick={saveSettings}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black font-medium text-sm shadow-md transition-all active:scale-[0.98]"
                            >
                                <Save className="w-4 h-4" />
                                Save Configuration
                            </button>
                       </div>
                   </div>
               </div>
           )}
      </div>

      {/* Crop Modal */}
      {cropModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <CropIcon className="w-5 h-5 text-primary" />
                          Crop {editingField === 'logo' ? 'Logo' : editingField === 'watermark' ? 'Watermark' : 'Background'}
                      </h3>
                      <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="flex-1 bg-gray-900 p-4 overflow-auto flex items-center justify-center">
                      <ReactCrop 
                        crop={crop} 
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={undefined} // Free aspect ratio
                        className="max-h-[60vh]"
                      >
                          <img 
                            ref={imgRef}
                            src={tempImgSrc} 
                            alt="Crop Preview" 
                            onLoad={onImageLoad}
                            style={{ maxHeight: '60vh', maxWidth: '100%' }}
                          />
                      </ReactCrop>
                  </div>
                  
                  <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
                      <button 
                        onClick={() => setCropModalOpen(false)}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={saveCroppedImage}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors flex items-center gap-2"
                      >
                          <Check className="w-4 h-4" />
                          Apply Crop
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};