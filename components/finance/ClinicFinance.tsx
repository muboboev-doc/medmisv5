
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FinanceStatement, DebtInfo, UserRole, StatementLine, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, BanknotesIcon, ArrowDownOnSquareIcon, UserGroupIcon, UserCircleIcon, ShieldCheckIcon } from '../Icons';

interface ClinicFinanceProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.FC<{className?: string}> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
    </div>
);

// FIX: Update 't' prop type in RoleBarChart to TranslationMap
const RoleBarChart: React.FC<{ data: Record<UserRole, number>, t: TranslationMap }> = ({ data, t }) => {
    // FIX: Explicitly cast values to Number to prevent type errors during arithmetic operations.
    const maxValue = Math.max(1, ...Object.values(data).map(Number));
    const sortedData = Object.entries(data).sort(([, a], [, b]) => Number(b) - Number(a));
    
    return (
         <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{t['fin.chargeByRole']}</h3>
             <div className="space-y-3">
                 {sortedData.map(([role, value]) => (
                     <div key={role} className="flex items-center text-sm">
                         <span className="text-slate-600 w-28 truncate pr-2 font-medium">{t.roles[role as UserRole] || role}</span>
                         <div className="flex-1 bg-slate-200 rounded-full h-6">
                             <div 
                                 className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2" 
                                 // FIX: Ensure value is treated as a number for arithmetic operation.
                                 style={{width: `${(Number(value) / maxValue) * 100}%`}}
                             >
                                 {/* FIX: Ensure value is treated as a number before calling toFixed. */}
                                 <span className="text-white font-bold text-xs">{Number(value).toFixed(2)}</span>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         </div>
    );
};

const RoleIcon: React.FC<{ role: UserRole }> = ({ role }) => {
    const icons: Record<UserRole, React.FC<{className?: string}>> = {
        [UserRole.Radiologist]: UserCircleIcon,
        [UserRole.Referrer]: UserGroupIcon,
        [UserRole.SuperAdmin]: ShieldCheckIcon,
        // Add other roles as needed
        [UserRole.Admin]: UserCircleIcon,
        [UserRole.Manager]: UserCircleIcon,
        [UserRole.Patient]: UserCircleIcon,
        [UserRole.Finance]: UserCircleIcon,
        [UserRole.MrtOperator]: UserCircleIcon,
        [UserRole.Reception]: UserCircleIcon,
        [UserRole.MedRep]: UserCircleIcon,
        // FIX: Added missing ClinicAdmin role
        [UserRole.ClinicAdmin]: UserCircleIcon,
    };
    const Icon = icons[role] || UserCircleIcon;
    return <Icon className="w-5 h-5 text-slate-500" />;
}

const ClinicFinance: React.FC<ClinicFinanceProps> = ({ t }) => {
    const [statement, setStatement] = useState<FinanceStatement | null>(null);
    const [debts, setDebts] = useState<DebtInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const clinicId = 'clinic-01'; // Hardcoded for demo
    const period = '2024-07'; // Hardcoded for demo

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [stmtData, debtData] = await Promise.all([
                api.fetchFinanceStatement(clinicId, period),
                api.fetchClinicDebts(clinicId)
            ]);
            setStatement(stmtData);
            setDebts(debtData);
        } catch (error) {
            console.error("Failed to fetch finance data:", error);
        } finally {
            setLoading(false);
        }
    }, [clinicId, period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredLines = useMemo(() => {
        // Add filtering logic here if needed
        return statement?.lines || [];
    }, [statement]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;
    }
    
    if (!statement || !debts) {
        return <p className="text-center py-8 text-slate-500">No financial data available for this period.</p>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t['fin.title']}</h2>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title={t['fin.totalCharged']} value={`$${statement.totals.in.toFixed(2)}`} icon={BanknotesIcon} />
                <KpiCard title={t['fin.totalPaid']} value={`$${statement.totals.out.toFixed(2)}`} icon={BanknotesIcon} />
                <KpiCard title={t['fin.currentDebts']} value={`$${debts.totalDebt.toFixed(2)}`} icon={BanknotesIcon} />
                <RoleBarChart data={debts.debtByRole} t={t} />
            </div>

            {/* Statement Registry */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl font-bold text-slate-800">{t['fin.statementRegistry']}</h2>
                     <div className="flex space-x-2">
                        <button className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                           <ArrowDownOnSquareIcon className="h-4 w-4 mr-2"/> {t['fin.exportCsv']}
                        </button>
                        <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                           {t['fin.makePayout']}
                        </button>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="p-3 text-left">{t['fin.service']}</th>
                                <th className="p-3 text-left">{t['fin.creditedTo']}</th>
                                <th className="p-3 text-right">{t['fin.amount']}</th>
                                <th className="p-3 text-left">{t['fin.date']}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLines.map((line, index) => (
                                <tr key={index} className="border-b hover:bg-slate-50">
                                    <td className="p-3">
                                        <p className="font-medium text-slate-800">{line.ruleName}</p>
                                        <p className="text-xs text-slate-500">{line.meta.patientName || `Referral: ${line.meta.referralId?.slice(-4)}`}</p>
                                    </td>
                                     <td className="p-3">
                                        <div className="flex items-center">
                                            <RoleIcon role={line.actorRole} />
                                            <span className="ml-2 text-slate-700">{line.actorName}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-mono text-green-700">${line.amount.toFixed(2)}</td>
                                    <td className="p-3 text-slate-500">{new Date(line.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default ClinicFinance;