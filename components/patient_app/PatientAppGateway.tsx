

import React, { useState, useEffect, useCallback } from 'react';
import { PatientBooking, PatientBookingStatus, PatientReport, Slot, Room, UserRole } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, CalendarIcon, ClockIcon, CreditCardIcon, ChatBubbleLeftRightIcon, ArrowDownTrayIcon, DocumentTextIcon, FilmIcon } from '../Icons';
import SlotSelectorPanels from '../reception/SlotSelectorPanels';


interface PatientAppGatewayProps {
  t: Record<string, string>;
}

type ActionState = {
    [bookingId: string]: boolean;
};

const RescheduleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    booking: PatientBooking;
    t: Record<string, string>;
    onReschedule: (bookingId: string, newSlotId: string) => Promise<boolean>;
}> = ({ isOpen, onClose, booking, t, onReschedule }) => {
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        setIsRescheduling(true);
        const success = await onReschedule(booking._id, selectedSlot._id);
        if (success) {
            onClose();
        }
        setIsRescheduling(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{t['pat.reschedule']}</h3>
                    <p className="text-sm text-slate-500 mt-1">Select a new time for your appointment in {booking.roomName}.</p>
                </div>
                <div className="p-6">
                     <SlotSelectorPanels
                        clinicId={booking.clinicId}
                        roomId={booking.roomId}
                        selectedSlot={selectedSlot}
                        onSelectSlot={setSelectedSlot}
                        t={t}
                    />
                </div>
                 <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                        {t.close}
                    </button>
                    <button onClick={handleConfirm} disabled={!selectedSlot || isRescheduling} className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                        {isRescheduling && <LoadingIcon className="h-4 w-4 mr-2" />}
                        {t['pat.reschedule']}
                    </button>
                </div>
            </div>
        </div>
    );
};


const BookingCard: React.FC<{
    booking: PatientBooking;
    t: Record<string, string>;
    onAction: (action: 'pay' | 'cancel' | 'reschedule', booking: PatientBooking) => void;
    actionState: ActionState;
}> = ({ booking, t, onAction, actionState }) => {
    
    const statusClasses: Record<PatientBookingStatus, { bg: string, text: string }> = {
        [PatientBookingStatus.Booked]: { bg: 'bg-blue-100', text: 'text-blue-800' },
        [PatientBookingStatus.Paid]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        [PatientBookingStatus.Done]: { bg: 'bg-green-100', text: 'text-green-800' },
        [PatientBookingStatus.Cancelled]: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const isActionInProgress = actionState[booking._id];

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-800">{booking.roomName}</h3>
                        <p className="text-sm text-slate-500">{booking.modality}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[booking.status].bg} ${statusClasses[booking.status].text}`}>
                        {t[`pat.status.${booking.status}`] || booking.status}
                    </span>
                </div>
                <div className="mt-4 flex items-center text-sm text-slate-600 space-x-4">
                    <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1.5"/> {new Date(booking.date + 'T00:00:00').toLocaleDateString()}</span>
                    <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1.5"/> {booking.startAt}</span>
                </div>
            </div>
            <div className="bg-slate-50 p-3 flex flex-wrap gap-2 justify-end border-t">
                {booking.status === PatientBookingStatus.Booked && (
                    <>
                        <button onClick={() => onAction('pay', booking)} disabled={isActionInProgress} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300">
                           {actionState[`pay-${booking._id}`] ? <LoadingIcon className="h-4 w-4 mr-1"/> : <CreditCardIcon className="h-4 w-4 mr-1.5"/>}
                           {t['pat.pay']}
                        </button>
                        <button onClick={() => onAction('reschedule', booking)} disabled={isActionInProgress} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50">
                           {t['pat.reschedule']}
                        </button>
                        <button onClick={() => onAction('cancel', booking)} disabled={isActionInProgress} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50">
                           {actionState[`cancel-${booking._id}`] && <LoadingIcon className="h-4 w-4 mr-1"/>}
                           {t['pat.cancel']}
                        </button>
                    </>
                )}
                {booking.status === PatientBookingStatus.Paid && (
                     <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5"/>
                        {t['pat.openChat']}
                    </button>
                )}
                 {booking.status === PatientBookingStatus.Done && (
                     <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200">
                        <DocumentTextIcon className="h-4 w-4 mr-1.5"/>
                        {t['pat.viewReport']}
                    </button>
                )}
            </div>
        </div>
    );
};

const SelfBooking: React.FC<{t: Record<string, string>, patientId: string, onBookingSuccess: () => void}> = ({ t, patientId, onBookingSuccess }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    // FIX: Initialized selectedSlot with null to prevent usage before declaration.
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const clinicId = 'clinic-01';

    useEffect(() => {
        api.fetchRooms(clinicId).then(setRooms);
    }, []);

    const handleBook = async () => {
        if (!selectedSlot) return;
        setIsBooking(true);
        try {
            await api.bookSlotAsPatient(selectedSlot._id, patientId);
            onBookingSuccess();
        } catch (error) {
            console.error("Self-booking failed", error);
            // Show error toast in a real app
        } finally {
            setIsBooking(false);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <div className="p-3 bg-green-100 text-green-800 rounded-md text-center font-semibold">
                {t['pat.selfBookDiscount']}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label htmlFor="room-select-pat" className="block text-sm font-medium text-slate-700 mb-1">{t.room}</label>
                     <select id="room-select-pat" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="">{t['reception.selectRoomPrompt']}</option>
                         {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                     </select>
                 </div>
                 <div className="flex items-end">
                    <button onClick={handleBook} disabled={!selectedSlot || isBooking} className="w-full md:w-auto inline-flex justify-center items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isBooking && <LoadingIcon className="h-4 w-4 mr-2" />}
                        {t.bookAppointment}
                    </button>
                </div>
            </div>
            {selectedRoomId && (
                <SlotSelectorPanels
                    clinicId={clinicId}
                    roomId={selectedRoomId}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    t={t}
                />
            )}
        </div>
    );
};

const ReportCard: React.FC<{ report: PatientReport; t: Record<string, string> }> = ({ report, t }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                <FilmIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800">{report.studyName}</h3>
                <p className="text-sm text-slate-500">
                    {t.date}: {new Date(report.createdAt).toLocaleDateString()}
                </p>
            </div>
        </div>
        <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5"/>
            {t['pat.download']}
        </button>
    </div>
);

const PatientAppGateway: React.FC<PatientAppGatewayProps> = ({ t }) => {
    const [activeTab, setActiveTab] = useState<'bookings' | 'reports' | 'self-booking'>('bookings');
    const [bookings, setBookings] = useState<PatientBooking[]>([]);
    const [reports, setReports] = useState<PatientReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionState, setActionState] = useState<ActionState>({});
    const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<PatientBooking | null>(null);

    const patientId = 'user-pat-01'; // Hardcoded for demo

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [b, r] = await Promise.all([
                api.fetchPatientBookings(patientId),
                api.fetchPatientReports(patientId),
            ]);
            setBookings(b);
            setReports(r);
        } catch (error) {
            console.error("Failed to fetch patient data:", error);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const unsubscribe = api.subscribeToWs('pat', (event) => {
            if (event.type === 'pat.booking.update') {
                fetchData();
            }
        });
        return () => unsubscribe();
    }, [fetchData]);

    const handleAction = async (action: 'pay' | 'cancel' | 'reschedule', booking: PatientBooking) => {
        const actionKey = `${action}-${booking._id}`;
        setActionState(prev => ({ ...prev, [actionKey]: true, [booking._id]: true }));

        try {
            if (action === 'pay') {
                await api.payForBooking(booking._id);
            } else if (action === 'cancel') {
                await api.cancelPatientBooking(booking._id);
            } else if (action === 'reschedule') {
                setSelectedBookingForReschedule(booking);
            }
        } catch (error) {
            console.error(`Action ${action} failed for booking ${booking._id}`, error);
            // Show toast
        } finally {
            setActionState(prev => ({ ...prev, [actionKey]: false, [booking._id]: false }));
        }
    };
    
    const handleReschedule = async (bookingId: string, newSlotId: string): Promise<boolean> => {
        try {
            await api.reschedulePatientBooking(bookingId, newSlotId);
            return true;
        } catch (error) {
            console.error("Reschedule failed", error);
            return false;
        }
    };

    const renderContent = () => {
        if (loading) return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;

        switch (activeTab) {
            case 'bookings':
                return bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bookings.map(b => <BookingCard key={b._id} booking={b} t={t} onAction={handleAction} actionState={actionState} />)}
                    </div>
                ) : <p className="text-center py-8 text-slate-500">{t['pat.noBookings']}</p>;
            case 'reports':
                return reports.length > 0 ? (
                     <div className="space-y-4">
                        {reports.map(r => <ReportCard key={r._id} report={r} t={t} />)}
                    </div>
                ) : <p className="text-center py-8 text-slate-500">{t['pat.noReports']}</p>;
            case 'self-booking':
                return <SelfBooking t={t} patientId={patientId} onBookingSuccess={() => setActiveTab('bookings')} />;
        }
    };

    return (
        <div className="space-y-6">
             {selectedBookingForReschedule && (
                <RescheduleModal 
                    isOpen={!!selectedBookingForReschedule}
                    onClose={() => setSelectedBookingForReschedule(null)}
                    booking={selectedBookingForReschedule}
                    t={t}
                    onReschedule={handleReschedule}
                />
             )}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                     <button onClick={() => setActiveTab('bookings')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {t['pat.myBookings']}
                    </button>
                     <button onClick={() => setActiveTab('reports')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {t['pat.myReports']}
                    </button>
                      <button onClick={() => setActiveTab('self-booking')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'self-booking' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {t['pat.selfBooking']}
                    </button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default PatientAppGateway;