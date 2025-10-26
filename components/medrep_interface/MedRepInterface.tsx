

import React, { useState, useEffect, useCallback } from 'react';
import { MedRepDash, MedRepTask, MedRepTaskStatus, MedRepChat, MedRepMessage, UserRole, Permissions, User, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, ArrowTrendingUpIcon, ClipboardCopyIcon, ChatBubbleLeftRightIcon, UserCircleIcon, CalendarIcon, CogIcon } from '../Icons';

interface MedRepInterfaceProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
  permissions: Permissions;
}

// FIX: Update 't' prop type in AddTaskModal to TranslationMap
interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (title: string, dueAt: string, relatedClinicId?: string) => Promise<void>;
    t: TranslationMap;
    isLoading: boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask, t, isLoading }) => {
    const [title, setTitle] = useState('');
    const [dueAt, setDueAt] = useState('');
    const [relatedClinicId, setRelatedClinicId] = useState(''); // Mock clinic ID
    const [clinics, setClinics] = useState<{_id: string, name: string}[]>([]); // Mock clinics

    useEffect(() => {
        // Mock fetching clinics
        const fetchMockClinics = async () => {
            await api.delay(200); // Simulate API call
            setClinics([
                { _id: 'clinic-01', name: 'Clinic Alpha' },
                { _id: 'clinic-02', name: 'Clinic Beta' },
                { _id: 'clinic-03', name: 'Clinic Gamma' },
            ]);
        };
        if (isOpen) {
            fetchMockClinics();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAddTask(title, dueAt, relatedClinicId || undefined);
        setTitle('');
        setDueAt('');
        setRelatedClinicId('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{t['medrep.addTask']}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-700">{t['medrep.newTaskTitle']}</label>
                            <input
                                type="text"
                                id="taskTitle"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">{t['medrep.dueDate']}</label>
                            <input
                                type="date"
                                id="dueDate"
                                value={dueAt}
                                onChange={(e) => setDueAt(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="relatedClinic" className="block text-sm font-medium text-slate-700">{t['medrep.clinic']}</label>
                            <select
                                id="relatedClinic"
                                value={relatedClinicId}
                                onChange={(e) => setRelatedClinicId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">{t['reception.selectRoomPrompt']}</option>
                                {clinics.map(clinic => (
                                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                            {t.close}
                        </button>
                        <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                            {isLoading && <LoadingIcon className="h-4 w-4 mr-2" />}
                            {t['medrep.addTask']}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MedRepInterface: React.FC<MedRepInterfaceProps> = ({ t, permissions }) => {
    // Hardcoded MedRep ID for demo purposes
    const medRepId = 'user-medrep-01'; 
    const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    const [kpis, setKpis] = useState<MedRepDash | null>(null);
    const [tasks, setTasks] = useState<MedRepTask[]>([]);
    const [chats, setChats] = useState<MedRepChat[]>([]);
    // FIX: Added users state to store fetched user information.
    const [users, setUsers] = useState<User[]>([]);
    const [selectedChat, setSelectedChat] = useState<MedRepChat | null>(null);
    const [newChatMessage, setNewChatMessage] = useState('');

    const [isLoadingKpis, setIsLoadingKpis] = useState(true);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    // FIX: Added loading state for users.
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | ''>('');

    const showToast = (message: string, type: 'success' | 'error') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('');
        }, 3000);
    };

    const fetchKpis = useCallback(async () => {
        setIsLoadingKpis(true);
        try {
            const fetchedKpis = await api.fetchMedRepKpis(medRepId, currentPeriod);
            setKpis(fetchedKpis);
        } catch (error) {
            console.error("Failed to fetch MedRep KPIs:", error);
            setKpis(null);
        } finally {
            setIsLoadingKpis(false);
        }
    }, [medRepId, currentPeriod]);

    const fetchTasks = useCallback(async () => {
        setIsLoadingTasks(true);
        try {
            const fetchedTasks = await api.fetchMedRepTasks(medRepId);
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Failed to fetch MedRep tasks:", error);
            setTasks([]);
        } finally {
            setIsLoadingTasks(false);
        }
    }, [medRepId]);

    const fetchChats = useCallback(async () => {
        setIsLoadingChats(true);
        try {
            const fetchedChats = await api.fetchMedRepChats(medRepId);
            setChats(fetchedChats);
            // If a chat was previously selected, try to re-select the updated version
            if (selectedChat) {
                const updatedSelectedChat = fetchedChats.find(c => c._id === selectedChat._id);
                setSelectedChat(updatedSelectedChat || null);
            }
        } catch (error) {
            console.error("Failed to fetch MedRep chats:", error);
            setChats([]);
        } finally {
            setIsLoadingChats(false);
        }
    }, [medRepId, selectedChat]);

    // FIX: Added fetchUsers function to load all users for chat participant names.
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const fetchedUsers = await api.fetchUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        if (!permissions.canAccessMedRep) return;
        fetchKpis();
        fetchTasks();
        fetchChats();
        fetchUsers(); // FIX: Call fetchUsers here

        const unsubscribe = api.subscribeToWs('medrep', (event) => {
            console.log('MedRep WS Event Received:', event);
            if (event.type === 'medrep.kpi.updated') {
                if (event.payload.userId === medRepId && event.payload.period === currentPeriod) {
                    setKpis(event.payload);
                }
            } else if (event.type === 'medrep.task.created' || event.type === 'medrep.task.updated') {
                if (event.payload.repId === medRepId) {
                    fetchTasks(); // Re-fetch all tasks for simplicity
                }
            } else if (event.type === 'medrep.chat.msg') {
                // FIX: Check if chat belongs to this medrep without using `chats` directly from state
                // This avoids stale closure and unnecessary re-renders in the effect's dependency array.
                // A better approach for real-time updates might involve patching the chat locally
                // or fetching specific chat if the payload includes enough info. For simplicity, refetch all.
                // Assuming all chats for `medRepId` are updated, just refetch all chats.
                fetchChats(); 
            }
        });
        // FIX: Removed `chats` from dependency array and added `fetchUsers`
        return () => unsubscribe();
    }, [medRepId, currentPeriod, permissions.canAccessMedRep, fetchKpis, fetchTasks, fetchChats, fetchUsers]);

    const handleAddTask = async (title: string, dueAt: string, relatedClinicId?: string) => {
        setIsAddingTask(true);
        try {
            await api.addMedRepTask(medRepId, title, dueAt, relatedClinicId);
            showToast(t['medrep.taskAddedSuccess'], 'success');
        } catch (error) {
            console.error(t['medrep.taskActionError'], error);
            showToast(t['medrep.taskActionError'], 'error');
        } finally {
            setIsAddingTask(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, status: MedRepTaskStatus) => {
        try {
            await api.updateMedRepTaskStatus(taskId, status);
            showToast(t['medrep.taskUpdatedSuccess'], 'success');
        } catch (error) {
            console.error(t['medrep.taskActionError'], error);
            showToast(t['medrep.taskActionError'], 'error');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChat || !newChatMessage.trim()) return;

        setIsSendingMessage(true);
        try {
            await api.sendMedRepChatMessage(selectedChat._id, medRepId, newChatMessage.trim());
            setNewChatMessage('');
            // Chat update will be handled by WS, so fetchChats will be triggered.
        } catch (error) {
            console.error("Error sending message:", error);
            showToast("Failed to send message.", 'error');
        } finally {
            setIsSendingMessage(false);
        }
    };

    if (!permissions.canAccessMedRep) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                    {/* FIX: Replaced ClipboardDocumentCheckIcon with ClipboardCopyIcon */}
                    <ClipboardCopyIcon className="w-7 h-7 mr-3 text-blue-600"/>
                    {t['medrep.title']}
                </h2>
                <p className="text-red-500 font-semibold">{t.unauthorized}</p>
            </div>
        );
    }

    const renderKpis = () => {
        if (isLoadingKpis) return <div className="flex justify-center items-center h-48"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>;
        if (!kpis) return <p className="text-center py-8 text-slate-500">{t['medrep.noKpis']}</p>;

        const referralConversionRate = kpis.kpis.referrals.accepted > 0 ? (kpis.kpis.referrals.converted / kpis.kpis.referrals.accepted * 100).toFixed(1) : 0;
        const planFactReferrals = kpis.plan.referrals > 0 ? (kpis.actual.referrals / kpis.plan.referrals * 100).toFixed(1) : 0;
        const planFactRevenue = kpis.plan.revenue > 0 ? (kpis.actual.revenue / kpis.plan.revenue * 100).toFixed(1) : 0;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referral Funnel */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <h3 className="font-bold text-slate-800 mb-3">{t['medrep.referralFunnel']}</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>{t.roles[UserRole.Referrer] + ' ' + t.total}:</span> <span className="font-semibold">{kpis.kpis.referrals.total}</span></div>
                        <div className="flex justify-between"><span>{t.roles[UserRole.Referrer] + ' ' + t.status + ' ' + t['ref.status.yellow']}:</span> <span className="font-semibold">{kpis.kpis.referrals.accepted}</span></div>
                        <div className="flex justify-between"><span>{t.roles[UserRole.Referrer] + ' ' + t.status + ' ' + t['ref.status.green']}:</span> <span className="font-semibold">{kpis.kpis.referrals.converted}</span></div>
                        <div className="flex justify-between pt-2 border-t mt-2"><span>Conversion Rate:</span> <span className="font-bold text-blue-600">{referralConversionRate}%</span></div>
                    </div>
                </div>
                {/* Plan/Actual */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <h3 className="font-bold text-slate-800 mb-3">{t['medrep.planFact']} ({currentPeriod})</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>{t.referrals} (Plan/Actual):</span>
                            <span className="font-semibold">{kpis.plan.referrals} / {kpis.actual.referrals} ({planFactReferrals}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(planFactReferrals || '0'))}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-4">
                            {/* FIX: Updated from t.finances to t['general.finances'] */}
                            <span>{t['general.finances']} (Plan/Actual):</span>
                            <span className="font-semibold">${kpis.plan.revenue.toFixed(0)} / ${kpis.actual.revenue.toFixed(0)} ({planFactRevenue}%)</span>
                        </div>
                         <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(planFactRevenue || '0'))}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTasks = () => {
        if (isLoadingTasks) return <div className="flex justify-center items-center h-48"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>;
        if (tasks.length === 0) return <p className="text-center py-8 text-slate-500">{t['medrep.noTasks']}</p>;

        const tasksByStatus = tasks.reduce((acc, task) => {
            if (!acc[task.status]) acc[task.status] = [];
            acc[task.status].push(task);
            return acc;
        }, {} as Record<MedRepTaskStatus, MedRepTask[]>);

        const statusOrder = [MedRepTaskStatus.Todo, MedRepTaskStatus.Doing, MedRepTaskStatus.Done];

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statusOrder.map(status => (
                    <div key={status} className="bg-slate-50 p-4 rounded-lg border min-h-[200px]">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                            <CogIcon className="w-5 h-5 mr-2 text-slate-600"/>
                            {t[`medrep.taskStatus.${status}`]} ({tasksByStatus[status]?.length || 0})
                        </h3>
                        <div className="space-y-3">
                            {tasksByStatus[status]?.sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).map(task => (
                                <div key={task._id} className="bg-white p-3 rounded-md shadow-sm border border-slate-200">
                                    <p className="font-medium text-slate-800 text-sm">{task.title}</p>
                                    <p className="text-xs text-slate-500 flex items-center mt-1">
                                        <CalendarIcon className="w-3 h-3 mr-1"/> {new Date(task.dueAt).toLocaleDateString()}
                                        {task.relatedClinicId && <span className="ml-2 px-1 py-0.5 bg-blue-50 text-blue-700 rounded-sm text-xs">Clinic {task.relatedClinicId.slice(-2)}</span>}
                                    </p>
                                    <div className="mt-2 flex space-x-2">
                                        {status !== MedRepTaskStatus.Done && (
                                            <button
                                                onClick={() => handleUpdateTaskStatus(task._id, MedRepTaskStatus.Done)}
                                                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                                            >
                                                {t['medrep.completeTask']}
                                            </button>
                                        )}
                                        {status === MedRepTaskStatus.Todo && (
                                            <button
                                                onClick={() => handleUpdateTaskStatus(task._id, MedRepTaskStatus.Doing)}
                                                className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                                            >
                                                {t['inProgress']}
                                            </button>
                                        )}
                                        {status === MedRepTaskStatus.Doing && (
                                            <button
                                                onClick={() => handleUpdateTaskStatus(task._id, MedRepTaskStatus.Todo)}
                                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                                            >
                                                {t['queued']}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderChats = () => {
        if (isLoadingChats || isLoadingUsers) return <div className="flex justify-center items-center h-48"><LoadingIcon className="h-8 w-8 text-blue-600" /></div>;
        if (chats.length === 0) return <p className="text-center py-8 text-slate-500">{t['medrep.noChats']}</p>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                {/* Chat List */}
                <div className="bg-slate-50 p-4 rounded-lg border overflow-y-auto">
                    <h3 className="font-bold text-slate-800 mb-3">{t['medrep.chats']}</h3>
                    <div className="space-y-2">
                        {chats.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(chat => (
                            <button
                                key={chat._id}
                                onClick={() => setSelectedChat(chat)}
                                className={`w-full text-left p-3 rounded-md transition-colors ${selectedChat?._id === chat._id ? 'bg-blue-100' : 'hover:bg-white'}`}
                            >
                                <p className="font-semibold text-slate-800 text-sm">{chat.topic}</p>
                                <p className="text-xs text-slate-500 truncate mt-1">
                                    {chat.messages[chat.messages.length - 1]?.text || t['medrep.noMessages']}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border flex flex-col">
                    {selectedChat ? (
                        <>
                            <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">
                                {t['medrep.chatPanelTitle'].replace('{{topic}}', selectedChat.topic)}
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-3 p-2">
                                {selectedChat.messages.length > 0 ? (
                                    selectedChat.messages.map(message => (
                                        <div key={message._id} className={`flex ${message.senderId === medRepId ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-lg ${message.senderId === medRepId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                <p className="font-semibold text-xs mb-1">
                                                    {/* FIX: Use the fetched `users` state to find the sender's name */}
                                                    {message.senderId === medRepId ? 'You' : users.find(u => u._id === message.senderId)?.name || t.roles[message.senderRole]}
                                                </p>
                                                <p className="text-sm">{message.text}</p>
                                                <p className="text-xs opacity-75 text-right mt-1">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500">{t['medrep.noMessages']}</p>
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="mt-4 flex">
                                <input
                                    type="text"
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    placeholder={t['medrep.chatInputPlaceholder']}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSendingMessage}
                                />
                                <button
                                    type="submit"
                                    disabled={isSendingMessage || !newChatMessage.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                                >
                                    {isSendingMessage && <LoadingIcon className="h-4 w-4 mr-2" />}
                                    {t['medrep.sendMessage']}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-slate-300"/>
                            <p>{t['medrep.selectChatPrompt']}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 p-3 rounded-md shadow-lg transition-opacity duration-300 ${toastType === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {toastMessage}
                </div>
            )}
            <AddTaskModal
                isOpen={showAddTaskModal}
                onClose={() => setShowAddTaskModal(false)}
                onAddTask={handleAddTask}
                t={t}
                isLoading={isAddingTask}
            />

            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                <ArrowTrendingUpIcon className="w-7 h-7 mr-3 text-blue-600"/>
                {t['medrep.title']}
            </h2>
            <p className="text-slate-600 mb-6">
                {t['medrep.title'] === 'MedRep Interface' ? 'Monitor your referral activity, manage tasks, and communicate with clinics.' : 'Отслеживайте активность по направлениям, управляйте задачами и общайтесь с клиниками.'}
            </p>

            {/* KPI Section */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-blue-600"/>
                    {t['medrep.kpis']}
                </h3>
                {renderKpis()}
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <ClipboardCopyIcon className="w-6 h-6 mr-2 text-blue-600"/>
                        {t['medrep.tasks']}
                    </h3>
                    <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isAddingTask && <LoadingIcon className="h-4 w-4 mr-2" />}
                        {t['medrep.addTask']}
                    </button>
                </div>
                {renderTasks()}
            </div>

            {/* Chats Section */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-blue-600"/>
                    {t['medrep.chats']}
                </h3>
                {renderChats()}
            </div>
        </div>
    );
};

export default MedRepInterface;