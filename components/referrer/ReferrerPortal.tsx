

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Slot, Priority, UserRole, Referral, ReferralStatus } from '../../types';
import { CalendarIcon, ClockIcon, LoadingIcon, ShareIcon, ClipboardCopyIcon, QrCodeIcon, SearchIcon } from '../Icons';
import SlotCalendar from '../shared/SlotCalendar'; // Updated import path to shared SlotCalendar
import * as api from '../../services/api';

interface ReferrerPortalProps {
  t: Record<string, string>;
  role: UserRole; // Added role prop as expected by MainLayout
}


const ReferrerPortal: React.FC<ReferrerPortalProps> = ({ t, role }) => {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ReferralStatus>('all');
    // Placeholder for fetched rooms, clinicId, and selected date for the SlotCalendar
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const clinicId = 'clinic-01'; // Hardcoded for demo

    const fetchReferralsData = useCallback(async () => {
        // Hardcoded referrerId for demo purposes
        const referrerId = 'user-ref-01'; 
        const fetchedReferrals = await api.fetchReferrals(referrerId);
        setReferrals(fetchedReferrals);
        setLoading(false);
    }, []);

    const fetchSlotsData = useCallback(async () => {
        setIsLoadingSlots(true);
        try {
            const fetchedRooms = await api.fetchRooms(clinicId);
            setRooms(fetchedRooms);
            const days = 7; // Fetch for next 7 days for referrer portal
            const fetchedSlots = await api.fetchSlots(clinicId, selectedDate, days, role);
            // Filter slots to show only available ones by default, and if a room is selected
            setSlots(fetchedSlots.filter(s => s.taken < s.capacity && (!selectedRoomId || s.roomId === selectedRoomId)));
        } catch (error) {
            console.error("Error fetching slots:", error);
        } finally {
            setIsLoadingSlots(false);
        }
    }, [clinicId, selectedDate, role, selectedRoomId]);

    useEffect(() => {
        fetchReferralsData();
        fetchSlotsData();
    }, [fetchReferralsData, fetchSlotsData]);
    
    useEffect(() => {
        const unsubscribe = api.subscribeToWs('ref', (event) => {
            if(event.type === 'ref.created' || event.type === 'ref.updated') {
                fetchReferralsData(); // Refetch for simplicity
            }
        });
        return () => unsubscribe();
    }, [fetchReferralsData]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const statusClasses: Record<ReferralStatus, string> = {
        [ReferralStatus.Yellow]: 'bg-yellow-300 text-yellow-900',
        [ReferralStatus.Green]: 'bg-green-500 text-white',
        [ReferralStatus.Red]: 'bg-red-500 text-white',
    };

    const filteredReferrals = useMemo(() => {
        return referrals.filter(ref => {
            // Status filter
            if (statusFilter !== 'all' && ref.status !== statusFilter) {
                return false;
            }

            // Search query filter
            if (!searchQuery) {
                return true;
            }
            const lowercasedQuery = searchQuery.toLowerCase();
            const patientName = ref.patientHint.name.toLowerCase();
            const shortCode = ref.shortCode.toLowerCase();
            const statusText = t[`ref.status.${ref.status}`]?.toLowerCase() || '';

            return (
                patientName.includes(lowercasedQuery) ||
                shortCode.includes(lowercasedQuery) ||
                statusText.includes(lowercasedQuery)
            );
        });
    }, [referrals, searchQuery, statusFilter, t]);

    const filterOptions: Array<{ labelKey: string, value: 'all' | ReferralStatus }> = [
        { labelKey: 'ref.all', value: 'all' },
        { labelKey: 'ref.status.yellow', value: ReferralStatus.Yellow },
        { labelKey: 'ref.status.green', value: ReferralStatus.Green },
        { labelKey: 'ref.status.red', value: ReferralStatus.Red },
    ];
    
    const handleCreateReferral = async (slotId: string, patientName: string, complaints: string, priority: Priority) => {
        // Hardcoded referrerId for demo purposes
        const referrerId = 'user-ref-01'; 
        try {
            await api.createReferral(referrerId, slotId, patientName, complaints);
            fetchReferralsData(); // Refresh list of referrals
            fetchSlotsData(); // Refresh slots as one might be taken
            return true;
        } catch (error) {
            console.error("Error creating referral:", error);
            return false;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t.referrerPortal}</h2>

            {/* Referral creation section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t['ref.create']}</h3>
                <p className="text-slate-600 mb-4">Select a slot to create a new referral for a patient.</p>
                <div className="mb-4">
                    <label htmlFor="room-select" className="block text-sm font-medium text-slate-700 mb-1">{t.room}</label>
                    <select
                        id="room-select"
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full md:w-1/2 p-2 border rounded-md bg-slate-50"
                    >
                        <option value="">{t['reception.selectRoomPrompt']}</option>
                        {rooms.map(room => (
                            <option key={room._id} value={room._id}>{room.name} ({room.modality})</option>
                        ))}
                    </select>
                </div>
                <SlotCalendar
                    slots={slots}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onBookSlot={handleCreateReferral}
                    t={t}
                    title={t['ref.createReferralFor']}
                    isLoading={isLoadingSlots}
                />
            </div>

            {/* My Referrals Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{t['ref.myReferrals']}</h3>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search referrals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 border rounded-md text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReferralStatus)}
                            className="p-1.5 border rounded-md text-sm bg-white"
                        >
                            {filterOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {t[option.labelKey]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>
                ) : filteredReferrals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">{t['ref.patientHint']}</th>
                                    <th scope="col" className="px-4 py-3">{t['ref.qrCode']}</th>
                                    <th scope="col" className="px-4 py-3">{t['ref.shortCode']}</th>
                                    <th scope="col" className="px-4 py-3">{t['ref.createdAt']}</th>
                                    <th scope="col" className="px-4 py-3">{t['ref.status']}</th>
                                    <th scope="col" className="px-4 py-3">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReferrals.map(referral => (
                                    <tr key={referral._id} className="bg-white hover:bg-slate-50 border-b">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <p>{referral.patientHint.name}</p>
                                            <p className="text-xs text-slate-500">{referral.patientHint.complaint}</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <div className="flex items-center">
                                                <QrCodeIcon className="h-5 w-5 mr-2 text-slate-400"/>
                                                {referral.qrCode}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-600">{referral.shortCode}</td>
                                        <td className="px-4 py-3 text-slate-600">{new Date(referral.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[referral.status]}`}>
                                                {t[`ref.status.${referral.status}`] || referral.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleCopy(referral.qrCode)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 relative">
                                                    {copiedCode === referral.qrCode && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-2 py-1 rounded">{t['ref.copied']}</span>}
                                                    <ClipboardCopyIcon className="h-4 w-4" title={t['ref.copy']} />
                                                </button>
                                                <button onClick={() => navigator.share && navigator.share({title: t.appName, text: `Referral for ${referral.patientHint.name}: ${referral.qrCode}`, url: referral.qrCode})} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                                                    <ShareIcon className="h-4 w-4" title={t['ref.share']} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">{t['ref.noReferrals']}</p>
                )}
            </div>
        </div>
    );
};

export default ReferrerPortal;