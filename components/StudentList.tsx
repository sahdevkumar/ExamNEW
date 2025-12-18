import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Student, ClassEntity } from '../types';
import { Plus, Search, User, Pencil, Trash2, AlertTriangle } from 'lucide-react';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '', parent: '', dob: '', mobile: '', status: 'Active', class_id: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStudents(db.students.getAll());
    setClasses(db.classes.getAll());
  };

  const handleEdit = (std: Student) => {
      setFormData(std);
      setEditingId(std.id);
      setShowModal(true);
  };

  const handleAdd = () => {
      setFormData({ name: '', parent: '', dob: '', mobile: '', status: 'Active', class_id: 0 });
      setEditingId(null);
      setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          db.students.delete(deleteId);
          loadData();
          setDeleteId(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.class_id) {
      if (editingId) {
          db.students.update({ ...formData, id: editingId } as Student);
      } else {
          db.students.add(formData as Omit<Student, 'id'>);
      }
      setShowModal(false);
      setFormData({ name: '', parent: '', dob: '', mobile: '', status: 'Active', class_id: 0 });
      setEditingId(null);
      loadData();
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Parent</th>
                <th className="px-6 py-3">Mobile</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">#{s.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    {s.name}
                  </td>
                  <td className="px-6 py-4">
                    {classes.find(c => c.id === s.class_id)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">{s.parent}</td>
                  <td className="px-6 py-4">{s.mobile}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(s)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(s.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select required className="w-full p-2 border rounded-lg" value={formData.class_id} onChange={e => setFormData({...formData, class_id: Number(e.target.value)})}>
                      <option value={0}>Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
                    <input required type="date" className="w-full p-2 border rounded-lg" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={formData.parent} onChange={e => setFormData({...formData, parent: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                    {editingId ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student?</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this student? This action cannot be undone.</p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};