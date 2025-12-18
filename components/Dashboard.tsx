import React from 'react';
import { db } from '../services/mockDb';
import { Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const stats = {
        students: db.students.getAll().length,
        classes: db.classes.getAll().length,
        subjects: db.subjects.getAll().length,
        exams: db.exams.getAll().length
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Total Students</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.students}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Subjects</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.subjects}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Exams</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.exams}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Classes</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.classes}</div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-primary to-dark rounded-2xl p-8 text-white shadow-lg">
                <h3 className="text-2xl font-bold mb-2">Welcome to ExamPro</h3>
                <p className="opacity-90 max-w-2xl">
                    Manage your academic records efficiently. This system uses a local database simulation for demonstration purposes. 
                    In a production environment, this would connect to your PHP/MySQL backend.
                </p>
            </div>
        </div>
    );
};