import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { studentsService } from '@/services/students.service';
import { toast } from 'sonner';

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nemisNo?: string;
  pathway?: 'STEM' | 'Social Sciences' | 'Arts and Sports Science';
  class: string;
  stream?: string;
  admissionDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  getStudentsByClass: (className: string) => Student[];
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    studentsService.getStudents().then(setStudents).catch(console.error);
  }, []);

  const addStudent = (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const optimistic: Student = { ...student, id: tempId, createdAt: now, updatedAt: now };
    setStudents((prev) => [...prev, optimistic]);

    studentsService.createStudent(student)
      .then((created) => setStudents((prev) => prev.map((s) => (s.id === tempId ? created : s))))
      .catch((err: Error) => {
        setStudents((prev) => prev.filter((s) => s.id !== tempId));
        toast.error(err.message || 'Failed to add student');
      });
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    let snapshot: Student | undefined;
    setStudents((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.map((s) => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
    });

    studentsService.updateStudent(id, updates)
      .then((updated) => setStudents((prev) => prev.map((s) => (s.id === id ? updated : s))))
      .catch((err: Error) => {
        if (snapshot) setStudents((prev) => prev.map((s) => (s.id === id ? snapshot! : s)));
        toast.error(err.message || 'Failed to update student');
      });
  };

  const deleteStudent = (id: string) => {
    let snapshot: Student | undefined;
    setStudents((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.filter((s) => s.id !== id);
    });

    studentsService.deleteStudent(id)
      .catch((err: Error) => {
        if (snapshot) setStudents((prev) => [...prev, snapshot!]);
        toast.error(err.message || 'Failed to delete student');
      });
  };

  const getStudentById = (id: string) => students.find((s) => s.id === id);
  const getStudentsByClass = (className: string) => students.filter((s) => s.class === className);

  return (
    <StudentContext.Provider value={{
      students, addStudent, updateStudent, deleteStudent,
      getStudentById, getStudentsByClass,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentContext);
  if (!context) throw new Error('useStudents must be used within a StudentProvider');
  return context;
}
