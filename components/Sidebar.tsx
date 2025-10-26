



import React from 'react';
// FIX: Import TranslationMap for correct typing of 't' prop.
import { UserRole, Module, TranslationMap } from '../types';
import { ROLE_MODULES } from '../constants';
import * as Icons from './Icons';

interface SidebarProps {
  role: UserRole;
  // FIX: Change 't' prop type to TranslationMap for correct type checking.
  t: TranslationMap;
  activeModule: Module;
  setActiveModule: (module: Module) => void;
}

const ModuleIcons: Record<Module, React.FC<{ className?: string }>> = {
    [Module.ReceptionQueue]: Icons.IdentificationIcon,
    [Module.MrtRoom]: Icons.FilmIcon, // Placeholder, needs specific icon
    [Module.RadiologyWorkbench]: Icons.DocumentTextIcon,
    [Module.ReferrerPortal]: Icons.UserGroupIcon,
    [Module.PatientApp]: Icons.IdentificationIcon,
    [Module.ManagerPanel]: Icons.ChartBarIcon,
    [Module.ClinicFinance]: Icons.CurrencyDollarIcon,
    [Module.SuperAdmin]: Icons.ShieldCheckIcon,
    [Module.RoleAccess]: Icons.UserGroupIcon,
    [Module.RulesEngine]: Icons.CogIcon,
    [Module.BonusSla]: Icons.CalculatorIcon,
    [Module.LanguageManager]: Icons.TranslateIcon,
    [Module.ModuleConstructor]: Icons.CubeTransparentIcon,
    [Module.TestSandbox]: Icons.BeakerIcon,
    [Module.DicomHub]: Icons.FilmIcon,
    // FIX: Corrected Icons.UsersIcon to Icons.UserGroupIcon and added Module.Clinic icon
    [Module.MedRepInterface]: Icons.UserGroupIcon,
    [Module.Clinic]: Icons.ViewGridIcon, // Added icon for Clinic module
};


const Sidebar: React.FC<SidebarProps> = ({ role, t, activeModule, setActiveModule }) => {
  const availableModules = ROLE_MODULES[role] || [];

  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-0">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t.appName as string}</h2>
        <p className="text-sm text-slate-400 mt-1">{t.roles[role] || role}</p>
      </div>
      <nav>
        <ul>
          {availableModules.map(moduleKey => {
            const Icon = ModuleIcons[moduleKey] || Icons.ViewGridIcon;
            const isActive = activeModule === moduleKey;
            return (
              <li key={moduleKey} className="px-2">
                <button
                  onClick={() => setActiveModule(moduleKey)}
                  className={`w-full flex items-center px-4 py-2 my-1 text-sm font-medium rounded-md transition-colors duration-150
                    ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {/* FIX: Cast translation value to string to satisfy span's child type. */}
                  <span>{(t.modules?.[moduleKey] || t[moduleKey]) as string || moduleKey}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;