

import React, { useState } from 'react';
import * as api from '../../services/api';
import { LoadingIcon } from '../Icons';
import { Referral, ReferralStatus, TranslationMap } from '../../types';

interface QrScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (referral: Referral) => void;
    // FIX: Use TranslationMap for 't' prop
    t: TranslationMap;
}

const QrScanModal: React.FC<QrScanModalProps> = ({ isOpen, onClose, onScan, t }) => {
    const [qrCode, setQrCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const decodedData = await api.decodeQrCode(qrCode);
            if (decodedData) {
                const referral: Referral = {
                    _id: decodedData._id,
                    referrerId: decodedData.referrerId,
                    clinicId: decodedData.clinicId,
                    roomId: decodedData.roomId,
                    patientHint: {
                        name: decodedData.patientDetails.name,
                        complaint: decodedData.complaints,
                    },
                    // Fill in missing properties with default values as they are not available from the QR scan mock.
                    slotId: '',
                    qrCode: qrCode,
                    shortCode: '',
                    status: ReferralStatus.Yellow,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                onScan(referral);
            } else {
                setError('Referral not found. Please check the code.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setQrCode('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{t['reception.scanQrTitle']}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="qrCode" className="block text-sm font-medium text-slate-700">{t['reception.qrInputLabel']}</label>
                            <input
                                type="text"
                                id="qrCode"
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., QR-REF-001"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                            {t.close}
                        </button>
                        <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                            {isLoading && <LoadingIcon className="h-4 w-4 mr-2" />}
                            {t['reception.qrSubmit']}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QrScanModal;