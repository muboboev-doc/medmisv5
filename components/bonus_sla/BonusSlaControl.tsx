


import React, { useState, useEffect, useCallback } from 'react';
import { SlaSetting, BonusSetting, Priority, SlaDryRunResult, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, CalculatorIcon } from '../Icons';

interface BonusSlaControlProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const BonusSlaControl: React.FC<BonusSlaControlProps> = ({ t }) => {
    const [slaSettings, setSlaSettings] = useState<SlaSetting[]>([]);
    const [bonusSettings, setBonusSettings] = useState<BonusSetting[]>([]);
    const [editableSla, setEditableSla] = useState<Record<string, string>>({});
    const [editableBonuses, setEditableBonuses] = useState<Record<string, { points: string, splits: string }>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [dryRunResult, setDryRunResult] = useState<SlaDryRunResult | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [slaData, bonusData] = await Promise.all([
                api.fetchSlaSettings(),
                api.fetchBonusSettings(),
            ]);
            setSlaSettings(slaData);
            setEditableSla(slaData.reduce((acc, s) => ({ ...acc, [s._id]: s.targetMin.toString() }), {}));
            setBonusSettings(bonusData);
            setEditableBonuses(bonusData.reduce((acc, b) => ({ ...acc, [b._id]: { points: b.points.toString(), splits: JSON.stringify(b.splits) } }), {}));
        } catch (error) {
            console.error("Failed to fetch SLA/Bonus settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const slaPromises = slaSettings.map(s => {
                const newValue = parseInt(editableSla[s._id]);
                if (s.targetMin !== newValue && !isNaN(newValue)) {
                    return api.updateSlaSetting(s._id, newValue);
                }
                return Promise.resolve();
            });
            // Note: In a real app, you would add logic for bonus splits update
            const bonusPromises = bonusSettings.map(b => {
                const newPoints = parseInt(editableBonuses[b._id].points);
                 if (b.points !== newPoints && !isNaN(newPoints)) {
                    return api.updateBonusSetting(b._id, newPoints, b.splits);
                }
                return Promise.resolve();
            });
            
            await Promise.all([...slaPromises, ...bonusPromises]);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchData();
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setDryRunResult(null);
        try {
            // This is a simplified mapping for the simulation
            const newSla = slaSettings.map(s => ({...s, targetMin: parseInt(editableSla[s._id])}));
            const newBonuses = bonusSettings.map(b => ({...b, points: parseInt(editableBonuses[b._id].points)}));
            const result = await api.runSlaDryRun(newSla, newBonuses);
            setDryRunResult(result);
        } catch(error) {
            console.error("Dry run failed", error);
        } finally {
            setIsSimulating(false);
        }
    }

    if (loading) return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;

    const renderDryRunResult = () => {
        if (!dryRunResult) return null;
        const change = dryRunResult.totalBonusChange;
        const changeColor = change > 0 ? 'text-green-600' : 'text-red-600';
        return (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                 <h4 className="font-bold text-slate-800 mb-3">{t['bonus.simulationResults']}</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-2 bg-white rounded shadow-sm">
                        <p className="font-semibold text-slate-800 text-lg">{dryRunResult.affectedItems}</p>
                        <p className="text-slate-500 text-xs">{t['bonus.affectedItems']}</p>
                    </div>
                     <div className="text-center p-2 bg-white rounded shadow-sm">
                        <p className={`font-semibold text-lg ${changeColor}`}>{change > 0 ? '+' : ''}{change.toFixed(2)}</p>
                        <p className="text-slate-500 text-xs">{t['bonus.totalBonusChange']}</p>
                    </div>
                     <div className="text-center p-2 bg-white rounded shadow-sm">
                        <p className="font-semibold text-red-600 text-lg">{dryRunResult.potentialBreaches}</p>
                        <p className="text-slate-500 text-xs">{t['bonus.potentialBreaches']}</p>
                    </div>
                     <div className="text-center p-2 bg-white rounded shadow-sm">
                        <p className="font-semibold text-slate-800 text-lg">${dryRunResult.newTotal.toFixed(2)}</p>
                        <p className="text-slate-500 text-xs">{t['bonus.newTotal']}</p>
                    </div>
                 </div>
            </div>
        )
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t.bonusSla}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SLA Timings */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t['bonus.slaTimings']}</h3>
                    <div className="space-y-3">
                        {slaSettings.map(setting => (
                            <div key={setting._id} className="flex items-center justify-between">
                                <label htmlFor={`sla-${setting._id}`} className="font-medium text-slate-700">{t[`reception.priority.${setting.priority.toLowerCase()}`]}</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        id={`sla-${setting._id}`}
                                        value={editableSla[setting._id] || ''}
                                        onChange={(e) => setEditableSla(prev => ({...prev, [setting._id]: e.target.value}))}
                                        className="w-24 p-1.5 border rounded-md text-right"
                                    />
                                    <span className="ml-2 text-sm text-slate-500">{t['bonus.targetMinutes']}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Bonus Rules */}
                 <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t['bonus.bonusRules']}</h3>
                    <div className="space-y-3">
                         {bonusSettings.map(setting => (
                            <div key={setting._id} className="flex items-center justify-between">
                                <label htmlFor={`bonus-${setting._id}`} className="font-medium text-slate-700 text-sm">{setting.ruleName}</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        id={`bonus-${setting._id}`}
                                        value={editableBonuses[setting._id]?.points || ''}
                                        onChange={(e) => setEditableBonuses(prev => ({...prev, [setting._id]: {...prev[setting._id], points: e.target.value}}))}
                                        className="w-20 p-1.5 border rounded-md text-right"
                                    />
                                     <span className="ml-2 text-sm text-slate-500">{t['bonus.points']}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dry-run */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">{t['bonus.dryRun']}</h3>
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-slate-600 max-w-2xl">
                        Simulate the financial impact of your proposed changes based on the last 30 days of activity before applying them system-wide.
                    </p>
                    <button onClick={handleRunSimulation} disabled={isSimulating} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                        {isSimulating ? <LoadingIcon className="h-4 w-4 mr-2" /> : <CalculatorIcon className="h-4 w-4 mr-2"/>}
                        {t['bonus.runSimulation']}
                    </button>
                 </div>
                 {isSimulating && <div className="flex justify-center p-8"><LoadingIcon className="h-8 w-8 text-indigo-600" /></div>}
                 {renderDryRunResult()}
            </div>

            {/* Global Save */}
            <div className="flex justify-end items-center">
                {showSuccess && <span className="text-sm text-green-600 mr-4">{t['bonus.settingsUpdated']}</span>}
                <button onClick={handleSaveChanges} disabled={isSaving} className="inline-flex items-center px-6 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                     {isSaving && <LoadingIcon className="h-5 w-5 mr-2" />}
                    {t['bonus.saveChanges']}
                </button>
            </div>
        </div>
    );
};

export default BonusSlaControl;