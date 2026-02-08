import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: user?.role === 'student' ? 'student' : 'student',
    startDate: '',
    endDate: '',
  });
  const [form, setForm] = useState({
    userId: '',
    date: '',
    status: 'present',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canMark = useMemo(() => ['teacher', 'hod', 'admin'].includes(user?.role), [user?.role]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.attendance.list({
        role: filters.role,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setRecords(response.attendance || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    if (user.role !== 'student') return;
    try {
      const response = await api.attendance.stats({});
      setStats(response.stats || null);
    } catch (err) {
      setStats(null);
    }
  };

  const loadUsers = async (role) => {
    if (!canMark || !role) return;
    try {
      const response = await api.users.byRole(role);
      setUsers(response.users || []);
    } catch (err) {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [filters.role, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (canMark) {
      loadUsers(filters.role);
    }
  }, [canMark, filters.role]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.date) {
      setError('Please select a user and date.');
      return;
    }
    try {
      setLoading(true);
      await api.attendance.mark({
        userId: form.userId,
        date: form.date,
        status: form.status,
      });
      setForm({ userId: '', date: '', status: 'present' });
      await loadRecords();
    } catch (err) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Attendance</h1>
        <p className="text-gray-600">Track and manage attendance records.</p>
      </div>

      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">My Attendance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Percentage</p>
              <p className="text-2xl font-bold text-[#6e0718]">{stats.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {canMark && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Mark Attendance</h2>
          <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hod">HOD</option>
            </select>
            <select
              name="userId"
              value={form.userId}
              onChange={handleFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <select
              name="status"
              value={form.status}
              onChange={handleFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="md:col-span-4 px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
            >
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          />
          <button
            onClick={() => setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }))}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Clear Dates
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading attendance...' : 'No attendance records found.'}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {record.userId?.fullName || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.markedBy?.fullName || 'Unknown'}
                    </td>
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

export default Attendance;

