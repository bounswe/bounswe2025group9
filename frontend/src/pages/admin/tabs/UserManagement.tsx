import { useState, useEffect } from 'react';
import { Users, MagnifyingGlass, ShieldCheck, Warning, Prohibit } from '@phosphor-icons/react';
import { apiClient } from '../../../lib/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  dateJoined: string;
  tags: Array<{
    id: number;
    name: string;
    verified: boolean;
  }>;
  warningCount?: number;
  suspensionCount?: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'staff' | 'users'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: { role?: 'staff' | 'users'; search?: string } = {};

      if (filterRole === 'staff') {
        params.role = 'staff';
      } else if (filterRole === 'users') {
        params.role = 'users';
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const data = await apiClient.moderation.getUsers(params);
      setUsers(data.results || data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, active: boolean) => {
    try {
      const reason = prompt(`Please provide a reason for ${active ? 'activating' : 'suspending'} this user:`);

      if (reason === null) return; // User cancelled

      const result = await apiClient.moderation.toggleUserActive(userId, active, reason);
      console.log(result.message);

      // Refresh the list
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleWarnUser = async (userId: number) => {
    const reason = prompt('Enter warning reason:');
    if (!reason) return;

    try {
      // TODO: Replace with actual API call
      // await apiClient.moderation.warnUser(userId, reason);
      console.log(`Warning user ${userId}: ${reason}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to warn user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.name} ${user.surname}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      filterRole === 'all' ||
      (filterRole === 'staff' && user.isStaff) ||
      (filterRole === 'users' && !user.isStaff);

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'staff', 'users'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
              style={{
                backgroundColor: filterRole === role
                  ? 'var(--forum-default-active-bg)'
                  : 'var(--forum-default-bg)',
                color: filterRole === role
                  ? 'var(--forum-default-active-text)'
                  : 'var(--forum-default-text)'
              }}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.name} {user.surname}
                        </div>
                        {user.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  tag.verified
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                              >
                                {tag.verified && <ShieldCheck size={12} />}
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isSuperuser
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : user.isStaff
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {user.isSuperuser ? 'Admin' : user.isStaff ? 'Staff' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                    {(user.warningCount || 0) > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {user.warningCount} warning{user.warningCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.dateJoined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleWarnUser(user.id)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        title="Warn user"
                      >
                        <Warning size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, !user.isActive)}
                        className={`${
                          user.isActive
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                        title={user.isActive ? 'Suspend user' : 'Activate user'}
                      >
                        <Prohibit size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
