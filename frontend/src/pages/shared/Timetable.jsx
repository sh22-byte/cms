import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Timetable = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [roleFilter, setRoleFilter] = useState(user?.role || 'student');
  const [form, setForm] = useState({ day: 'Monday', timeSlot: '', subject: '', role: user?.role || 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canManage = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);

  const loadTimetable = async (role) => {
    try {
      setLoading(true);
      const response = await api.timetable.list({ role });
      setEntries(response.timetable || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleFilter) {
      loadTimetable(roleFilter);
    }
  }, [roleFilter]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.timeSlot || !form.subject) {
      setError('Time slot and subject are required.');
      return;
    }
    try {
      setLoading(true);
      await api.timetable.upsert({
        day: form.day,
        timeSlot: form.timeSlot,
        subject: form.subject,
        role: form.role,
      });
      setForm((prev) => ({ ...prev, subject: '', timeSlot: '' }));
      await loadTimetable(form.role);
    } catch (err) {
      setError(err.message || 'Failed to save timetable entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      setLoading(true);
      await api.timetable.remove(id);
      await loadTimetable(roleFilter);
    } catch (err) {
      setError(err.message || 'Failed to delete timetable entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Time Table</h1>
          <p className="text-gray-600">View and manage class schedules.</p>
        </div>
      </div>

      {canManage && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Create / Update Entry</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="role"
              value={form.role}
              onChange={(e) => {
                handleChange(e);
                setRoleFilter(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hod">HOD</option>
            </select>
            <select
              name="day"
              value={form.day}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              {days.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input
              name="timeSlot"
              value={form.timeSlot}
              onChange={handleChange}
              placeholder="Time Slot (e.g., 09:00 AM - 10:00 AM)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Subject"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <button
              type="submit"
              disabled={loading}
              className="md:col-span-4 px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {!canManage && (
            <div className="text-sm text-gray-600">
              Role: <span className="font-semibold text-[#6e0718]">{roleFilter}</span>
            </div>
          )}
          {canManage && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hod">HOD</option>
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time Slot</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                {canManage && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading timetable...' : 'No timetable entries found.'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{entry.day}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.timeSlot}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.subject}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Timetable;

