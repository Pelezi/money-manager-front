'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { groupService } from '@/services/groupService';
import { Group, GroupMember, GroupRole, User } from '@/types';
import { useTranslations } from 'next-intl';
import { 
  Users, 
  UserPlus, 
  Settings as SettingsIcon, 
  Trash2, 
  Shield,
  Search,
  X,
  Loader2,
  ChevronDown,
  LogOut,
  Plus
} from 'lucide-react';

export default function GroupSettingsPage() {
  const t = useTranslations('groups');
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params?.id as string);
  const { groups, currentGroupPermissions, setGroups } = useAppStore();
  
  const currentGroup = groups.find(g => g.id === groupId);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'roles'>('members');
  
  // Members state
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Roles state
  const [roles, setRoles] = useState<GroupRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Invite member state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [inviting, setInviting] = useState(false);
  
  // Group update state
  const [groupName, setGroupName] = useState(currentGroup?.name || '');
  const [groupDescription, setGroupDescription] = useState(currentGroup?.description || '');
  const [updatingGroup, setUpdatingGroup] = useState(false);

  // Role creation/editing state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<GroupRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState({
    canViewTransactions: false,
    canManageTransactions: false,
    canViewCategories: false,
    canManageCategories: false,
    canViewSubcategories: false,
    canManageSubcategories: false,
    canViewBudgets: false,
    canManageBudgets: false,
    canManageGroup: false,
  });
  const [savingRole, setSavingRole] = useState(false);

  // Load members and roles
  useEffect(() => {
    const loadData = async () => {
      if (!groupId) return;
      
      setLoadingMembers(true);
      setLoadingRoles(true);
      
      try {
        const [membersData, rolesData] = await Promise.all([
          groupService.getMembers(groupId),
          groupService.getRoles(groupId),
        ]);
        
        setMembers(membersData);
        setRoles(rolesData);
        
        // Set default role to Member
        const memberRole = rolesData.find(r => r.name === 'Member');
        if (memberRole) {
          setSelectedRoleId(memberRole.id);
        }
      } catch (error) {
        console.error('Failed to load group data:', error);
      } finally {
        setLoadingMembers(false);
        setLoadingRoles(false);
      }
    };
    
    loadData();
  }, [groupId]);

  // Search users for invite
  useEffect(() => {
    const searchUsers = async () => {
      if (emailSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await groupService.searchUsers(emailSearch);
        // Filter out users already in the group
        const filtered = results.filter(
          user => !members.some(member => member.userId === user.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [emailSearch, members]);

  const handleInviteMember = async () => {
    if (!selectedUser || !selectedRoleId) return;
    
    setInviting(true);
    try {
      await groupService.addMember(groupId, {
        userId: selectedUser.id,
        roleId: selectedRoleId,
      });
      
      // Refresh members list
      const updatedMembers = await groupService.getMembers(groupId);
      setMembers(updatedMembers);
      
      // Reset form
      setShowInviteModal(false);
      setEmailSearch('');
      setSelectedUser(null);
      setSearchResults([]);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm(t('removeMemberConfirm'))) return;
    
    try {
      await groupService.removeMember(groupId, memberId);
      const updatedMembers = await groupService.getMembers(groupId);
      setMembers(updatedMembers);
    } catch (error: any) {
      alert(error.response?.data?.message || t('memberRemoveError'));
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRoleId: number) => {
    try {
      await groupService.updateMemberRole(groupId, memberId, newRoleId);
      const updatedMembers = await groupService.getMembers(groupId);
      setMembers(updatedMembers);
    } catch (error: any) {
      alert(error.response?.data?.message || t('memberRoleUpdateError'));
    }
  };

  const handleUpdateGroup = async () => {
    setUpdatingGroup(true);
    try {
      await groupService.updateGroup(groupId, {
        name: groupName,
        description: groupDescription || undefined,
      });
      
      // Refresh groups list
      const updatedGroups = await groupService.getGroups();
      setGroups(updatedGroups);
      
      alert(t('groupUpdated'));
    } catch (error: any) {
      alert(error.response?.data?.message || t('groupUpdateError'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(t('deleteGroupConfirm'))) return;
    
    try {
      await groupService.deleteGroup(groupId);
      const updatedGroups = await groupService.getGroups();
      setGroups(updatedGroups);
      router.push('/transactions');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(t('leaveGroupConfirm'))) return;
    
    try {
      await groupService.leaveGroup(groupId);
      const updatedGroups = await groupService.getGroups();
      setGroups(updatedGroups);
      router.push('/transactions');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleOpenRoleModal = (role?: GroupRole) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setRolePermissions({
        canViewTransactions: role.canViewTransactions,
        canManageTransactions: role.canManageTransactions,
        canViewCategories: role.canViewCategories,
        canManageCategories: role.canManageCategories,
        canViewSubcategories: role.canViewSubcategories,
        canManageSubcategories: role.canManageSubcategories,
        canViewBudgets: role.canViewBudgets,
        canManageBudgets: role.canManageBudgets,
        canManageGroup: role.canManageGroup,
      });
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      setRolePermissions({
        canViewTransactions: false,
        canManageTransactions: false,
        canViewCategories: false,
        canManageCategories: false,
        canViewSubcategories: false,
        canManageSubcategories: false,
        canViewBudgets: false,
        canManageBudgets: false,
        canManageGroup: false,
      });
    }
    setShowRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    
    setSavingRole(true);
    try {
      if (editingRole) {
        // Update existing role
        await groupService.updateRole(groupId, editingRole.id, {
          name: roleName,
          description: roleDescription || undefined,
          ...rolePermissions,
        });
      } else {
        // Create new role
        await groupService.createRole(groupId, {
          name: roleName,
          description: roleDescription || undefined,
          ...rolePermissions,
        });
      }
      
      // Refresh roles list
      const updatedRoles = await groupService.getRoles(groupId);
      setRoles(updatedRoles);
      
      handleCloseRoleModal();
    } catch (error: any) {
      alert(error.response?.data?.message || (editingRole ? t('roleUpdateError') : t('roleCreateError')));
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm(t('deleteRoleConfirm'))) return;
    
    try {
      await groupService.deleteRole(groupId, roleId);
      const updatedRoles = await groupService.getRoles(groupId);
      setRoles(updatedRoles);
    } catch (error: any) {
      alert(error.response?.data?.message || t('roleDeleteError'));
    }
  };

  if (!currentGroup) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">{t('groupNotFound')}</p>
      </div>
    );
  }

  const canManageGroup = currentGroupPermissions?.canManageGroup || false;
  const isOwner = currentGroup.ownerId === (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user') || '{}').id);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('groupSettings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage {currentGroup.name} settings, members, and roles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'general'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon size={18} />
            {t('general')}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            {t('members')} ({members.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'roles'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={18} />
            {t('roles')} ({roles.length})
          </div>
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('groupInformation')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('groupName')}
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!canManageGroup}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('groupDescription')}
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  disabled={!canManageGroup}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 resize-none"
                />
              </div>
              
              {canManageGroup && (
                <button
                  onClick={handleUpdateGroup}
                  disabled={updatingGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingGroup ? t('saving') : t('saveChanges')}
                </button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              {t('dangerZone')}
            </h2>
            
            {isOwner ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('deleteGroupDescription')}
                </p>
                <button
                  onClick={handleDeleteGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  {t('deleteGroup')}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('leaveGroupDescription')}
                </p>
                <button
                  onClick={handleLeaveGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <LogOut size={18} />
                  {t('leaveGroup')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('groupMembers')}
            </h2>
            {canManageGroup && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={18} />
                {t('inviteMember')}
              </button>
            )}
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.user?.firstName} {member.user?.lastName}
                      {member.userId === currentGroup.ownerId && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
                          {t('owner')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {member.user?.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {canManageGroup && member.userId !== currentGroup.ownerId ? (
                      <>
                        <select
                          value={member.roleId}
                          onChange={(e) => handleUpdateMemberRole(member.id, parseInt(e.target.value))}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('removeMember')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                        {member.role?.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('rolesAndPermissions')}
            </h2>
            {canManageGroup && (
              <button
                onClick={() => handleOpenRoleModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                {t('createRole')}
              </button>
            )}
          </div>

          {loadingRoles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => {
                const isDefaultRole = ['Owner', 'Member', 'Viewer'].includes(role.name);
                return (
                  <div key={role.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        {role.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {role.description}
                          </div>
                        )}
                      </div>
                      {canManageGroup && !isDefaultRole && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenRoleModal(role)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <SettingsIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canViewTransactions} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('viewTransactions')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canManageTransactions} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('manageTransactions')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canViewCategories} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('viewCategories')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canManageCategories} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('manageCategories')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canViewSubcategories} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('viewSubcategories')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canManageSubcategories} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('manageSubcategories')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canViewBudgets} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('viewBudgets')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canManageBudgets} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('manageBudgets')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={role.canManageGroup} disabled className="rounded" />
                        <span className="text-gray-700 dark:text-gray-300">{t('manageGroup')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('inviteMember')}
                </h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setEmailSearch('');
                    setSelectedUser(null);
                    setSearchResults([]);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Email Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchByEmail')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      placeholder={t('enterEmail')}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <Search className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setEmailSearch('');
                            setSearchResults([]);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {emailSearch.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('noUsersFound')}
                    </p>
                  )}
                </div>

                {/* Selected User */}
                {selectedUser && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('selected')}: {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUser.email}
                    </div>
                  </div>
                )}

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('assignRole')}
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>{t('selectRole')}</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setEmailSearch('');
                      setSelectedUser(null);
                      setSearchResults([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('cancel', { ns: 'common' })}
                  </button>
                  <button
                    onClick={handleInviteMember}
                    disabled={!selectedUser || !selectedRoleId || inviting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviting ? t('inviting') : t('inviteMember')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Creation/Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingRole ? t('editRole') : t('createRole')}
                </h3>
                <button
                  onClick={handleCloseRoleModal}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('roleName')}
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Accountant, Manager"
                  />
                </div>

                {/* Role Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('roleDescription')}
                  </label>
                  <textarea
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Optional description..."
                  />
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('permissions')}
                  </label>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canViewTransactions"
                        checked={rolePermissions.canViewTransactions}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canViewTransactions: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canViewTransactions" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('viewTransactions')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canManageTransactions"
                        checked={rolePermissions.canManageTransactions}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canManageTransactions: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canManageTransactions" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('manageTransactions')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canViewCategories"
                        checked={rolePermissions.canViewCategories}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canViewCategories: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canViewCategories" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('viewCategories')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canManageCategories"
                        checked={rolePermissions.canManageCategories}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canManageCategories: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canManageCategories" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('manageCategories')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canViewSubcategories"
                        checked={rolePermissions.canViewSubcategories}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canViewSubcategories: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canViewSubcategories" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('viewSubcategories')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canManageSubcategories"
                        checked={rolePermissions.canManageSubcategories}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canManageSubcategories: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canManageSubcategories" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('manageSubcategories')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canViewBudgets"
                        checked={rolePermissions.canViewBudgets}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canViewBudgets: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canViewBudgets" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('viewBudgets')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canManageBudgets"
                        checked={rolePermissions.canManageBudgets}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canManageBudgets: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canManageBudgets" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('manageBudgets')}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="canManageGroup"
                        checked={rolePermissions.canManageGroup}
                        onChange={(e) => setRolePermissions({ ...rolePermissions, canManageGroup: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="canManageGroup" className="text-sm text-gray-900 dark:text-white cursor-pointer">
                        {t('manageGroup')}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCloseRoleModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('cancel', { ns: 'common' })}
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={!roleName.trim() || savingRole}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingRole ? t('saving') : t('save', { ns: 'common' })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
