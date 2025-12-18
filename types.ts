// Matching the provided SQL Schema logic

export interface ClassEntity {
  id: number;
  name: string;
  code: string;
}

export interface Student {
  id: number;
  name: string;
  parent: string;
  dob: string;
  mobile: string;
  status: 'Active' | 'Inactive';
  class_id: number; // Derived from Foreign Key logic
}

export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface Exam {
  id: number;
  name: string;
  code: string;
}

export interface Mark {
  id: number;
  student_id: number;
  subject_id: number;
  exam_id: number;
  subjective_mark: number;
  objective_mark: number;
  max_subjective: number;
  max_objective: number;
}

// Helper types for UI
export interface PopulatedMark extends Mark {
  studentName: string;
  subjectName: string;
  examName: string;
  total: number;
  percentage: number;
}