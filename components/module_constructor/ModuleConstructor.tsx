

import React, { useState } from 'react';
import { UserRole, TranslationMap } from '../../types';
import { ALL_ROLES } from '../../constants';
import { CubeTransparentIcon, LoadingIcon, ShieldCheckIcon } from '../Icons';

interface ModuleConstructorProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const ModuleConstructor: React.FC<ModuleConstructorProps> = ({ t }) => {
    const [moduleName, setModuleName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<Record<UserRole, boolean>>(
        () => Object.fromEntries(ALL_ROLES.map(role => [role, false])) as Record<UserRole, boolean>
    );
    const [isCreating, setIsCreating] = useState(false);

    const handleRoleToggle = (role: UserRole) => {
        setSelectedRoles(prev => ({ ...prev, [role]: !prev[role] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        console.log('Creating module:', {
            name: moduleName,
            roles: Object.entries(selectedRoles).filter(([, isSelected]) => isSelected).map(([role]) => role)
        });
        // Simulate API call
        setTimeout(() => {
            setIsCreating(false);
            setModuleName('');
            setSelectedRoles(Object.fromEntries(ALL_ROLES.map(role => [role, false])) as Record<UserRole, boolean>);
            // In a real app, you'd show a success toast here.
        }, 1500);
    };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
        <CubeTransparentIcon className="w-7 h-7 mr-3 text-blue-600"/>
        {t.moduleConstructor}
      </h2>
      <p className="text-slate-600 mb-6">
        This wizard allows for the creation of new application modules and their integration into the Role-Based Access Control system.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto border border-slate-200 rounded-lg p-6">
        <div className="space-y-6">
            <div>
                <label htmlFor="moduleName" className="block text-sm font-medium text-slate-700">Module Name</label>
                <input 
                    type="text" 
                    id="moduleName"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g., Pharmacy Management"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2 text-slate-500"/>
                    Assign Access Roles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ALL_ROLES.map(role => (
                        <div key={role} className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id={`role-${role}`}
                                    name="roles"
                                    type="checkbox"
                                    checked={selectedRoles[role]}
                                    onChange={() => handleRoleToggle(role)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor={`role-${role}`} className="font-medium text-slate-700">
                                    {/* FIX: Use t.roles[role] for translation */}
                                    {t.roles[role] || role}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-8 border-t pt-5">
            <div className="flex justify-end">
                <button 
                    type="submit"
                    disabled={isCreating || !moduleName}
                    className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                    {isCreating && <LoadingIcon className="h-4 w-4 mr-2" />}
                    Create Module
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default ModuleConstructor;