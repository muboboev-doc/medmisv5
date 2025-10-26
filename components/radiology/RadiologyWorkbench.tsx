
import React, { useState, useEffect, useCallback } from 'react';
import { Study, StudyDetails, Priority, FileMetadata, UserRole } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, DocumentTextIcon, FilmIcon, UserCircleIcon } from '../Icons';

interface RadiologyWorkbenchProps {
  t: Record<string, string>;
}

const InboxItem: React.FC<{ study: Study, isSelected: boolean, onSelect: (id: string) => void }> = ({ study, isSelected, onSelect }) => (
    <button
        onClick={() => onSelect(study._id)}
        className={`w-full text-left p-3 rounded-md transition-colors ${isSelected ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
    >
        <p className="font-semibold text-sm text-slate-800">Study #{study._id.slice(-6)}</p>
        <p className="text-xs text-slate-500">{study.modality}</p>
        <p className="text-xs text-slate-500 mt-1">
            {new Date(study.startedAt || Date.now()).toLocaleDateString()}
        </p>
    </button>
);

const DetailPanel: React.FC<{ details: StudyDetails, t: Record<string, string> }> = ({ details, t }) => {
    const priorityClasses: Record<Priority, string> = {
        [Priority.SR]: 'bg-red-100 text-red-800',
        [Priority.STD]: 'bg-blue-100 text-blue-800',
        [Priority.PLN]: 'bg-green-100 text-green-800',
    };
    
    const FileList: React.FC<{files: FileMetadata[], type: 'dicom' | 'doc'}> = ({files, type}) => (
        <div className="space-y-2">
            {files.length > 0 ? files.map(file => (
                <div key={file.id} className="bg-slate-50 p-2 rounded-md flex items-center justify-between text-sm">
                    <div className="flex items-center">
                        {type === 'dicom' ? <FilmIcon className="w-4 h-4 mr-2 text-slate-500"/> : <DocumentTextIcon className="w-4 h-4 mr-2 text-slate-500"/>}
                        <span className="font-medium text-slate-700">{file.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{file.size.toFixed(2)} MB</span>
                </div>
            )) : <p className="text-sm text-slate-500 italic">{t['radiology.noFiles']}</p>}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Patient Info */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{t['radiology.patientInfo']}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                    <div>
                        <p className="text-slate-500">{t['radiology.maskedName']}</p>
                        <p className="font-semibold text-slate-900">{details.patient.maskedName}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">{t['radiology.age']}</p>
                        <p className="font-semibold text-slate-900">{details.patient.age || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">{t['radiology.priority']}</p>
                        <p className="font-semibold">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityClasses[details.queueItem.priority]}`}>
                                {t[`reception.priority.${details.queueItem.priority.toLowerCase()}`]}
                            </span>
                        </p>
                    </div>
                     <div>
                        <p className="text-slate-500">{t['radiology.status']}</p>
                        <p className="font-semibold text-slate-900">{t[details.status] || details.status}</p>
                    </div>
                </div>
            </div>

             {/* Study Info */}
            <div>
                 <div className="flex items-center text-sm text-slate-600 mb-3">
                    <UserCircleIcon className="w-5 h-5 mr-2 text-slate-400"/>
                    <span>{t['radiology.assignedTo']}: <span className="font-semibold">{details.radiologistName || 'Unassigned'}</span></span>
                </div>
                <div className="text-sm">
                    <p className="text-slate-500 font-medium">{t['radiology.complaints']}</p>
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg mt-1 border">{details.queueItem.complaints}</p>
                </div>
            </div>

            {/* Files */}
            <div className="space-y-4">
                 <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><FilmIcon className="w-5 h-5 mr-2 text-blue-600"/>{t['radiology.dicomFiles']}</h4>
                    <FileList files={details.dicom.objects} type="dicom"/>
                </div>
                 <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><DocumentTextIcon className="w-5 h-5 mr-2 text-green-600"/>{t['radiology.documents']}</h4>
                    <FileList files={details.docs} type="doc"/>
                </div>
            </div>
        </div>
    );
};

const RadiologyWorkbench: React.FC<RadiologyWorkbenchProps> = ({ t }) => {
    const [inbox, setInbox] = useState<Study[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
    const [studyDetails, setStudyDetails] = useState<StudyDetails | null>(null);
    const [isInboxLoading, setIsInboxLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    useEffect(() => {
        const getInbox = async () => {
            setIsInboxLoading(true);
            try {
                const fetchedInbox = await api.fetchRadiologyInbox();
                setInbox(fetchedInbox);
            } catch (error) {
                console.error("Error fetching radiology inbox:", error);
            } finally {
                setIsInboxLoading(false);
            }
        };
        getInbox();
    }, []);

    const handleSelectStudy = useCallback(async (studyId: string) => {
        setSelectedStudyId(studyId);
        setIsDetailsLoading(true);
        setStudyDetails(null);
        try {
            const details = await api.fetchStudyDetails(studyId);
            setStudyDetails(details);
        } catch (error) {
            console.error("Error fetching study details:", error);
        } finally {
            setIsDetailsLoading(false);
        }
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] flex overflow-hidden">
            {/* Left Panel: Inbox */}
            <div className="w-1/3 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">{t['radiology.inbox']}</h2>
                </div>
                <div className="overflow-y-auto p-2">
                    {isInboxLoading ? (
                        <div className="flex justify-center items-center h-64"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>
                    ) : inbox.length > 0 ? (
                        inbox.map(study => (
                            <InboxItem key={study._id} study={study} isSelected={selectedStudyId === study._id} onSelect={handleSelectStudy} />
                        ))
                    ) : (
                        <p className="p-4 text-center text-sm text-slate-500">No studies ready for reporting.</p>
                    )}
                </div>
            </div>

            {/* Right Panel: Details */}
            <div className="w-2/3 p-6 overflow-y-auto">
                 <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-200">{t['radiology.studyDetails']}</h2>
                {isDetailsLoading ? (
                    <div className="flex justify-center items-center h-64"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>
                ) : studyDetails ? (
                    <DetailPanel details={studyDetails} t={t} />
                ) : (
                    <div className="text-center text-slate-500 pt-16">
                         <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-300 mb-4"/>
                        <p>{t['radiology.selectStudy']}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RadiologyWorkbench;