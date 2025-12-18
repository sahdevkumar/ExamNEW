import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Subject } from '../types';
import { Plus, BookOpen, Pencil, Trash2, AlertTriangle } from 'lucide-react';

export const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    setSubjects(db.subjects.getAll());
  }, []);

  const handleEdit = (sub: Subject) => {
      setFormData({ name: sub.name, code: sub.code });
      setEditingId(sub.id);
      setShowModal(true);
  };

  const handleAdd = () => {
      setFormData({ name: '', code: '' });
      setEditingId(null);
      setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          db.subjects.delete(deleteId);
          setSubjects(db.subjects.getAll());
          setDeleteId(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.code) {
      if (editingId) {
          db.subjects.update({ ...formData, id: editingId });
      } else {
          db.subjects.add(formData);
      }
      setSubjects(db.subjects.getAll());
      setShowModal(false);
      setFormData({ name: '', code: '' });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Subject Management</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-20">ID</th>
                <th className="px-6 py-3">Subject Name</th>
                <th className="px-6 py-3">Subject Code</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">#{s.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    {s.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{s.code}</td>
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
              {subjects.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No subjects found.</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input 
                    required 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input 
                    required 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                    placeholder="e.g. MATH101"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                    {editingId ? 'Update Subject' : 'Save Subject'}
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Subject?</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this subject? This action cannot be undone.</p>
                
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