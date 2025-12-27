import React, { useEffect, useState, useCallback } from 'react';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'edit'
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('Student');
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const handleView = (user) => {
    setSelectedUser(user);
    setModalMode('view');
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormType(user.type || 'Student');
    setModalMode('edit');
  };

  const handleRemove = async (user) => {
    const confirmRemove = window.confirm(`Remove ${user.name}? This cannot be undone.`);
    if (!confirmRemove) return;
    try {
      setBusy(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: user.type })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed with ${response.status}`);
      }
      setUsers(prev => prev.filter(u => u._id !== user._id));
      setSelectedUser(null);
      setModalMode(null);
    } catch (error) {
      window.alert(`Failed to remove user: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      setBusy(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: selectedUser.type,
          name: formName,
          email: formEmail
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed with ${response.status}`);
      }
      const data = await response.json();
      if (data.user) {
        setUsers(prev => prev.map(u => (u._id === data.user._id ? data.user : u)));
        setSelectedUser(data.user);
        setModalMode('view');
      }
    } catch (error) {
      window.alert(`Failed to update user: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalMode(null);
  };

  const handleCreate = async () => {
    try {
      setBusy(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          type: formType
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed with ${response.status}`);
      }
      const data = await response.json();
      if (data.user) {
        setUsers(prev => [data.user, ...prev]);
        setAddOpen(false);
        setFormName('');
        setFormEmail('');
        setFormType('Student');
      }
    } catch (error) {
      window.alert(`Failed to create user: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const fetchUsersList = useCallback(async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();

      const normalized = (data.users || []).map(u => ({
        _id: u._id,
        name: u.name || u.personalInfo?.fullName || 'User',
        email: u.email || u.personalInfo?.personalEmail || u.academicInfo?.collegeEmail || '—',
        type: u.type || u.userType || (u.role === 'alumni' ? 'Alumni' : u.role === 'student' ? 'Student' : 'User'),
        status: u.status || 'Active',
        joined: u.joined || u.createdAt || null,
        profileCompleted: u.profileCompleted || false
      }));

      setUsers(normalized);
      setUsersError(null);
    } catch (error) {
      setUsersError(error.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all users on the platform</p>
          </div>
        </div>

        {usersError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Error loading users: {usersError}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">All Users ({users.length})</h2>
            <button
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center"
              onClick={() => { setAddOpen(true); setFormName(''); setFormEmail(''); setFormType('Student'); }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
              </svg>
              Add New User
            </button>
          </div>

          <div className="overflow-x-auto">
            {usersLoading ? (
              <div className="p-6 text-center text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No users found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => {
                    const displayName = user?.name || 'User';
                    const displayEmail = user?.email || '—';
                    const initials = displayName
                      .split(' ')
                      .filter(Boolean)
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'U';
                    const joined = user?.joined ? new Date(user.joined).toLocaleDateString() : '—';
                    const userType = user?.type || 'User';
                    const status = user?.status || 'Active';

                    return (
                    <tr key={user._id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            userType === 'Alumni' ? 'bg-blue-600' : 'bg-purple-600'
                          }`}>
                            {initials}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{displayName}</div>
                            <div className="text-sm text-gray-500">{displayEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          userType === 'Alumni' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>{userType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {joined}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 font-medium" onClick={() => handleView(user)}>View</button>
                        <button className="text-green-600 hover:text-green-800 font-medium" onClick={() => handleEdit(user)}>Edit</button>
                        <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => handleRemove(user)}>Remove</button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedUser && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {modalMode === 'view' ? 'User Details' : 'Edit User'}
                </h3>
                <p className="text-sm text-gray-500">{selectedUser.type}</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={closeModal}>✕</button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-2 text-gray-800">
                <div><span className="font-semibold">Name:</span> {selectedUser.name}</div>
                <div><span className="font-semibold">Email:</span> {selectedUser.email}</div>
                <div><span className="font-semibold">Status:</span> {selectedUser.status || 'Active'}</div>
                <div><span className="font-semibold">Joined:</span> {selectedUser.joined ? new Date(selectedUser.joined).toLocaleDateString() : '—'}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={closeModal}
                disabled={busy}
              >
                Cancel
              </button>
              {modalMode === 'edit' && (
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleSaveEdit}
                  disabled={busy}
                >
                  {busy ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
                <p className="text-sm text-gray-500">Create a student or alumni account</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setAddOpen(false)}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Student">Student</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setAddOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleCreate}
                disabled={busy}
              >
                {busy ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
