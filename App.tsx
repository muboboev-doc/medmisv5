import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Language, Module, Permissions, TranslationMap } from './types';
import { translations, ROLE_MODULES } from './constants';
import MainLayout from './components/MainLayout';
import * as api from './services/api';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.Reception);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  
  // Determine the initial module based on the default role
  const [activeModule, setActiveModule] = useState<Module>(ROLE_MODULES[role][0]);

  // FIX: Type 't' as TranslationMap to correctly handle nested translation objects like 'roles'.
  const t: TranslationMap = useMemo(() => translations[language], [language]);

  // Effect to reset the active module and fetch permissions when the role changes
  useEffect(() => {
    // Set the active module to the first one available for the new role
    const availableModules = ROLE_MODULES[role];
    if (availableModules && availableModules.length > 0) {
      setActiveModule(availableModules[0]);
    }

    // Fetch permissions for the new role
    const loadPermissions = async () => {
        setPermissions(null); // Set to loading state
        const perms = await api.fetchPermissions(role);
        setPermissions(perms);
    };
    loadPermissions();

  }, [role]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <MainLayout
        role={role}
        setRole={setRole}
        language={language}
        setLanguage={setLanguage}
        t={t}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        permissions={permissions}
      />
    </div>
  );
};

export default App;