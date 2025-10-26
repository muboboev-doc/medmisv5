

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Import TranslationMap for correct typing of 't' prop.
import { FileMetadata, DicomPolicy, UserRole, Permissions, TranslationMap } from '../../types';
// FIX: Corrected import statement
import * as api from '../../services/api';
// FIX: Replaced DocumentMagnifyingGlassIcon with SearchIcon which is already defined.
import { LoadingIcon, FilmIcon, DocumentTextIcon, KeyIcon, ArrowUpTrayIcon, SearchIcon, ClipboardCopyIcon } from '../Icons';

interface DicomHubProps {
  // FIX: Change 't' prop type to TranslationMap for correct type checking.
  t: TranslationMap;
  permissions: Permissions;
}

type DicomHubTab = 'studyFiles' | 'accessPolicies';

// FIX: Change 't' prop type to TranslationMap in UploadFileModalProps.
interface UploadFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (studyId: string, fileName: string, fileSize: number, fileType: 'dicom' | 'doc') => Promise<void>;
    studyId: string;
    t: TranslationMap;
    isLoading: boolean;
    initialFileType?: 'dicom' | 'doc'; // New prop
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ isOpen, onClose, onUpload, studyId, t, isLoading, initialFileType }) => {
    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState('');
    const [fileType, setFileType] = useState<'dicom' | 'doc'>(initialFileType || 'dicom'); // Use initialFileType

    useEffect(() => {
        if (isOpen) {
            setFileType(initialFileType || 'dicom'); // Reset on open or if initial type changes
        }
    }, [isOpen, initialFileType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studyId) {
            alert("Please enter a Study ID first."); // Replace with toast
            return;
        }
        await onUpload(studyId, fileName, parseFloat(fileSize), fileType);
        setFileName('');
        setFileSize('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{t['dicomhub.uploadNewFile']}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t['dicomhub.fileType']}</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <button type="button" onClick={() => setFileType('dicom')} className={`px-4 py-2 text-sm rounded-l-md ${fileType === 'dicom' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>DICOM</button>
                                <button type="button" onClick={() => setFileType('doc')} className={`px-4 py-2 text-sm rounded-r-md ${fileType === 'doc' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>Document</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="fileName" className="block text-sm font-medium text-slate-700">{t['dicomhub.fileName']}</label>
                            <input
                                type="text"
                                id="fileName"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="fileSize" className="block text-sm font-medium text-slate-700">{t['dicomhub.fileSize']}</label>
                            <input
                                type="number"
                                id="fileSize"
                                value={fileSize}
                                onChange={(e) => setFileSize(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                            {t.close}
                        </button>
                        <button type="submit" disabled={isLoading || !studyId} className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                            {isLoading && <LoadingIcon className="h-4 w-4 mr-2" />}
                            {t['dicomhub.uploadFile']}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const DicomHub: React.FC<DicomHubProps> = ({ t, permissions }) => {
    const [activeTab, setActiveTab] = useState<DicomHubTab>('studyFiles');
    const [studyId, setStudyId] = useState('');
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [policies, setPolicies] = useState<DicomPolicy[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
    const [isSavingPolicies, setIsSavingPolicies] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadModalInitialFileType, setUploadModalInitialFileType] = useState<'dicom' | 'doc'>('dicom'); // New state
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    const fetchFiles = useCallback(async (currentStudyId: string) => {
        if (!currentStudyId) {
            setFiles([]);
            return;
        }
        setIsLoadingFiles(true);
        try {
            const fetchedFiles = await api.fetchStudyDicomObjects(currentStudyId);
            setFiles(fetchedFiles);
        } catch (error) {
            console.error("Failed to fetch DICOM objects:", error);
            setFiles([]);
            setErrorMessage(t['dicomhub.noFiles'] as string);
        } finally {
            // Corrected: Use setIsLoadingFiles instead of undefined setIsLoading
            setIsLoadingFiles(false);
        }
    }, [t]);

    const fetchPolicies = useCallback(async () => {
        setIsLoadingPolicies(true);
        try {
            const fetchedPolicies = await api.fetchDicomPolicies();
            setPolicies(fetchedPolicies);
        } catch (error) {
            console.error("Failed to fetch DICOM policies:", error);
            setPolicies([]);
        } finally {
            setIsLoadingPolicies(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'studyFiles') {
            fetchFiles(studyId);
        } else {
            fetchPolicies();
        }

        const unsubscribe = api.subscribeToWs('dicom', (event) => {
            console.log("DICOM WS Event:", event.type, event.payload);
            if (activeTab === 'studyFiles') {
                if (event.type === 'dicom.uploaded' && event.payload.studyId === studyId) {
                    fetchFiles(studyId);
                } else if (event.type === 'dicom.linkRevoked' && event.payload.id && files.some(f => f.id === event.payload.id)) {
                    // Update only the specific file's status to avoid full refetch
                    setFiles(prev => prev.map(f => f.id === event.payload.id ? event.payload : f));
                }
            } else { // activeTab === 'accessPolicies'
                if (event.type === 'policy.updated') {
                    fetchPolicies();
                }
            }
        });

        return () => unsubscribe();
    }, [activeTab, studyId, files, fetchFiles, fetchPolicies]); // Added `files` to dependencies for the linkRevoked event to work correctly

    const handleUploadFile = async (selectedStudyId: string, fileName: string, fileSize: number, fileType: 'dicom' | 'doc') => {
        setIsUploadingFile(true);
        setErrorMessage('');
        try {
            const newFile: Omit<FileMetadata, 'id' | 'uploadedAt' | 'signedUrl'> = {
                name: fileName,
                size: fileSize,
                contentType: fileType === 'dicom' ? 'application/dicom' : 'application/pdf',
                storageKey: `path/to/study/${selectedStudyId}/${fileName}`, // Mock storage key
            };
            await api.uploadDicomFile(selectedStudyId, newFile);
            setSuccessMessage(t['dicomhub.uploadSuccess'] as string);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
            fetchFiles(selectedStudyId); // Refresh file list
        } catch (error) {
            console.error("Error uploading file:", error);
            setErrorMessage(t['dicomhub.uploadError'] as string);
        } finally {
            setIsUploadingFile(false);
        }
    };

    const handleRevokeLink = async (fileId: string) => {
        if (!window.confirm(t['dicomhub.revokeConfirm'] as string)) return;
        setErrorMessage('');
        try {
            await api.revokeDicomLink(fileId);
            setSuccessMessage(t['dicomhub.revokeSuccess'] as string);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
            // Fetch files will be triggered by WS event from `api.ts`
        } catch (error) {
            console.error("Error revoking link:", error);
            setErrorMessage(t['dicomhub.revokeError'] as string);
        }
    };

    const handlePolicyChange = (role: UserRole, field: 'canView' | 'canUpload', value: boolean) => {
        setPolicies(prev => prev.map(p =>
            p.role === role ? { ...p, [field]: value } : p
        ));
    };

    const handleSavePolicies = async () => {
        setIsSavingPolicies(true);
        setErrorMessage('');
        try {
            await Promise.all(policies.map(policy => api.updateDicomPolicy(policy)));
            setSuccessMessage(t['dicomhub.policySaved'] as string);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            console.error("Error saving policies:", error);
            setErrorMessage("Failed to save policies.");
        } finally {
            setIsSavingPolicies(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedLink(text);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    const renderStudyFilesTab = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <label htmlFor="studyIdInput" className="sr-only">{t['dicomhub.studyIdInput']}</label>
                <div className="relative flex-grow">
                    <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        id="studyIdInput"
                        value={studyId}
                        onChange={(e) => setStudyId(e.target.value)}
                        placeholder={t['dicomhub.studyIdInput'] as string}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                {permissions.canUploadDicom && (
                    <>
                        <button
                            onClick={() => { setUploadModalInitialFileType('dicom'); setShowUploadModal(true); }}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                        >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                            {t['dicomhub.uploadDicom']}
                        </button>
                        <button
                            onClick={() => { setUploadModalInitialFileType('doc'); setShowUploadModal(true); }}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                        >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                            {t['dicomhub.uploadDocument']}
                        </button>
                    </>
                )}
            </div>

            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

            {studyId && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">
                        {(t['dicomhub.fileList'] as string).replace('{{studyId}}', studyId.slice(-6))}
                    </h3>
                    {isLoadingFiles ? (
                        <div className="flex justify-center items-center h-48"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>
                    ) : files.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                                    <tr>
                                        <th className="p-3 text-left">{t['dicomhub.fileName']}</th>
                                        <th className="p-3 text-left">{t['dicomhub.fileType']}</th>
                                        <th className="p-3 text-right">{t['dicomhub.fileSize']}</th>
                                        <th className="p-3 text-left">{t['dicomhub.uploadedAt']}</th>
                                        <th className="p-3 text-left">{t['dicomhub.fileUrl']}</th>
                                        <th className="p-3 text-left">{t['dicomhub.status']}</th>
                                        <th className="p-3 text-left">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map(file => (
                                        <tr key={file.id} className="border-b hover:bg-slate-50">
                                            <td className="p-3 font-medium">{file.name}</td>
                                            <td className="p-3 text-slate-600">{file.contentType.includes('dicom') ? 'DICOM' : 'Document'}</td>
                                            <td className="p-3 text-right">{file.size.toFixed(2)} MB</td>
                                            <td className="p-3 text-slate-500">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                                            <td className="p-3 text-blue-600">
                                                {file.signedUrl && !file.isRevoked ? (
                                                    <div className="flex items-center space-x-1">
                                                        <a href={file.signedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{t['dicomhub.view']}</a>
                                                        <button onClick={() => handleCopy(file.signedUrl)} className="text-slate-500 hover:text-blue-600 relative">
                                                            {copiedLink === file.signedUrl ? <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span> : null}
                                                            <ClipboardCopyIcon className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500">{t['dicomhub.linkRevoked']}</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${file.isRevoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {file.isRevoked ? t['dicomhub.revoked'] : t['dicomhub.active']}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {!file.isRevoked && permissions.canManageDicomPolicies && (
                                                    <button onClick={() => handleRevokeLink(file.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                                                        {t['dicomhub.revokeLink']}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">{t['dicomhub.noFiles']}</p>
                    )}
                </div>
            )}
        </div>
    );

    const renderAccessPoliciesTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-xl font-bold text-slate-800">{t['dicomhub.accessPolicies']}</h3>
                <div className="flex items-center space-x-2">
                    {showSuccessToast && <span className="text-sm text-green-600">{t['dicomhub.policySaved']}</span>}
                    {errorMessage && <span className="text-sm text-red-600">{errorMessage}</span>}
                    {permissions.canManageDicomPolicies && (
                        <button onClick={handleSavePolicies} disabled={isSavingPolicies} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                            {isSavingPolicies && <LoadingIcon className="h-4 w-4 mr-2" />}
                            {t['dicomhub.savePolicies']}
                        </button>
                    )}
                </div>
            </div>

            {isLoadingPolicies ? (
                <div className="flex justify-center items-center h-48"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>
            ) : policies.length > 0 ? (
                <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                            <tr>
                                <th className="p-3 text-left">{t['dicomhub.role']}</th>
                                <th className="p-3 text-center">{t['dicomhub.canView']}</th>
                                <th className="p-3 text-center">{t['dicomhub.canUpload']}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {policies.map(policy => (
                                <tr key={policy.role} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-medium">{t.roles[policy.role] || policy.role}</td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={policy.canView}
                                            onChange={(e) => permissions.canManageDicomPolicies && handlePolicyChange(policy.role, 'canView', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={!permissions.canManageDicomPolicies}
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={policy.canUpload}
                                            onChange={(e) => permissions.canManageDicomPolicies && handlePolicyChange(policy.role, 'canUpload', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={!permissions.canManageDicomPolicies}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center py-8 text-slate-500">{t['dicomhub.noPolicies']}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <UploadFileModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUploadFile}
                studyId={studyId}
                t={t}
                isLoading={isUploadingFile}
                initialFileType={uploadModalInitialFileType}
            />

            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                <FilmIcon className="w-7 h-7 mr-3 text-blue-600" />
                {t['dicomhub.title']}
            </h2>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('studyFiles')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'studyFiles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t['dicomhub.studyFiles']}
                    </button>
                    <button
                        onClick={() => setActiveTab('accessPolicies')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'accessPolicies' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t['dicomhub.accessPolicies']}
                    </button>
                </nav>
            </div>

            {activeTab === 'studyFiles' ? renderStudyFilesTab() : renderAccessPoliciesTab()}
        </div>
    );
};

export default DicomHub;
