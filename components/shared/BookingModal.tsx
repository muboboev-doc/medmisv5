

import React, { useState } from 'react';
// FIX: Import TranslationMap for correct typing of 't' prop.
import { Slot, Priority, TranslationMap } from '../../types';
import { ALL_PRIORITIES } from '../../constants';
import { ClockIcon, LoadingIcon } from '../Icons';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot;
    onBook: (slotId: string, patientName: string, complaints: string, priority: Priority) => Promise<boolean>;
    // FIX: Use TranslationMap for 't' prop.
    t: TranslationMap;
    bookingError: string | null; // New prop for error message
    setBookingError: (error: string | null) => void; // New prop to set error
}

// FIX: Changed to a named export
export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, slot, onBook, t, bookingError, setBookingError }) => {
    const [patientName, setPatientName] = useState('');
    const [complaints, setComplaints] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.STD);
    const [isBooking, setIsBooking] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBooking(true);
        setBookingError(null); // Clear previous error
        const success = await onBook(slot._id, patientName, complaints, priority);
        if (success) {
            onClose();
            // Reset form for next time
            setPatientName('');
            setComplaints('');
            setPriority(Priority.STD);
        } else {
             // FIX: Cast translation value to string
            setBookingError(t.bookingFailed as string); // Set booking-specific error
        }
        setIsBooking(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b">
                    {/* FIX: Cast translation to string */}
                    <h3 className="text-xl font-bold text-slate-800">{t.bookAppointment as string}</h3>
                    <div className="text-slate-500 text-sm mt-2 flex items-center space-x-4">
                        <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1" /> {slot.startAt} - {slot.endAt}</span>
                        <span>{slot.roomName} ({slot.modality})</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            {/* FIX: Cast translation to string */}
                            <label htmlFor="patientName" className="block text-sm font-medium text-slate-700">{t.patientName as string}</label>
                            <input
                                type="text"
                                id="patientName"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            {/* FIX: Cast translation to string */}
                            <label htmlFor="complaints" className="block text-sm font-medium text-slate-700">{t.complaints as string}</label>
                            <textarea
                                id="complaints"
                                value={complaints}
                                onChange={(e) => setComplaints(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            {/* FIX: Cast translation to string */}
                            <label htmlFor="priority" className="block text-sm font-medium text-slate-700">{t.priority as string}</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                {/* FIX: Use the correct translation keys for priorities, consistent with other components. */}
                                {ALL_PRIORITIES.map(p => (
                                    <option key={p} value={p}>{t[`reception.priority.${p.toLowerCase()}`] as string || p}</option>
                                ))}
                            </select>
                        </div>
                        {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                            {/* FIX: Cast translation to string */}
                            {t.close as string}
                        </button>
                        <button type="submit" disabled={isBooking} className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                            {isBooking && <LoadingIcon className="h-4 w-4 mr-2" />}
                            {/* FIX: Cast translation to string */}
                            {t.book as string}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
