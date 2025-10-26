

import React, { useState, useEffect, useCallback } from 'react';
import { ManagerKpis, QueueItem, Priority, UserRole, QueueStatus, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, ArrowUpCircleIcon, UserPlusIcon, UserCircleIcon } from '../Icons';

interface ManagerPanelProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const KpiCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {children}
    </div>
);

const KpiGraph: React.FC<{title: string, data: Record<string, number>}> = ({title, data}) => {
    const maxValue = Math.max(1, ...Object.values(data) as number[]);
    const sortedData = (Object.entries(data) as [string, number][]).sort(([, a], [, b]) => b - a);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 md:col-span-2">
            <h3 className="text-sm font-medium text-slate-500 mb-3">{title}</h3>
            <div className="space-y-2">
                {sortedData.length > 0 ? sortedData.map(([key, value]) => (
                    <div key={key} className="flex items-center text-xs" title={`${key}: ${value}`}>
                        <span className="text-slate-600 w-24 truncate pr-2">{key}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-5">
                            <div 
                                className="bg-blue-600 h-5 rounded-full flex items-center justify-end pr-2" 
                                style={{width: `${(value / maxValue) * 100}%`}}
                            >
                                <span className="text-white font-bold">{value}</span>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-xs text-slate-400 italic">No data available</p>}
            </div>
        </div>
    );
};


// FIX: Update 't' prop type in AssignModal to TranslationMap
const AssignModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAssign: (radiologistId: string) => Promise<void>;
    radiologists: {_id: string, name: string}[];
    t: TranslationMap;
}> = ({ isOpen, onClose, onAssign, radiologists, t }) => {
    const [selectedRad, setSelectedRad] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        if (radiologists.length > 0 && !selectedRad) {
            setSelectedRad(radiologists[0]._id);
        }
    }, [radiologists, selectedRad]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAssigning(true);
        await onAssign(selectedRad);
        setIsAssigning(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-5 border-b">
                    <h3 className="text-lg font-bold text-slate-800">{t['mgr.assignRadiologistTitle']}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-5">
                        <label htmlFor="rad-select" className="block text-sm font-medium text-slate-700 mb-2">{t['mgr.selectRadiologist']}</label>
                        <select id="rad-select" value={selectedRad} onChange={e => setSelectedRad(e.target.value)} className="w-full p-2 border rounded-md">
                            {radiologists.map(rad => <option key={rad._id} value={rad._id}>{rad.name}</option>)}
                        </select>
                    </div>
                    <div className="bg-slate-50 px-5 py-3 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border rounded-md hover:bg-slate-50">{t.close}</button>
                        <button type="submit" disabled={isAssigning} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                             {isAssigning && <LoadingIcon className="h-4 w-4 mr-2"/>}
                            {t['mgr.assign']}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ManagerPanel: React.FC<ManagerPanelProps> = ({ t }) => {
    const [kpis, setKpis] = useState<ManagerKpis | null>(null);
    const [queues, setQueues] = useState<QueueItem[]>([]);
    const [radiologists, setRadiologists] = useState<{_id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // FIX: Initialized selectedQueueItem with null to prevent usage before declaration.
    const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);
    const [activeTab, setActiveTab] = useState<'queues' | 'schedules'>('queues');
    const clinicId = 'clinic-01'; // Hardcoded for demo

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [kpisData, queuesData, radsData] = await Promise.all([
                api.fetchManagerKpis(clinicId),
                api.fetchManagerQueues(clinicId),
                api.fetchRadiologists(),
            ]);
            setKpis(kpisData);
            setQueues(queuesData);
            setRadiologists(radsData);
        } catch (error) {
            console.error("Failed to fetch manager data:", error);
        } finally {
            setLoading(false);
        }
    }, [clinicId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAssignClick = (item: QueueItem) => {
        setSelectedQueueItem(item);
        setIsModalOpen(true);
    };

    const handleAssign = async (radiologistId: string) => {
        if (!selectedQueueItem) return;
        await api.assignRadiologistToQueueItem(selectedQueueItem._id, radiologistId, 'user-man-01');
        fetchData(); // Refetch for simplicity
    };
    
    const handleEscalate = async (item: QueueItem) => {
        await api.escalateQueueItem(item._id);
        fetchData(); // Refetch for simplicity
    };

    const priorityClasses: Record<Priority, string> = {
        [Priority.SR]: 'bg-red-100 text-red-800',
        [Priority.STD]: 'bg-blue-100 text-blue-800',
        [Priority.PLN]: 'bg-green-100 text-green-800',
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;
    }

  return (
    <div className="space-y-6">
        <AssignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAssign={handleAssign} radiologists={radiologists} t={t} />
         <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
                <button onClick={() => setActiveTab('queues')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'queues' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {t['mgr.queues']}
                </button>
                    <button onClick={() => setActiveTab('schedules')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'schedules' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {t['mgr.schedules']}
                </button>
            </nav>
        </div>

        {activeTab === 'queues' && (
            <div className="space-y-6">
                {/* KPI Section */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-3">{t['mgr.kpis']}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KpiCard title={t['mgr.slaCompliance'] as string} value={`${kpis?.slaCompliance}%`} />
                        <KpiCard title={t['mgr.avgWaitTime'] as string} value={kpis?.avgWaitTime || 'N/A'} />
                        <KpiCard title="SR / STD / PLN" value={`${kpis?.queueCounts.SR} / ${kpis?.queueCounts.STD} / ${kpis?.queueCounts.PLN}`} />
                        <KpiGraph title={t['mgr.radLoad'] as string} data={kpis?.radLoad || {}}/>
                    </div>
                </div>

                {/* Queues Table */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">{t['mgr.queues']}</h2>
                    {queues.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-left">{t.roles[UserRole.Patient]}</th>
                                        <th className="p-3 text-left">{t.room}</th>
                                        <th className="p-3 text-left">{t.priority}</th>
                                        <th className="p-3 text-left">{t.status}</th>
                                        <th className="p-3 text-left">{t['mgr.assignedTo']}</th>
                                        <th className="p-3 text-left">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queues.map(item => {
                                        const assignedRad = radiologists.find(r => r._id === item.radiologistId);
                                        return (
                                        <tr key={item._id} className="border-b hover:bg-slate-50">
                                            <td className="p-3 font-medium">{item.patient.maskedName}</td>
                                            <td className="p-3 text-slate-600">{item.roomName}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityClasses[item.priority]}`}>
                                                    {t[`reception.priority.${item.priority.toLowerCase()}`]}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600">{t[item.status] as string || item.status}</td>
                                            <td className="p-3 text-slate-600 flex items-center">
                                                {assignedRad ? <><UserCircleIcon className="w-4 h-4 mr-2 text-green-600"/>{assignedRad.name}</> : <span className="text-slate-400">{t['mgr.unassigned']}</span>}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => handleAssignClick(item)} className="flex items-center text-xs p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                                                        <UserPlusIcon className="w-4 h-4 mr-1"/>{t[item.radiologistId ? 'mgr.reassign' : 'mgr.assign']}
                                                    </button>
                                                    {item.priority !== Priority.SR && (
                                                        <button onClick={() => handleEscalate(item)} className="flex items-center text-xs p-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200">
                                                            <ArrowUpCircleIcon className="w-4 h-4 mr-1"/>{t['mgr.escalate']}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">{t['mgr.noQueuedItems']}</p>
                    )}
                </div>
            </div>
        )}
        {activeTab === 'schedules' && (
             <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{t['mgr.schedules']}</h2>
                <div className="flex items-center justify-center h-64 bg-slate-50 rounded-md">
                    <p className="text-slate-500">Drag-and-drop shift calendar coming soon.</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default ManagerPanel;
