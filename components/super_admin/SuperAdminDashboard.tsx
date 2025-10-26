
import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminOverview, Policy, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, BanknotesIcon, UserGroupIcon, ChartBarIcon, ArrowTrendingUpIcon, DocumentChartBarIcon, MegaphoneIcon } from '../Icons';

interface SuperAdminDashboardProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<{className?: string}>, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
    </div>
);

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ t }) => {
    const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [editablePolicies, setEditablePolicies] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewData, policiesData] = await Promise.all([
                api.fetchSuperAdminOverview(),
                api.fetchPolicies()
            ]);
            setOverview(overviewData);
            setPolicies(policiesData);
            setEditablePolicies(policiesData.reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {}));
        } catch (error) {
            console.error("Failed to fetch SuperAdmin data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePolicyChange = (key: string, value: string) => {
        setEditablePolicies(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyChanges = async () => {
        setIsSaving(true);
        const changes = policies.filter(p => p.value !== editablePolicies[p.key]);
        try {
            await Promise.all(changes.map(p => api.updatePolicy(p.key, editablePolicies[p.key])));
            await fetchData(); // Refresh data after saving
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to save policies:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const groupedPolicies = policies.reduce((acc, policy) => {
        if (!acc[policy.group]) {
            acc[policy.group] = [];
        }
        acc[policy.group].push(policy);
        return acc;
    }, {} as Record<Policy['group'], Policy[]>);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;
    }

    if (!overview) {
        return <p>Error loading data.</p>;
    }

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">{t.superAdmin}</h2>
        
        {/* KPIs & Forecasts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-1 space-y-4">
                <h3 className="font-bold text-slate-700 text-lg">{t['sa.overview']}</h3>
                <KpiCard title={t['sa.totalPatients']} value={overview.kpis.totalPatients} icon={UserGroupIcon} color="bg-blue-100 text-blue-600"/>
                <KpiCard title={t['sa.systemRevenue']} value={`$${overview.kpis.totalRevenue.toFixed(0)}`} icon={BanknotesIcon} color="bg-green-100 text-green-600"/>
                <KpiCard title={t['sa.avgRadLoad']} value={`${overview.kpis.avgRadLoad} studies`} icon={ChartBarIcon} color="bg-yellow-100 text-yellow-600"/>
            </div>
             <div className="md:col-span-2 lg:col-span-1 space-y-4">
                <h3 className="font-bold text-slate-700 text-lg">{t['sa.forecasts']}</h3>
                <KpiCard title={t['sa.nextMonthRevenue']} value={`$${overview.forecast.nextMonthRevenue.toFixed(0)}`} icon={ArrowTrendingUpIcon} color="bg-indigo-100 text-indigo-600"/>
                <KpiCard title={t['sa.patientGrowth']} value={`${overview.forecast.patientGrowth}%`} icon={ArrowTrendingUpIcon} color="bg-purple-100 text-purple-600"/>
            </div>
        </div>

        {/* Policy Editor */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <DocumentChartBarIcon className="w-6 h-6 mr-3 text-slate-500" />
                    {t['sa.policies']}
                </h2>
                <div className="flex items-center space-x-2">
                    {showSuccess && <span className="text-sm text-green-600">{t['sa.changesApplied']}</span>}
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        <MegaphoneIcon className="h-4 w-4 mr-2"/> {t['sa.broadcast']}
                    </button>
                    <button onClick={handleApplyChanges} disabled={isSaving} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isSaving && <LoadingIcon className="h-4 w-4 mr-2"/>}
                        {t['sa.apply']}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {Object.keys(groupedPolicies).map(group => (
                    <div key={group}>
                        <h4 className="font-semibold text-slate-600 mb-2">{group}</h4>
                        <div className="space-y-3">
                            {groupedPolicies[group as Policy['group']].map(policy => (
                                <div key={policy.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-2 rounded-md hover:bg-slate-50">
                                    <div className="md:col-span-1">
                                        <label htmlFor={policy.key} className="font-medium text-sm text-slate-800">{policy.key}</label>
                                        <p className="text-xs text-slate-500">{policy.description}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <input 
                                            type="text"
                                            id={policy.key}
                                            value={editablePolicies[policy.key] || ''}
                                            onChange={(e) => handlePolicyChange(policy.key, e.target.value)}
                                            className="w-full md:w-1/2 p-2 border border-slate-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default SuperAdminDashboard;