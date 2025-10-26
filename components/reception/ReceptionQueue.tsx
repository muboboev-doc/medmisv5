

import React, { useState, useEffect, useCallback } from 'react';
import { QueueItem, Priority, QueueStatus, Referral, Permissions, UserRole, Room, Slot } from '../../types';
import { summarizeText } from '../../services/geminiService';
import { SparklesIcon, LoadingIcon, QrCodeIcon } from '../Icons';
import BookingFormModal from './BookingFormModal';
import QrScanModal from './QrScanModal';
import * as api from '../../services/api';

interface ReceptionQueueProps {
  t: Record<string, string>;
  permissions: Permissions;
}

const QueueItemRow: React.FC<{ item: QueueItem, t: Record<string, string>, permissions: Permissions }> = ({ item, t, permissions }) => {
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
                    {t[`reception.priority.${item.priority.toLowerCase()}`] || item.priority}
                </span>
            </td>
            <td className="px-4 py-3">
                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[item.status]} ${textStatusClasses[item.status]}`}>
                    {t[statusTranslationKey[item.status]] || item.status}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col">
                    <p className="text-slate-700 truncate max-w-xs" title={item.complaints}>{item.complaints}</p>
                    {permissions.canSummarizeWithAI && summary && <p className="text-sm text-purple-700 mt-1">{t.summary}: {summary}</p>}
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
                        {t.summarize}
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

  const fetchQueueData = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const fetchedQueue = await api.fetchQueue(clinicId, new Date());
      setQueue(fetchedQueue);
    } catch (error) {
      console.error("Error fetching reception queue:", error);
    } finally {
      setLoadingQueue(false);
    }
  }, [clinicId]);

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
      return true;
    } catch (error) {
      console.error("Booking failed:", error);
      // In a real app, display an error toast
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
                <h2 className="text-2xl font-bold text-slate-800">{t.patientsQueue}</h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setIsQrScanModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                        <QrCodeIcon className="h-5 w-5 mr-2" />
                        {t['reception.scanQr']}
                    </button>
                    <button 
                        onClick={openBookingModal}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                    >
                        {t['reception.addToQueue']}
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
                                <th scope="col" className="px-4 py-3">{t.time}</th>
                                <th scope="col" className="px-4 py-3">{t.roles[UserRole.Patient]}</th>
                                <th scope="col" className="px-4 py-3">{t.room}</th>
                                <th scope="col" className="px-4 py-3">{t.priority}</th>
                                <th scope="col" className="px-4 py-3">{t.status}</th>
                                <th scope="col" className="px-4 py-3">{t.complaints}</th>
                                <th scope="col" className="px-4 py-3">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map(item => <QueueItemRow key={item._id} item={item} t={t} permissions={permissions} />)}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-slate-500 text-center py-8">{t.noQueue}</p>
            )}
        </div>
    </div>
  );
};

export default ReceptionQueue;