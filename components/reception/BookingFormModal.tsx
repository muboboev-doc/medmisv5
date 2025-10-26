

import React, { useState, useEffect } from 'react';
import { Slot, Priority, Room, Referral, TranslationMap } from '../../types';
import { ALL_PRIORITIES } from '../../constants';
import { LoadingIcon } from '../Icons';
import * as api from '../../services/api';
import SlotSelectorPanels from './SlotSelectorPanels';

interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBook: (slotId: string, patientName: string, complaints: string, priority: Priority) => Promise<boolean>;
    // FIX: Use TranslationMap for 't' prop
    t: TranslationMap;
    clinicId: string;
    initialReferral: Referral | null;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({ isOpen, onClose, onBook, t, clinicId, initialReferral }) => {
    const [patientName, setPatientName] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [complaints, setComplaints] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.STD);
    const [isBooking, setIsBooking] = useState(false);
    
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchRooms = async () => {
                const fetchedRooms = await api.fetchRooms(clinicId);
                setRooms(fetchedRooms);
            };
            fetchRooms();

            // Pre-fill form if a referral is provided
            if (initialReferral) {
                setPatientName(initialReferral.patientHint.name);
                // Age and phone are not part of the Referral type, so they are not pre-filled from QR scan.
                setAge('');
                setPhone('');
                setComplaints(initialReferral.patientHint.complaint);
                setSelectedRoomId(initialReferral.roomId);
            }
        }
    }, [isOpen, clinicId, initialReferral]);
    
    const resetForm = () => {
        setPatientName('');
        setAge('');
        setPhone('');
        setComplaints('');
        setPriority(Priority.STD);
        setSelectedRoomId('');
        setSelectedSlot(null);
    }

    const handleClose = () => {
        resetForm();
        onClose();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) {
            alert('Please select a time slot.'); // Replace with a proper toast notification
            return;
        }
        setIsBooking(true);
        const success = await onBook(selectedSlot._id, patientName, complaints, priority);
        if (success) {
            handleClose();
        }
        setIsBooking(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{t['reception.title']}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Patient Details Column */}
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="patientName" className="block text-sm font-medium text-slate-700">{t['reception.fullName']}</label>
                                <input type="text" id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="mt-1 block w-full input" required />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="age" className="block text-sm font-medium text-slate-700">{t['reception.age']}</label>
                                    <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 block w-full input" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t['reception.phone']}</label>
                                    <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full input" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="complaints" className="block text-sm font-medium text-slate-700">{t['reception.complaints']}</label>
                                <textarea id="complaints" value={complaints} onChange={(e) => setComplaints(e.target.value)} rows={3} className="mt-1 block w-full input" required />
                            </div>
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-slate-700">{t['reception.priority']}</label>
                                <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="mt-1 block w-full input">
                                    {ALL_PRIORITIES.map(p => (
                                        <option key={p} value={p}>{t[`reception.priority.${p.toLowerCase()}`] || p}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="room" className="block text-sm font-medium text-slate-700">{t['reception.room']}</label>
                                <select id="room" value={selectedRoomId} onChange={e => { setSelectedRoomId(e.target.value); setSelectedSlot(null); }} className="mt-1 block w-full input" required>
                                    <option value="">Select a room...</option>
                                    {rooms.map(room => <option key={room._id} value={room._id}>{room.name} ({room.modality})</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Slot Selector Column */}
                        <div>
                            {selectedRoomId ? (
                                <SlotSelectorPanels 
                                    clinicId={clinicId}
                                    roomId={selectedRoomId}
                                    selectedSlot={selectedSlot}
                                    onSelectSlot={setSelectedSlot}
                                    t={t}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center bg-slate-50 rounded-md">
                                    <p className="text-slate-500">{t['reception.selectRoomPrompt']}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 btn-secondary">
                            {t.close}
                        </button>
                        <button type="submit" disabled={isBooking || !selectedSlot} className="inline-flex justify-center items-center px-4 py-2 btn-primary disabled:opacity-50">
                            {isBooking && <LoadingIcon className="h-4 w-4 mr-2" />}
                            {t['reception.addToQueue']}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .input {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                }
                .input:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px #bfdbfe;
                }
                .btn-primary {
                    font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
                }
                 .btn-secondary {
                    font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500;
                }
            `}</style>
        </div>
    );
};

export default BookingFormModal;