
import React, { useState, useEffect, useMemo } from 'react';
import { Slot } from '../../types';
import * as api from '../../services/api';
import { UserRole } from '../../types';
import { LoadingIcon } from '../Icons';

interface SlotSelectorPanelsProps {
    clinicId: string;
    roomId: string;
    selectedSlot: Slot | null;
    onSelectSlot: (slot: Slot | null) => void;
    t: Record<string, string>;
}

enum Panel { Today, Periods, Other }
enum Period { Days3=3, Days7=7, Days30=30 }

const SlotSelectorPanels: React.FC<SlotSelectorPanelsProps> = ({ clinicId, roomId, selectedSlot, onSelectSlot, t }) => {
    const [activePanel, setActivePanel] = useState<Panel>(Panel.Today);
    const [activePeriod, setActivePeriod] = useState<Period>(Period.Days3);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [workload, setWorkload] = useState<Record<string, { total: number, taken: number }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            onSelectSlot(null); // Reset selection when room changes
            try {
                if (activePanel === Panel.Other) {
                    const fetchedWorkload = await api.fetchClinicWorkload(clinicId, new Date(), activePeriod);
                    setWorkload(fetchedWorkload);
                } else {
                    const days = activePanel === Panel.Today ? 1 : activePeriod;
                    const fetchedSlots = await api.fetchSlots(clinicId, new Date(), days, UserRole.Reception);
                    setSlots(fetchedSlots.filter(s => s.roomId === roomId));
                }
            } catch (error) {
                console.error("Error fetching slot data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (roomId) {
            fetchData();
        }
    }, [clinicId, roomId, activePanel, activePeriod, onSelectSlot]);
    
    const groupedSlots = useMemo(() => {
         return slots.reduce((acc, slot) => {
            const date = slot.date;
            if (!acc[date]) acc[date] = [];
            acc[date].push(slot);
            return acc;
        }, {} as Record<string, Slot[]>);
    }, [slots]);

    const renderTodayPanel = () => {
        const todaySlots = groupedSlots[new Date().toISOString().split('T')[0]] || [];
        if(todaySlots.length === 0) return <p className="text-slate-500 text-center p-4">{t['reception.noSlots']}</p>

        return (
             <div className="grid grid-cols-4 gap-2">
                {todaySlots.map(slot => (
                    <button
                        key={slot._id}
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className={`px-2 py-2 text-sm font-semibold text-center rounded-md transition-colors ${selectedSlot?._id === slot._id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                    >
                        {slot.startAt}
                    </button>
                ))}
            </div>
        )
    };

    const renderPeriodsPanel = () => {
         if(Object.keys(groupedSlots).length === 0) return <p className="text-slate-500 text-center p-4">{t['reception.noSlotsForPeriod']}</p>
        return (
            <div className="space-y-4">
                 <div className="flex justify-center bg-slate-100 p-1 rounded-md">
                    {(Object.keys(Period).filter(k => isNaN(Number(k))) as (keyof typeof Period)[]).map(p => (
                       <button key={p} type="button" onClick={() => setActivePeriod(Period[p])} className={`w-full px-2 py-1 text-sm font-medium rounded ${activePeriod === Period[p] ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                           {t[`reception.${p.toLowerCase()}`] || p}
                        </button>
                    ))}
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {Object.keys(groupedSlots).sort().map(dateStr => (
                    <div key={dateStr}>
                        <h4 className="font-semibold text-sm mb-2">{new Date(dateStr+'T00:00:00').toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}</h4>
                        <div className="grid grid-cols-4 gap-2">
                             {groupedSlots[dateStr].map(slot => (
                                <button
                                    key={slot._id}
                                    type="button"
                                    onClick={() => onSelectSlot(slot)}
                                    className={`px-2 py-2 text-sm font-semibold text-center rounded-md transition-colors ${selectedSlot?._id === slot._id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >
                                    {slot.startAt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                </div>
            </div>
        )
    };
    
    const renderOtherRoomsPanel = () => {
         if(Object.keys(workload).length === 0) return <p className="text-slate-500 text-center p-4">{t['reception.loading']}</p>
         return (
             <div className="space-y-4">
                 <div className="flex justify-center bg-slate-100 p-1 rounded-md">
                    {(Object.keys(Period).filter(k => isNaN(Number(k))) as (keyof typeof Period)[]).map(p => (
                       <button key={p} type="button" onClick={() => setActivePeriod(Period[p])} className={`w-full px-2 py-1 text-sm font-medium rounded ${activePeriod === Period[p] ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                           {t[`reception.${p.toLowerCase()}`] || p}
                        </button>
                    ))}
                </div>
                 <div className="space-y-3">
                     {Object.entries(workload).filter(([name, data]) => name !== slots[0]?.roomName).map(([roomName, data]) => {
                         const workloadData = data as { total: number; taken: number };
                         const occupancy = workloadData.total > 0 ? (workloadData.taken / workloadData.total) * 100 : 0;
                         return (
                            <div key={roomName} className="p-3 border rounded-md">
                                 <h4 className="font-semibold text-sm">{roomName}</h4>
                                 <p className="text-xs text-slate-500 mb-2">{t['reception.workload']}</p>
                                 <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${occupancy}%` }}></div>
                                 </div>
                                 <p className="text-xs text-right text-slate-500 mt-1">{Math.round(occupancy)}%</p>
                            </div>
                         )
                     })}
                 </div>
             </div>
         )
    }

    const renderContent = () => {
        if (loading) return <div className="flex justify-center items-center h-48"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>;
        switch (activePanel) {
            case Panel.Today: return renderTodayPanel();
            case Panel.Periods: return renderPeriodsPanel();
            case Panel.Other: return renderOtherRoomsPanel();
            default: return null;
        }
    };
    
    const panelTabs = [
        { id: Panel.Today, label: t['reception.today'] },
        { id: Panel.Periods, label: t['reception.periods'] },
        { id: Panel.Other, label: t['reception.otherRooms'] }
    ];

    return (
        <div className="border border-slate-200 rounded-lg p-4 h-full">
            <div className="mb-4 border-b">
                <nav className="-mb-px flex space-x-4">
                    {panelTabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActivePanel(tab.id)}
                            className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${activePanel === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default SlotSelectorPanels;