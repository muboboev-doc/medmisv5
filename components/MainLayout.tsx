

import React from 'react';
import { UserRole, Language, Module, Permissions, TranslationMap } from '../types';
import Sidebar from './Sidebar';
import Header from './shared/Header'; // Using the shared Header

// Import all module components from their new subdirectories
import ReceptionQueue from './reception/ReceptionQueue';
import ReferrerPortal from './referrer/ReferrerPortal';
import MRTRoom from './mrt_room/MRTRoom';
import RadiologyWorkbench from './radiology/RadiologyWorkbench';
import PatientAppGateway from './patient_app/PatientAppGateway';
import ManagerPanel from './manager_panel/ManagerPanel';
import ClinicFinance from './finance/ClinicFinance';
import SuperAdminDashboard from './super_admin/SuperAdminDashboard';
import RoleAccessManager from './rbac/RoleAccessManager';
import RulesEngine from './rules_engine/RulesEngine';
import BonusSlaControl from './bonus_sla/BonusSlaControl';
import LanguageManager from './language_manager/LanguageManager';
import ModuleConstructor from './module_constructor/ModuleConstructor';
import TestSandbox from './test_sandbox/TestSandbox';
import DicomHub from './dicom_hub/DicomHub';
import MedRepInterface from './medrep_interface/MedRepInterface'; // New import
import ClinicManagement from './clinic/ClinicManagement'; // Assuming this is the new component

import { LoadingIcon } from './Icons';

interface MainLayoutProps {
    role: UserRole;
    setRole: (role: UserRole) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    // FIX: Use TranslationMap for 't' prop
    t: TranslationMap;
    activeModule: Module;
    setActiveModule: (module: Module) => void;
    permissions: Permissions | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({
    role, setRole, language, setLanguage, t, activeModule, setActiveModule, permissions
}) => {
    
    const renderModule = () => {
        if (!permissions) {
            return (
                <div className="flex justify-center items-center h-full pt-32">
                    <LoadingIcon className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
            );
        }

        switch (activeModule) {
            case Module.ReceptionQueue:
                return <ReceptionQueue t={t} permissions={permissions} />;
            case Module.ReferrerPortal:
                return <ReferrerPortal t={t} role={role}/>;
            case Module.MrtRoom:
                return <MRTRoom t={t} />;
            case Module.RadiologyWorkbench:
                return <RadiologyWorkbench t={t} />;
            case Module.PatientApp:
                return <PatientAppGateway t={t} />;
            case Module.ManagerPanel:
                return <ManagerPanel t={t} />;
            case Module.ClinicFinance:
                return <ClinicFinance t={t} />;
            case Module.SuperAdmin:
                return <SuperAdminDashboard t={t} />;
            case Module.RoleAccess:
                return <RoleAccessManager t={t} />;
            case Module.RulesEngine:
                return <RulesEngine t={t} />;
            case Module.BonusSla:
                return <BonusSlaControl t={t} />;
            case Module.LanguageManager:
                return <LanguageManager t={t} />;
            case Module.ModuleConstructor:
                return <ModuleConstructor t={t} />;
            case Module.TestSandbox:
                return <TestSandbox t={t} />;
            case Module.DicomHub:
                return <DicomHub t={t} permissions={permissions} />;
            case Module.MedRepInterface: // New module case
                return <MedRepInterface t={t} permissions={permissions} />;
            case Module.Clinic:
                return <ClinicManagement t={t} permissions={permissions} />;
            default:
                // FIX: Cast translation to string
                return <div className="p-8 text-center text-slate-500">{t.unauthorized as string}</div>;
        }
    };

    return (
        <>
            <Header
                role={role}
                setRole={setRole}
                language={language}
                setLanguage={setLanguage}
                t={t}
            />
            <div className="flex">
                <Sidebar
                    role={role}
                    t={t}
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                />
                <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
                    {renderModule()}
                </main>
            </div>
        </>
    );
};

export default MainLayout;