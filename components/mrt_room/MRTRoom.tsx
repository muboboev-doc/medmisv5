

import React, { useState, useEffect, useCallback } from 'react';
import { QueueItem, Study, Room, Priority, QueueStatus, StudyStatus, FileMetadata, UserRole } from '../../types';
import * as api from '../../services/api';
import { ClockIcon, DocumentTextIcon, FilmIcon, LoadingIcon } from '../Icons';

interface MRTRoomProps {
  t: Record<string, string>;
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    study: Study;
    t: Record<string, string>;
    onUpload: (studyId: string, file: Omit<FileMetadata, 'id' | 'uploadedAt'>) => Promise<void>;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, study, t, onUpload }) => {
    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState('');
    const [fileType, setFileType] = useState<'dicom' | 'doc'>('dicom');
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        const newFile = {
            name: fileName,
            size: parseFloat(fileSize) || 0,
            contentType: fileType === 'dicom' ? 'application/dicom' : 'application/pdf',
            signedUrl: `https://mockstorage.com/${fileName}`
        };
        await onUpload(study._id, newFile);
        setIsUploading(false);
        setFileName('');
        setFileSize('');
    };

    const totalSizeMB = (study.dicom.totalSize + study.docs.reduce((sum, doc) => sum + doc.size, 0)).toFixed(2);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{t['mrt.upload.title']}</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold mb-2">{t['mrt.upload.count'].replace('{{count}}', (study.dicom.objects.length + study.docs.length).toString())}</h4>
                        <p className="text-sm text-slate-500 mb-4">{t['mrt.upload.totalSize'].replace('{{size}}', totalSizeMB)}</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {study.dicom.objects.map(f => <div key={f.id} className="text-xs p-2 bg-slate-50 rounded flex justify-between items-center"><span><FilmIcon className="w-4 h-4 inline mr-2"/>{f.name}</span><span>{f.size} MB</span></div>)}
                           {study.docs.map(f => <div key={f.id} className="text-xs p-2 bg-slate-50 rounded flex justify-between items-center"><span><DocumentTextIcon className="w-4 h-4 inline mr-2"/>{f.name}</span><span>{f.size} MB</span></div>)}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t['mrt.upload.fileType']}</label>
                            <div className="mt-1 flex rounded-md">
                                <button type="button" onClick={() => setFileType('dicom')} className={`px-4 py-2 text-sm rounded-l-md ${fileType === 'dicom' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>DICOM</button>
                                <button type="button" onClick={() => setFileType('doc')} className={`px-4 py-2 text-sm rounded-r-md ${fileType === 'doc' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>Document</button>
                            </div>
                         </div>
                        <div>
                           <label htmlFor="fileName" className="block text-sm font-medium text-slate-700">{t['mrt.upload.fileName']}</label>
                           <input id="fileName" type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="mt-1 w-full p-2 border rounded" required/>
                        </div>
                         <div>
                           <label htmlFor="fileSize" className="block text-sm font-medium text-slate-700">{t['mrt.upload.fileSize']}</label>
                           <input id="fileSize" type="number" value={fileSize} onChange={e => setFileSize(e.target.value)} className="mt-1 w-full p-2 border rounded" required/>
                        </div>
                        <button type="submit" disabled={isUploading} className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center">
                            {isUploading && <LoadingIcon className="h-4 w-4 mr-2"/>}
                            {t['mrt.upload.add']}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white border rounded">{t.close}</button>
                </div>
            </div>
        </div>
    );
};

interface PatientCardProps {
    queueItem: QueueItem;
    study: Study | undefined;
    t: Record<string, string>;
    onAction: (action: 'start' | 'upload' | 'finish' | 'noShow', queueItemId: string, studyId?: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ queueItem, study, t, onAction }) => {
    const { patient, startAt, priority, status } = queueItem;

    const priorityClasses: Record<Priority, string> = {
        [Priority.SR]: 'bg-red-100 text-red-800 border-red-300',
        [Priority.STD]: 'bg-blue-100 text-blue-800 border-blue-300',
        [Priority.PLN]: 'bg-green-100 text-green-800 border-green-300',
    };

    const statusClasses: Record<string, string> = {
        [QueueStatus.Queued]: 'text-slate-500',
        [QueueStatus.InProgress]: 'text-yellow-600',
        [QueueStatus.Described]: 'text-indigo-600',
        [QueueStatus.NoShow]: 'text-gray-500',
    };
    
    const dicomCount = study?.dicom.objects.length || 0;
    const docCount = study?.docs.length || 0;
    const fileCount = dicomCount + docCount;

    return (
        <div className="bg-white rounded-lg shadow-sm border flex flex-col justify-between">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-slate-800">{patient.maskedName}</p>
                        <p className="text-sm text-slate-500 flex items-center mt-1"><ClockIcon className="w-4 h-4 mr-1.5"/>{startAt}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${priorityClasses[priority]}`}>
                        {t[`reception.priority.${priority.toLowerCase()}`] || priority}
                    </span>
                </div>
                <div className="mt-4 text-sm">
                    <p className={`font-semibold ${statusClasses[status] || 'text-slate-500'}`}>{t[status.replace('_', '')] || status}</p>
                    {study?.status === StudyStatus.Uploaded && (
                         <p className="text-xs text-green-600 mt-1">{t['mrt.upload.count'].replace('{{count}}', fileCount.toString())}</p>
                    )}
                </div>
            </div>
            <div className="bg-slate-50 p-3 flex flex-wrap gap-2 justify-start border-t">
                {status === QueueStatus.Queued && (
                    <button onClick={() => onAction('start', queueItem._id)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        {t['mrt.start']}
                    </button>
                )}
                {status === QueueStatus.InProgress && study && (
                    <>
                        <button onClick={() => onAction('upload', queueItem._id, study._id)} className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                            {t['mrt.attach']}
                        </button>
                        <button onClick={() => onAction('finish', queueItem._id, study._id)} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            {t['mrt.complete']}
                        </button>
                    </>
                )}
                 {status === QueueStatus.Queued && (
                      <button onClick={() => onAction('noShow', queueItem._id)} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">
                        {t['mrt.noShow']}
                    </button>
                 )}
            </div>
        </div>
    );
};

const MRTRoom: React.FC<MRTRoomProps> = ({ t }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [studies, setStudies] = useState<Record<string, Study>>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
    
    // Simulate operator having access to specific rooms
    const operatorRooms = useCallback(() => rooms.filter(r => [UserRole.MrtOperator, UserRole.Manager].includes(UserRole.MrtOperator) && (r.modality === 'MRI' || r.modality === 'CT')), [rooms]);

    useEffect(() => {
        api.fetchRooms('clinic-01').then(fetchedRooms => {
            setRooms(fetchedRooms);
            const opRooms = fetchedRooms.filter(r => r.modality === 'MRI' || r.modality === 'CT');
            if(opRooms.length > 0) {
                setSelectedRoomId(opRooms[0]._id);
            } else {
                setLoading(false);
            }
        });
    }, []);

    const fetchData = useCallback(async (roomId: string) => {
        if (!roomId) return;
        setLoading(true);
        try {
            const { queue: fetchedQueue, studies: fetchedStudies } = await api.fetchMrtQueue(roomId, new Date());
            setQueue(fetchedQueue);
            setStudies(fetchedStudies.reduce((acc, study) => ({...acc, [study._id]: study}), {}));
        } catch (error) {
            console.error("Failed to fetch MRT queue:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedRoomId);
    }, [selectedRoomId, fetchData]);
    
    useEffect(() => {
        const handleWsEvent = (event: { type: string; payload: any; roomId?: string }) => {
            if (event.roomId && event.roomId !== selectedRoomId) return; // Only listen for events for the selected room
            console.log("MRT WS Event:", event.type, event.payload);
            // Re-fetch data on any relevant event for simplicity
            fetchData(selectedRoomId);
        };

        const unsubscribe = api.subscribeToWs('mrt', handleWsEvent);
        return () => unsubscribe();
    }, [selectedRoomId, fetchData]);

    const handleAction = async (action: 'start' | 'upload' | 'finish' | 'noShow', queueItemId: string, studyId?: string) => {
        try {
            switch(action) {
                case 'start':
                    await api.startStudy(queueItemId, 'user-mrt-01'); // Hardcoded operatorId
                    break;
                case 'upload':
                    if(studyId && studies[studyId]) {
                        setSelectedStudy(studies[studyId]);
                        setIsModalOpen(true);
                    }
                    break;
                case 'finish':
                     if (studyId) await api.finishStudy(studyId);
                    break;
                case 'noShow':
                    await api.updateQueueItemStatus(queueItemId, QueueStatus.NoShow);
                    break;
            }
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
        }
    };
    
    const handleUpload = async (studyId: string, file: Omit<FileMetadata, 'id' | 'uploadedAt'>) => {
        try {
            const updatedStudy = await api.uploadToStudy(studyId, file);
            setStudies(prev => ({...prev, [updatedStudy._id]: updatedStudy}));
            setSelectedStudy(updatedStudy); // Keep modal open with updated file list
        } catch (error) {
            console.error("Upload failed:", error);
        }
    }

    return (
        <div className="space-y-6">
            {selectedStudy && <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} study={selectedStudy} t={t} onUpload={handleUpload} />}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between md:items-center">
                <h2 className="text-2xl font-bold text-slate-800">{t['mrt.title']}</h2>
                <div>
                     <label htmlFor="room-select" className="sr-only">{t['mrt.selectRoom']}</label>
                     <select 
                        id="room-select" 
                        value={selectedRoomId} 
                        onChange={e => setSelectedRoomId(e.target.value)}
                        className="mt-2 md:mt-0 p-2 border rounded-md bg-slate-50"
                    >
                         <option value="" disabled>{t['mrt.selectRoom']}</option>
                         {operatorRooms().map(room => (
                             <option key={room._id} value={room._id}>{room.name}</option>
                         ))}
                     </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>
            ) : queue.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {queue.map(item => (
                        <PatientCard 
                            key={item._id}
                            queueItem={item}
                            study={item.studyId ? studies[item.studyId] : undefined}
                            t={t}
                            onAction={handleAction}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 text-center py-8">{t['mrt.noPatients']}</p>
            )}
        </div>
    );
};

export default MRTRoom;