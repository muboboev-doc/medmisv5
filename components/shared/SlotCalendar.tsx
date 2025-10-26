
import React, { useState } from 'react';
import { Slot, Priority } from '../../types';
import { ALL_PRIORITIES } from '../../constants';
import { CalendarIcon, ClockIcon, LoadingIcon } from '../Icons'; // Ensure LoadingIcon is imported
import BookingModal from './BookingModal';

interface SlotCalendarProps {
  slots: Slot[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBookSlot: (slotId: string, patientName: string, complaints: string, priority: Priority) => Promise<boolean>;
  t: Record<string, string>;
  title: string;
  isLoading?: boolean; // New prop for parent loading state
}

const SlotCalendar: React.FC<SlotCalendarProps> = ({ slots, selectedDate, onDateChange, onBookSlot, t, title, isLoading = false }) => {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleSlotClick = (slot: Slot) => {
    if (slot.taken >= slot.capacity) return; // Disable clicking full slots
    setSelectedSlot(slot);
    setBookingError(null); // Reset error on new selection
    setIsModalOpen(true);
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    onDateChange(new Date(date.getTime() + userTimezoneOffset));
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    const roomKey = slot.roomName;
    if (!acc[roomKey]) {
      acc[roomKey] = [];
    }
    acc[roomKey].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <div className="relative mt-4 md:mt-0">
          <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateInputChange}
            className="pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-slate-500"/>
            {t.slotsFor} {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
            <LoadingIcon className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      ) : slots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(groupedSlots).map((roomName) => {
                const roomSlots = groupedSlots[roomName];
                return (
                    <div key={roomName} className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-bold text-md text-blue-700 mb-1">{roomName}</h4>
                        <p className="text-sm text-slate-500 mb-4">{roomSlots[0].modality}</p>
                        <div className="grid grid-cols-3 gap-2">
                            {roomSlots.map(slot => {
                                const isFull = slot.taken >= slot.capacity;
                                const isSelected = selectedSlot?._id === slot._id;
                                const buttonClasses = `
                                    px-2 py-2 text-sm font-semibold text-center rounded-md 
                                    ${isFull 
                                        ? 'bg-red-50 text-red-700 opacity-70 cursor-not-allowed' 
                                        : isSelected 
                                            ? 'bg-blue-600 text-white ring-2 ring-blue-500' 
                                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'
                                    } 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                `;
                                return (
                                    <button
                                        key={slot._id}
                                        onClick={() => handleSlotClick(slot)}
                                        className={buttonClasses}
                                        disabled={isFull}
                                    >
                                        {slot.startAt} {isFull ? '(Full)' : `(${slot.capacity - slot.taken}/${slot.capacity})`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-8">{t.noSlots}</p>
      )}

      {selectedSlot && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          slot={selectedSlot}
          onBook={onBookSlot}
          t={t}
          bookingError={bookingError}
          setBookingError={setBookingError}
        />
      )}
    </div>
  );
};

export default SlotCalendar;