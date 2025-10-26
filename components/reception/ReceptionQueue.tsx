
import React, { useState, useEffect, useCallback } from 'react';
import { QueueItem, Priority, QueueStatus, Referral, Permissions, UserRole, Room, Slot, TranslationMap } from '../../types';
import { summarizeText } from '../../services/geminiService';
import { SparklesIcon, LoadingIcon, QrCodeIcon } from '../Icons';
import BookingFormModal from './BookingFormModal';
import QrScanModal from './QrScanModal';
import * as api from '../../services/api';

interface ReceptionQueueProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
  permissions: Permissions;
}

// Simple Toast component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg text-white transition-opacity duration-300 ${bgColor}`}>
            <div className="flex items-center">
                <span>{message}</span>
                <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
            </div>
        </div>
    );
};

// FIX: Update 't' prop type in QueueItemRow to TranslationMap
const QueueItemRow: React.FC<{ item: QueueItem, t: TranslationMap, permissions: Permissions }> = ({ item, t, permissions }) => {
    const [summary, setSummary] = useState<string>('');
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

    const handleSummarize = async () => {
        setIsSummarizing(true);
        const result = await summarizeText(item.complaints);
        setSummary(result);
        setIsSummarizing(false);
    };

    const priorityClasses: Record<Priority, string> = {
        [Priority.SR]: 'bg-red-100 text-red-800',
        [Priority.STD]: 'bg-blue-100 text-blue-800',
        [Priority.PLN]: 'bg-green-100 text-green-800',
    };
    
    // Map QueueStatus values to translation keys
    const statusTranslationKey: Record<QueueStatus, string> = {
        [QueueStatus.Queued]: 'queued',
        [QueueStatus.InProgress]: 'in_progress',
        [QueueStatus.Described]: 'described',
        [QueueStatus.Done]: 'done',
        [QueueStatus.Cancelled]: 'cancelled',
        [QueueStatus.NoShow]: 'no_show',
    };

    const statusClasses: Record<QueueStatus, string> = {
        [QueueStatus.Queued]: 'bg-slate-100',
        [QueueStatus.InProgress]: 'bg-yellow-100',
        [QueueStatus.Described]: 'bg-indigo-100',
        [QueueStatus.Done]: 'bg-green-100',
        [QueueStatus.Cancelled]: 'bg-gray-100',
        [QueueStatus.NoShow]: 'bg-gray-100',
    };

    const textStatusClasses: Record<QueueStatus, string> = {
        [QueueStatus.Queued]: 'text-slate-800',
        [QueueStatus.InProgress]: 'text-yellow-800',
        [QueueStatus.Described]: 'text-indigo-800',
        [QueueStatus.Done]: 'text-green-800',
        [QueueStatus.Cancelled]: 'text-gray-800',
        [QueueStatus.NoShow]: 'text-gray-800',
    };

    return (
        <tr className="bg-white hover:bg-slate-50 border-b">
            <td className="px-4 py-3 font-medium text-slate-900">{item.startAt}</td>
            <td className="px-4 py-3">{item.patient.maskedName}</td>
            <td className="px-4 py-3 text-slate-600">{item.roomName}</td>
            <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityClasses[item.priority]}`}>
                    {/* FIX: Cast translation to string */}
                    {t[`reception.priority.${item.priority.toLowerCase()}`] as string || item.priority}
                </span>
            </td>
            <td className="px-4 py-3">
                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[item.status]} ${textStatusClasses[item.status]}`}>
                    {/* FIX: Cast translation to string */}
                    {t[statusTranslationKey[item.status]] as string || item.status}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col">
                    <p className="text-slate-700 truncate max-w-xs" title={item.complaints}>{item.complaints}</p>
                    {/* FIX: Cast translation to string */}
                    {permissions.canSummarizeWithAI && summary && <p className="text-sm text-purple-700 mt-1">{t.summary as string}: {summary}</p>}
                </div>
            </td>
            <td className="px-4 py-3">
                {permissions.canSummarizeWithAI && (
                    <button 
                        onClick={handleSummarize} 
                        disabled={isSummarizing}
                        className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isSummarizing ? (
                            <LoadingIcon className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <SparklesIcon className="h-4 w-4 mr-1"/>
                        )}
                        {/* FIX: Cast translation to string */}
                        {t.summarize as string}
                    </button>
                )}
            </td>
        </tr>
    );
};


const ReceptionQueue: React.FC<ReceptionQueueProps> = ({ t, permissions }) => {
  const clinicId = 'clinic-01'; // Hardcoded for demo

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isQrScanModalOpen, setIsQrScanModalOpen] = useState(false);
  const [initialReferralFromQr, setInitialReferralFromQr] = useState<Referral | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | ''>('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
        setToastMessage('');
        setToastType('');
    }, 3000); // Toast disappears after 3 seconds
  };

  const fetchQueueData = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const fetchedQueue = await api.fetchQueue(clinicId, new Date());
      setQueue(fetchedQueue);
    } catch (error) {
      console.error("Error fetching reception queue:", error);
      // FIX: Cast translation to string
      showToast(t['reception.errorFetchingQueue'] as string, 'error');
    } finally {
      setLoadingQueue(false);
    }
  }, [clinicId, t]);

  useEffect(() => {
    fetchQueueData();

    const unsubscribe = api.subscribeToWs('queue', (event) => {
        console.log('ReceptionQueue WS Event Received:', event);
        if (event.type === 'queue.created' || event.type === 'queue.updated') {
            fetchQueueData(); // Re-fetch all queue data for simplicity
        }
    });
    return () => unsubscribe();
  }, [fetchQueueData]);

  const handleBookSlot = async (slotId: string, patientName: string, complaints: string, priority: Priority): Promise<boolean> => {
    try {
      await api.bookSlot(slotId, patientName, complaints, priority, initialReferralFromQr?.qrCode);
      setInitialReferralFromQr(null); // Clear referral after successful booking
      fetchQueueData(); // Refresh queue
      // FIX: Cast translation to string
      showToast(t.bookingSuccessful as string, 'success');
      return true;
    } catch (error) {
      console.error("Booking failed:", error);
      // FIX: Cast translation to string
      showToast(t.bookingFailed as string, 'error');
      return false;
    }
  };

  const handleQrScan = (referral: Referral) => {
    setInitialReferralFromQr(referral);
    setIsQrScanModalOpen(false);
    setIsBookingModalOpen(true); // Open booking form with pre-filled data
  };

  const openBookingModal = () => {
    setInitialReferralFromQr(null); // Ensure no old referral is present
    setIsBookingModalOpen(true);
  };

  return (
    <div className="space-y-8">
        {toastMessage && <Toast message={toastMessage} type={toastType as 'success' | 'error'} onClose={() => setToastMessage('')} />}

        <BookingFormModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            onBook={handleBookSlot}
            t={t}
            clinicId={clinicId}
            initialReferral={initialReferralFromQr}
        />
        <QrScanModal
            isOpen={isQrScanModalOpen}
            onClose={() => setIsQrScanModalOpen(false)}
            onScan={handleQrScan}
            t={t}
        />

        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                {/* FIX: Cast translation to string */}
                <h2 className="text-2xl font-bold text-slate-800">{t.patientsQueue as string}</h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setIsQrScanModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                        <QrCodeIcon className="h-5 w-5 mr-2" />
                        {/* FIX: Cast translation to string */}
                        {t['reception.scanQr'] as string}
                    </button>
                    <button 
                        onClick={openBookingModal}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                    >
                        {/* FIX: Cast translation to string */}
                        {t['reception.addToQueue'] as string}
                    </button>
                </div>
            </div>
            
            {loadingQueue ? (
                <div className="flex justify-center items-center h-48"><LoadingIcon className="h-12 w-12 text-blue-600 animate-spin" /></div>
            ) : queue.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                {/* FIX: Cast translation to string */}
                                <th scope="col" className="px-4 py-3">{t.time as string}</th>
                                <th scope="col" className="px-4 py-3">{t.roles[UserRole.Patient]}</th>
                                {/* FIX: Cast translation to string */}
                                <th scope="col" className="px-4 py-3">{t.room as string}</th>
                                {/* FIX: Cast translation to string */}
                                <th scope="col" className="px-4 py-3">{t.priority as string}</th>
                                {/* FIX: Cast translation to string */}
                                <th scope="col" className="px-4 py-3">{t.status as string}</th>
                                {/* FIX: Cast translation to string */}
                                <th scope="col" className="px-4 py-3">{t.complaints as string}</th>
                                {/* FIX: Cast translation to string */}
                                <th scope="col" className="px-4 py-3">{t.actions as string}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map(item => <QueueItemRow key={item._id} item={item} t={t} permissions={permissions} />)}
                        </tbody>
                    </table>
                </div>
            ) : (
                // FIX: Cast translation to string
                <p className="text-slate-500 text-center py-8">{t.noQueue as string}</p>
            )}
        </div>
    </div>
  );
};

export default ReceptionQueue;