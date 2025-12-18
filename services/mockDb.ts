import { ClassEntity, Student, Subject, Exam, Mark } from '../types';

// Helper to generate random students
const generateMockStudents = (startId: number, count: number, classes: ClassEntity[]): Student[] => {
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Dorothy', 'Brian', 'Carol', 'George', 'Amanda', 'Edward', 'Melissa', 'Ronald', 'Deborah', 'Timothy', 'Stephanie', 'Jason', 'Rebecca', 'Jeffrey', 'Sharon', 'Ryan', 'Laura', 'Jacob', 'Cynthia', 'Gary', 'Kathleen', 'Nicholas', 'Amy', 'Eric', 'Shirley', 'Jonathan', 'Angela', 'Stephen', 'Helen', 'Larry', 'Anna', 'Justin', 'Brenda', 'Scott', 'Pamela', 'Brandon', 'Nicole', 'Benjamin', 'Emma', 'Samuel', 'Samantha', 'Gregory', 'Katherine', 'Frank', 'Christine', 'Alexander', 'Debra', 'Raymond', 'Rachel', 'Patrick', 'Catherine', 'Jack', 'Carolyn', 'Dennis', 'Janet', 'Jerry', 'Ruth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
  
  const students: Student[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const classEntity = classes[Math.floor(Math.random() * classes.length)];
    
    students.push({
      id: startId + i,
      name: `${firstName} ${lastName}`,
      parent: `Mr./Mrs. ${lastName}`,
      dob: `2008-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      mobile: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: Math.random() > 0.05 ? 'Active' : 'Inactive',
      class_id: classEntity.id
    });
  }
  return students;
};

// Initial Seed Data to simulate a populated database
const seedData = () => {
  // Use a version flag to ensure we populate the new 100 students for existing users
  const isSeededV2 = localStorage.getItem('exam_sys_init_v2');

  if (!isSeededV2) {
    const classes: ClassEntity[] = [
      { id: 1, name: 'Grade 10-A', code: '10A' },
      { id: 2, name: 'Grade 10-B', code: '10B' },
      { id: 3, name: 'Grade 11-A', code: '11A' },
      { id: 4, name: 'Grade 11-B', code: '11B' },
    ];
    const subjects: Subject[] = [
      { id: 1, name: 'Mathematics', code: 'MATH101' },
      { id: 2, name: 'Physics', code: 'PHY101' },
      { id: 3, name: 'English Literature', code: 'ENG101' },
      { id: 4, name: 'Chemistry', code: 'CHM101' },
      { id: 5, name: 'Biology', code: 'BIO101' },
    ];
    const exams: Exam[] = [
      { id: 1, name: 'Mid-Term 2024', code: 'MT24' },
      { id: 2, name: 'Finals 2024', code: 'FN24' },
    ];
    
    // Generate 100 mock students
    const students = generateMockStudents(1, 100, classes);

    localStorage.setItem('classes', JSON.stringify(classes));
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('exams', JSON.stringify(exams));
    localStorage.setItem('students', JSON.stringify(students));
    // Clear marks to avoid ID mismatches with new student IDs
    localStorage.setItem('marks', JSON.stringify([]));
    
    localStorage.setItem('exam_sys_init', 'true');
    localStorage.setItem('exam_sys_init_v2', 'true');
  }
};

seedData();

// Generic Helper to get next ID
const getNextId = (key: string): number => {
  const items = JSON.parse(localStorage.getItem(key) || '[]');
  if (items.length === 0) return 1;
  return Math.max(...items.map((i: any) => i.id)) + 1;
};

// --- DATA ACCESS LAYER (Simulating SQL Queries) ---

export const db = {
  classes: {
    getAll: (): ClassEntity[] => JSON.parse(localStorage.getItem('classes') || '[]'),
    add: (item: Omit<ClassEntity, 'id'>) => {
      const items = db.classes.getAll();
      const newItem = { ...item, id: getNextId('classes') };
      localStorage.setItem('classes', JSON.stringify([...items, newItem]));
      return newItem;
    },
    update: (updated: ClassEntity) => {
      const items = db.classes.getAll().map(i => i.id === updated.id ? updated : i);
      localStorage.setItem('classes', JSON.stringify(items));
    },
    delete: (id: number) => {
       const items = db.classes.getAll().filter(i => i.id !== id);
       localStorage.setItem('classes', JSON.stringify(items));
    }
  },
  subjects: {
    getAll: (): Subject[] => JSON.parse(localStorage.getItem('subjects') || '[]'),
    add: (item: Omit<Subject, 'id'>) => {
      const items = db.subjects.getAll();
      const newItem = { ...item, id: getNextId('subjects') };
      localStorage.setItem('subjects', JSON.stringify([...items, newItem]));
      return newItem;
    },
    update: (updated: Subject) => {
      const items = db.subjects.getAll().map(i => i.id === updated.id ? updated : i);
      localStorage.setItem('subjects', JSON.stringify(items));
    },
    delete: (id: number) => {
       const items = db.subjects.getAll().filter(i => i.id !== id);
       localStorage.setItem('subjects', JSON.stringify(items));
    }
  },
  exams: {
    getAll: (): Exam[] => JSON.parse(localStorage.getItem('exams') || '[]'),
    add: (item: Omit<Exam, 'id'>) => {
      const items = db.exams.getAll();
      const newItem = { ...item, id: getNextId('exams') };
      localStorage.setItem('exams', JSON.stringify([...items, newItem]));
      return newItem;
    },
    update: (updated: Exam) => {
      const items = db.exams.getAll().map(i => i.id === updated.id ? updated : i);
      localStorage.setItem('exams', JSON.stringify(items));
    },
    delete: (id: number) => {
       const items = db.exams.getAll().filter(i => i.id !== id);
       localStorage.setItem('exams', JSON.stringify(items));
    }
  },
  students: {
    getAll: (): Student[] => JSON.parse(localStorage.getItem('students') || '[]'),
    getByClass: (classId: number): Student[] => {
      return db.students.getAll().filter(s => s.class_id === classId);
    },
    add: (item: Omit<Student, 'id'>) => {
      const items = db.students.getAll();
      const newItem = { ...item, id: getNextId('students') };
      localStorage.setItem('students', JSON.stringify([...items, newItem]));
      return newItem;
    },
    update: (updated: Student) => {
      const items = db.students.getAll().map(s => s.id === updated.id ? updated : s);
      localStorage.setItem('students', JSON.stringify(items));
    },
    delete: (id: number) => {
       const items = db.students.getAll().filter(i => i.id !== id);
       localStorage.setItem('students', JSON.stringify(items));
       // Cascade delete marks for this student
       const marks = db.marks.getAll().filter(m => m.student_id !== id);
       localStorage.setItem('marks', JSON.stringify(marks));
    }
  },
  marks: {
    getAll: (): Mark[] => JSON.parse(localStorage.getItem('marks') || '[]'),
    upsert: (mark: Omit<Mark, 'id'>) => {
      const allMarks = db.marks.getAll();
      // Check if mark exists for this student+exam+subject
      const index = allMarks.findIndex(m => 
        m.student_id === mark.student_id && 
        m.exam_id === mark.exam_id && 
        m.subject_id === mark.subject_id
      );

      if (index >= 0) {
        // Update existing
        allMarks[index] = { ...allMarks[index], ...mark };
        localStorage.setItem('marks', JSON.stringify(allMarks));
      } else {
        // Insert new
        const newMark = { ...mark, id: getNextId('marks') };
        localStorage.setItem('marks', JSON.stringify([...allMarks, newMark]));
      }
    },
    getByStudent: (studentId: number): Mark[] => {
      return db.marks.getAll().filter(m => m.student_id === studentId);
    }
  },
  settings: {
    get: () => {
        const defaultSettings = {
            name: 'ExamPro School', 
            address: '123 Education Lane, Knowledge City',
            logo: '',
            watermark: '',
            logoWidth: 100, // px
            logoX: 20,
            logoY: 20,
            watermarkSize: 75 // percent
        };
        const saved = JSON.parse(localStorage.getItem('school_settings') || '{}');
        return { ...defaultSettings, ...saved };
    },
    save: (settings: any) => {
        localStorage.setItem('school_settings', JSON.stringify(settings));
    }
  }
};