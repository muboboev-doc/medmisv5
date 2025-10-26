
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, Permissions, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { ALL_ROLES } from '../../constants';
import { LoadingIcon, KeyIcon } from '../Icons';

interface RoleAccessManagerProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const RoleAccessManager: React.FC<RoleAccessManagerProps> = ({ t }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<Record<UserRole, Permissions>>({} as any);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // State for role management modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<Record<UserRole, boolean>>({} as any);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersData, permsData] = await Promise.all([
                api.fetchUsers(),
                Promise.all(ALL_ROLES.map(role => api.fetchPermissions(role).then(p => ({ role, permissions: p }))))
            ]);
            setUsers(usersData);
            const permsByRole = permsData.reduce((acc, { role, permissions }) => {
                acc[role] = permissions;
                return acc;
            }, {} as Record<UserRole, Permissions>);
            setPermissions(permsByRole);
        } catch (error) {
            console.error("Failed to fetch RBAC data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleManageRoles = (user: User) => {
        setSelectedUser(user);
        const userRoles = new Set(user.roles);
        setSelectedRoles(
            Object.fromEntries(ALL_ROLES.map(role => [role, userRoles.has(role)])) as Record<UserRole, boolean>
        );
        setIsModalOpen(true);
    };

    const handleRoleChange = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        const newRoles = Object.entries(selectedRoles).filter(([, isSelected]) => isSelected).map(([role]) => role as UserRole);
        try {
            await api.updateUserRoles(selectedUser._id, newRoles);
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to update roles", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePermissionToggle = (role: UserRole, permission: keyof Permissions) => {
        setPermissions(prev => {
            const currentPerms = prev[role] || { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false };
            return {
                ...prev,
                [role]: {
                    ...currentPerms,
                    [permission]: !currentPerms[permission]
                }
            };
        });
    };
    
    const handleSavePermissions = async () => {
        setIsSaving(true);
        try {
            await Promise.all(
                // FIX: Cast `perms` to `Permissions` to resolve the type error.
                // The `permissions` state is initialized with `{} as any`, which can cause `Object.entries`
                // to produce values of type `unknown` under certain TypeScript configurations.
                Object.entries(permissions).map(([role, perms]) => api.updatePermissions(role as UserRole, perms as Permissions))
            );
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch(e) {
            console.error("Failed to save permissions", e);
        } finally {
            setIsSaving(false);
        }
    };

    // Define all permission keys that should be displayed
    const allPermissionKeys: (keyof Permissions)[] = useMemo(() => {
        // Collect all unique permission keys from the component's 'permissions' state
        // FIX: Used component state 'permissions' instead of global 'permissionsDB'
        const keys = new Set<keyof Permissions>();
        Object.values(permissions).forEach(permSet => {
            Object.keys(permSet).forEach(key => keys.add(key as keyof Permissions));
        });
        return Array.from(keys).sort();
    }, [permissions]); // FIX: Used component state 'permissions' as dependency


    if (loading) return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t.roleAccess}</h2>
            
            {/* User Management */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t['rbac.userManagement']}</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="p-3 text-left">{t['rbac.user']}</th>
                                <th className="p-3 text-left">{t['rbac.email']}</th>
                                <th className="p-3 text-left">{t['rbac.roles']}</th>
                                <th className="p-3 text-left">{t.status}</th>
                                <th className="p-3 text-left">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3 text-slate-600">{user.email}</td>
                                    <td className="p-3 text-slate-600">{user.roles.map(r => t.roles[r] || r).join(', ')}</td>
                                    <td className="p-3"><span className={`px-2 py-0.5 text-xs rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span></td>
                                    <td className="p-3"><button onClick={() => handleManageRoles(user)} className="font-medium text-blue-600 hover:text-blue-800">{t['rbac.manageRoles']}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {/* Permission Management */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{t['rbac.permissionManagement']}</h3>
                    <div>
                        {showSuccess && <span className="text-sm text-green-600 mr-4">{t['rbac.changesSaved']}</span>}
                        <button onClick={handleSavePermissions} disabled={isSaving} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                             {isSaving && <LoadingIcon className="h-4 w-4 mr-2"/>}
                             {t['langMgr.save']}
                        </button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="p-3 text-left flex items-center"><KeyIcon className="w-4 h-4 mr-2"/>{t['rbac.feature']}</th>
                                {ALL_ROLES.map(role => <th key={role} className="p-3 text-center">{t.roles[role] || role}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {allPermissionKeys.map(permKey => (
                                <tr key={permKey} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-medium">{t[`rbac.${permKey}`] || permKey}</td>
                                    {ALL_ROLES.map(role => (
                                        <td key={role} className="p-3 text-center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[role]?.[permKey as keyof Permissions] || false}
                                                    onChange={() => handlePermissionToggle(role, permKey as keyof Permissions)}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Management Modal */}
            {isModalOpen && selectedUser && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-5 border-b">
                            <h3 className="text-lg font-bold text-slate-800">{t['rbac.manageRoles']} for {selectedUser.name}</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {ALL_ROLES.map(role => (
                                <div key={role} className="flex items-center">
                                    <input id={`role-check-${role}`} type="checkbox" checked={selectedRoles[role]} onChange={() => setSelectedRoles(p => ({...p, [role]: !p[role]}))} className="h-4 w-4 text-blue-600 rounded"/>
                                    <label htmlFor={`role-check-${role}`} className="ml-2 text-sm text-slate-700">{t.roles[role] || role}</label>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 px-5 py-3 flex justify-end space-x-2">
                             <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium bg-white border rounded-md hover:bg-slate-50">{t.close}</button>
                             <button onClick={handleRoleChange} disabled={isSaving} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                {isSaving && <LoadingIcon className="h-4 w-4 mr-2"/>}
                                {t['langMgr.save']}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleAccessManager;