import React from 'react';
import { UserRole, Language } from '../types';
import { ALL_ROLES, ALL_LANGUAGES } from '../constants';
import { ChevronDownIcon, LogoutIcon } from './Icons';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>;
}

const Header: React.FC<HeaderProps> = ({ role, setRole, language, setLanguage, t }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-blue-600">
          {t.appName}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <label htmlFor="role-select" className="sr-only">{t.role}</label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="appearance-none bg-slate-100 border border-slate-300 rounded-md pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{t.roles[r] || r}</option>
              ))}
            </select>
            <ChevronDownIcon className="w-5 h-5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <label htmlFor="lang-select" className="sr-only">{t.language}</label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none bg-slate-100 border border-slate-300 rounded-md pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {ALL_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
             <ChevronDownIcon className="w-5 h-5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700">
            <LogoutIcon className="h-5 w-5" />
            <span className="sr-only">{t.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;