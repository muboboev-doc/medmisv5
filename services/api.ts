
import { Slot, UserRole, QueueItem, Priority, QueueStatus, Patient, Room, Referral, Study, StudyStatus, FileMetadata, StudyDetails, ReferralStatus, PatientBooking, PatientBookingStatus, BookingSource, PatientReport, ManagerKpis, FinanceStatement, StatementLine, DebtInfo, SuperAdminOverview, Policy, Rule, SlaSetting, BonusSetting, SlaDryRunResult, Language, I18nCoverage, User, Permissions, DicomPolicy, MedRepDash, MedRepTask, MedRepTaskStatus, MedRepChat, MedRepMessage, Module, Clinic, ClinicStatus, Department, DepartmentModality, RoomModality, RoomStatus, Device, DeviceStatus, RoomSchedule, Blackout, Tariff, PayerType, Contract, ClinicSettings, AvailabilityQuantum, RoomCompareKpi, WorkHour, Staff } from '../types';
import { translations as initialTranslations, ALL_ROLES, ALL_ROOM_MODALITIES, ALL_PAYER_TYPES } from '../constants';

// --- Mock WebSocket Broadcaster ---
type WsCallback = (event: { type: string, payload: any, roomId?: string, clinicId?: string }) => void;
const wsListeners: Record<string, WsCallback[]> = { 
    'queue': [],
    'mrt': [],
    'ref': [],
    'pat': [],
    'mgr': [],
    'fin': [],
    'admin': [],
    'rules': [],
    'sla': [],
    'i18n': [],
    'dicom': [], // New channel for DICOM events
    'medrep': [], // New channel for MedRep events
    'clinic': [], // New channel for general clinic events
    // Dynamic channels for rooms: ws/rooms/{roomId}
};

const getRoomWsChannel = (roomId: string) => `rooms/${roomId}`;

const broadcast = (channel: string, type: string, payload: any, entityId?: string) => {
    const event = { type, payload, ...(entityId ? { entityId } : {}) };
    const channelListeners = wsListeners[channel] || [];

    // For dynamic room channels
    if (channel.startsWith('rooms/') && !wsListeners[channel]) {
        wsListeners[channel] = []; // Initialize if not present
    }

    // console.log(`Broadcasting to channel: ${channel}, type: ${type}, payload:`, payload);
    channelListeners.forEach(cb => cb(event));
};

export const subscribeToWs = (channel: string, callback: WsCallback) => {
    if (!wsListeners[channel]) wsListeners[channel] = [];
    wsListeners[channel].push(callback);
    // console.log(`Subscribed to ${channel}. Total listeners: ${wsListeners[channel].length}`);
    return () => { // Unsubscribe function
        wsListeners[channel] = wsListeners[channel].filter(cb => cb !== callback);
        // console.log(`Unsubscribed from ${channel}. Total listeners: ${wsListeners[channel].length}`);
    };
};


// --- Mock Database ---
let i18nDB: Record<Language, Record<string, string>> = JSON.parse(JSON.stringify(initialTranslations));
const tenantId = 'tenant-01'; // Hardcoded tenant ID for all mock data

let usersDB: User[] = [
    { _id: 'user-ref-01', name: 'Dr. Evelyn Reed', email: 'e.reed@clinic.com', roles: [UserRole.Referrer], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-ref-02', name: 'Dr. Samuel Chen', email: 's.chen@clinic.com', roles: [UserRole.Referrer], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-ref-03', name: 'Dr. Aisha Khan', email: 'a.khan@clinic.com', roles: [UserRole.Referrer], status: 'disabled', createdAt: new Date().toISOString() },
    { _id: 'user-rad-01', name: 'Dr. Ben Carter', email: 'b.carter@clinic.com', roles: [UserRole.Radiologist], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-rad-02', name: 'Dr. Olivia Martinez', email: 'o.martinez@clinic.com', roles: [UserRole.Radiologist], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-rec-01', name: 'Sarah Jones', email: 's.jones@clinic.com', roles: [UserRole.Reception], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-mrt-01', name: 'Mike Williams', email: 'm.williams@clinic.com', roles: [UserRole.MrtOperator], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-mrt-02', name: 'David Garcia', email: 'd.garcia@clinic.com', roles: [UserRole.MrtOperator], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-man-01', name: 'Jessica Miller', email: 'j.miller@clinic.com', roles: [UserRole.Manager], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-fin-01', name: 'Robert Davis', email: 'r.davis@clinic.com', roles: [UserRole.Finance], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-adm-01', name: 'Laura Wilson', email: 'l.wilson@clinic.com', roles: [UserRole.Admin, UserRole.Manager], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-sup-01', name: 'James Brown', email: 'j.brown@clinic.com', roles: [UserRole.SuperAdmin], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-medrep-01', name: 'Alex Johnson', email: 'a.johnson@medrep.com', roles: [UserRole.MedRep], status: 'active', createdAt: new Date().toISOString() },
    { _id: 'user-cln-01', name: 'Clinic Admin 1', email: 'c.admin@clinic.com', roles: [UserRole.ClinicAdmin], status: 'active', createdAt: new Date().toISOString() }, // New ClinicAdmin user
];

let permissionsDB: Record<UserRole, Permissions> = {
    [UserRole.SuperAdmin]: { canSummarizeWithAI: true, canManageDicomPolicies: true, canUploadDicom: true, canViewDicom: true, canAccessMedRep: true, canAccessClinicAdmin: true, canManageRooms: true, canManageTariffs: true, canManageClinicSettings: true },
    [UserRole.Admin]: { canSummarizeWithAI: true, canManageDicomPolicies: true, canUploadDicom: true, canViewDicom: true, canAccessMedRep: true, canAccessClinicAdmin: true, canManageRooms: true, canManageTariffs: true, canManageClinicSettings: true },
    [UserRole.Manager]: { canSummarizeWithAI: true, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: true, canManageRooms: true, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.Radiologist]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: true, canViewDicom: true, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.Referrer]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.Patient]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.Finance]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: true, canManageClinicSettings: false },
    [UserRole.MrtOperator]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: true, canViewDicom: true, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.Reception]: { canSummarizeWithAI: true, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.MedRep]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: true, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false },
    [UserRole.ClinicAdmin]: { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: true, canManageRooms: true, canManageTariffs: true, canManageClinicSettings: true },
};

let dicomPoliciesDB: DicomPolicy[] = ALL_ROLES.map(role => ({
    _id: `policy-${role}`,
    role,
    canView: [UserRole.Radiologist, UserRole.SuperAdmin, UserRole.Admin, UserRole.MrtOperator].includes(role),
    canUpload: [UserRole.MrtOperator, UserRole.SuperAdmin, UserRole.Admin].includes(role),
}));

let dicomObjectsDB: FileMetadata[] = [];
let dicomIdCounter = 1;


const rooms: Room[] = [
    // FIX: Renamed 'perHourCapacity' to 'capacityPerHour' to match the Room interface.
    { _id: 'room-101', name: 'MRI 1.5T Siemens', modality: RoomModality.MRI, capacityPerHour: 2, workHours: [{ weekday: 1, start: '08:00', end: '18:00' }, { weekday: 2, start: '08:00', end: '18:00' }, { weekday: 3, start: '08:00', end: '18:00' }, { weekday: 4, start: '08:00', end: '18:00' }, { weekday: 5, start: '08:00', end: '18:00' }], tenantId, clinicId: 'clinic-01', departmentId: 'dep-rad', code: 'MRI1', deviceIds: ['dev-mri-01'], status: RoomStatus.Up, tags: [], createdAt: new Date().toISOString() },
    { _id: 'room-102', name: 'CT Scanner Philips', modality: RoomModality.CT, capacityPerHour: 4, workHours: [{ weekday: 1, start: '08:00', end: '17:00' }, { weekday: 2, start: '08:00', end: '17:00' }, { weekday: 3, start: '08:00', end: '17:00' }, { weekday: 4, start: '08:00', end: '17:00' }, { weekday: 5, start: '08:00', end: '17:00' }], tenantId, clinicId: 'clinic-01', departmentId: 'dep-rad', code: 'CT1', deviceIds: ['dev-ct-01'], status: RoomStatus.Up, tags: [], createdAt: new Date().toISOString() },
    { _id: 'room-201', name: 'Ultrasound A', modality: RoomModality.US, capacityPerHour: 4, workHours: [{ weekday: 1, start: '09:00', end: '16:00' }, { weekday: 2, start: '09:00', end: '16:00' }, { weekday: 3, start: '09:00', end: '16:00' }, { weekday: 4, start: '09:00', end: '16:00' }, { weekday: 5, start: '09:00', end: '16:00' }], tenantId, clinicId: 'clinic-01', departmentId: 'dep-us', code: 'US1', deviceIds: ['dev-us-01'], status: RoomStatus.Up, tags: [], createdAt: new Date().toISOString() },
    { _id: 'room-202', name: 'X-Ray General', modality: RoomModality.XRAY, capacityPerHour: 6, workHours: [{ weekday: 1, start: '08:30', end: '17:30' }, { weekday: 2, start: '08:30', end: '17:30' }, { weekday: 3, start: '08:30', end: '17:30' }, { weekday: 4, start: '08:30', end: '17:30' }, { weekday: 5, start: '08:30', end: '17:30' }], tenantId, clinicId: 'clinic-01', departmentId: 'dep-xray', code: 'XR1', deviceIds: ['dev-xray-01'], status: RoomStatus.Up, tags: [], createdAt: new Date().toISOString() },
    { _id: 'room-301', name: 'MRI 3.0T GE', modality: RoomModality.MRI, capacityPerHour: 2, workHours: [{ weekday: 1, start: '08:00', end: '19:00' }, { weekday: 2, start: '08:00', end: '19:00' }, { weekday: 3, start: '08:00', end: '19:00' }, { weekday: 4, start: '08:00', end: '19:00' }, { weekday: 5, start: '08:00', end: '19:00' }], tenantId, clinicId: 'clinic-01', departmentId: 'dep-rad', code: 'MRI2', deviceIds: ['dev-mri-02'], status: RoomStatus.Up, tags: [], createdAt: new Date().toISOString() },
    { _id: 'room-302', name: 'Ultrasound B', modality: RoomModality.US, capacityPerHour: 3, workHours: [{ weekday: 1, start: '09:00', end: '17:00' }, { weekday: 2, start: '09:00', end: '17:00' }, { weekday: 3, start: '09:00', end: '17:00' }, { weekday: 4, start: '09:00', end: '17:00' }, { weekday: 5, start: '09:00', end: '17:00' }], tenantId, clinicId: 'clinic-01', departmentId: 'dep-us', code: 'US2', deviceIds: ['dev-us-02'], status: RoomStatus.Up, tags: [], createdAt: new Date().toISOString() },
];

const qrCodeLookup: Record<string, { _id: string, referrerId: string, clinicId: string, roomId: string, patientDetails: { name: string, age: number, phone: string }, complaints: string }> = {
    'QR-REF-001': { _id: 'ref-lookup-001', referrerId: 'user-ref-01', clinicId: 'clinic-01', roomId: 'room-101', patientDetails: { name: 'John Doe', age: 45, phone: '555-1234' }, complaints: 'Persistent headache for 2 weeks.' },
    'QR-REF-002': { _id: 'ref-lookup-002', referrerId: 'user-ref-02', clinicId: 'clinic-01', roomId: 'room-102', patientDetails: { name: 'Jane Smith', age: 62, phone: '555-5678' }, complaints: 'Follow-up on abdominal pain.' },
    'QR-REF-003': { _id: 'ref-lookup-003', referrerId: 'user-ref-03', clinicId: 'clinic-01', roomId: 'room-202', patientDetails: { name: 'Peter Jones', age: 31, phone: '555-8765' }, complaints: 'Check for potential fracture in left wrist after fall.' },
    'QR-REF-004': { _id: 'ref-lookup-004', referrerId: 'user-ref-01', clinicId: 'clinic-01', roomId: 'room-301', patientDetails: { name: 'Mary Johnson', age: 55, phone: '555-4321' }, complaints: 'Knee pain, suspecting ligament tear.' },
};

let slotsDB: Slot[] = [];
let queueDB: QueueItem[] = [];
let studiesDB: Study[] = [];
let referralsDB: Referral[] = [];
let patientIdCounter = 1;
let queueIdCounter = 1;
let studyIdCounter = 1;
let referralIdCounter = 1;

// --- MedRep Module Mock Data ---
let medRepDashDB: MedRepDash[] = [
    {
        _id: 'medrepdash-01',
        userId: 'user-medrep-01',
        period: '2024-07',
        kpis: {
            referrals: { total: 120, accepted: 80, converted: 60 },
            conversions: { referralToBooking: 75 }, // 60/80
            revenue: { total: 15000, fromReferrals: 12000 },
        },
        plan: { referrals: 100, revenue: 10000 },
        actual: { referrals: 120, revenue: 15000 },
        updatedAt: new Date().toISOString(),
    },
];

let medRepTasksDB: MedRepTask[] = [
    {
        _id: 'medreptask-01',
        repId: 'user-medrep-01',
        title: 'Follow up with Dr. Smith (Clinic Alpha)',
        dueAt: '2024-08-15',
        status: MedRepTaskStatus.Todo,
        relatedClinicId: 'clinic-01',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'medreptask-02',
        repId: 'user-medrep-01',
        title: 'Prepare presentation for new product launch',
        dueAt: '2024-08-20',
        status: MedRepTaskStatus.Doing,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'medreptask-03',
        repId: 'user-medrep-01',
        title: 'Submit expense report for July',
        dueAt: '2024-08-05',
        status: MedRepTaskStatus.Done,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
];
let medRepTaskIdCounter = medRepTasksDB.length + 1;

let medRepChatsDB: MedRepChat[] = [
    {
        _id: 'medrepchat-01',
        repId: 'user-medrep-01',
        topic: 'Clinic Alpha Feedback',
        participants: [
            { id: 'user-medrep-01', name: 'Alex Johnson', role: UserRole.MedRep },
            { id: 'user-man-01', name: 'Jessica Miller', role: UserRole.Manager },
        ],
        messages: [
            { _id: 'msg-01-01', senderId: 'user-medrep-01', senderRole: UserRole.MedRep, text: 'Hi Jessica, just checking in after my visit to Clinic Alpha last week. Any updates on their interest in the new MRI features?', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { _id: 'msg-01-02', senderId: 'user-man-01', senderRole: UserRole.Manager, text: 'Hi Alex! Yes, they seemed quite positive. Dr. Lee specifically mentioned the enhanced image clarity. I\'ll schedule a follow-up call with them for next Tuesday.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'medrepchat-02',
        repId: 'user-medrep-01',
        topic: 'Q3 Product Training',
        participants: [
            { id: 'user-medrep-01', name: 'Alex Johnson', role: UserRole.MedRep },
            { id: 'user-adm-01', name: 'Laura Wilson', role: UserRole.Admin },
        ],
        messages: [
            { _id: 'msg-02-01', senderId: 'user-adm-01', senderRole: UserRole.Admin, text: 'Reminder: Q3 product training session is on Friday at 10 AM via Zoom. Please review the pre-read materials.', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
            { _id: 'msg-02-02', senderId: 'user-medrep-01', senderRole: UserRole.MedRep, text: 'Thanks, Laura! I\'ll be there. Just confirming, will there be a Q&A section on the new AI summarization feature?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
];
let medRepChatIdCounter = medRepChatsDB.length + 1;
let medRepMessageIdCounter = 100; // Starting high to avoid clashes with initial messages

// --- Clinic Module Mock Data ---
let clinicsDB: Clinic[] = [
    {
        _id: 'clinic-01', tenantId, code: 'CL001', name: 'Central Medical Center', address: '123 Main St, Anytown', phones: ['+15551234567'], email: 'info@centralmed.com',
        geo: { lat: 34.0522, lng: -118.2437 }, status: ClinicStatus.Active, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
        _id: 'clinic-02', tenantId, code: 'CL002', name: 'Suburban Health Hub', address: '456 Oak Ave, Suburbia', phones: ['+15559876543'], email: 'contact@suburbanhh.com',
        geo: { lat: 34.0722, lng: -118.2637 }, status: ClinicStatus.Active, createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
    },
    {
        _id: 'clinic-03', tenantId, code: 'CL003', name: 'Downtown Diagnostics', address: '789 Pine Ln, Cityville', phones: ['+15551112222'], email: 'hello@downtownd.com',
        geo: { lat: 34.0322, lng: -118.2237 }, status: ClinicStatus.Suspended, createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
];
let clinicIdCounter = clinicsDB.length + 1;

let departmentsDB: Department[] = [
    { _id: 'dep-rad', tenantId, clinicId: 'clinic-01', name: 'Radiology', code: 'RAD', modalities: [DepartmentModality.MRI, DepartmentModality.CT, DepartmentModality.XRAY], createdAt: new Date().toISOString() },
    { _id: 'dep-us', tenantId, clinicId: 'clinic-01', name: 'Ultrasound', code: 'US', modalities: [DepartmentModality.US], createdAt: new Date().toISOString() },
];
let departmentIdCounter = departmentsDB.length + 1;

// RoomsDB is initialized globally for other modules, ensure it has tenantId etc.
let roomsDB: Room[] = rooms;
let roomIdCounter = roomsDB.length + 1;

let devicesDB: Device[] = [
    { _id: 'dev-mri-01', tenantId, roomId: 'room-101', vendor: 'Siemens', model: 'Magnetom Aera', serial: 'MRI-001', status: DeviceStatus.Up, uptimePct: 99.8, lastServiceAt: '2024-06-01', nextServiceAt: '2025-06-01', notes: 'Routine maintenance performed.' },
    { _id: 'dev-ct-01', tenantId, roomId: 'room-102', vendor: 'Philips', model: 'Ingenuity Core', serial: 'CT-001', status: DeviceStatus.Up, uptimePct: 99.5, lastServiceAt: '2024-05-15', nextServiceAt: '2025-05-15', notes: 'Minor software update in May.' },
];
let deviceIdCounter = devicesDB.length + 1;

let roomSchedulesDB: RoomSchedule[] = [];
let roomScheduleIdCounter = 1;

let tariffsDB: Tariff[] = [
    { _id: 'trf-mri-brain', tenantId, clinicId: 'clinic-01', modality: RoomModality.MRI, serviceCode: 'MRI001', title: 'MRI Brain', price: 250, currency: 'USD', effectiveFrom: '2024-01-01', effectiveTo: '2025-01-01' },
    { _id: 'trf-ct-chest', tenantId, clinicId: 'clinic-01', modality: RoomModality.CT, serviceCode: 'CT001', title: 'CT Chest', price: 180, currency: 'USD', effectiveFrom: '2024-01-01', effectiveTo: '2025-01-01' },
    { _id: 'trf-us-abd', tenantId, clinicId: 'clinic-02', modality: RoomModality.US, serviceCode: 'US001', title: 'Ultrasound Abdomen', price: 100, currency: 'USD', effectiveFrom: '2024-03-01', effectiveTo: '2025-03-01' },
];
let tariffIdCounter = tariffsDB.length + 1;

let contractsDB: Contract[] = [
    { _id: 'cnt-ins-01', tenantId, clinicId: 'clinic-01', payerType: PayerType.Insurance, payerName: 'BlueCross BlueShield', terms: { coveragePct: 0.8 }, validFrom: '2024-01-01', validTo: '2025-01-01', status: 'active' },
    { _id: 'cnt-corp-01', tenantId, clinicId: 'clinic-01', payerType: PayerType.Corporate, payerName: 'TechCorp Inc.', terms: { employeeDiscount: 0.15 }, validFrom: '2024-02-01', validTo: '2025-02-01', status: 'active' },
];
let contractIdCounter = contractsDB.length + 1;

let clinicSettingsDB: ClinicSettings[] = [
    {
        _id: 'settings-clinic-01', tenantId, clinicId: 'clinic-01',
        policies: { refSlotsTodayVisibilityPct: 50, refSlotsTodayMinOffsetMin: 60, perHourLimit: 10, selfBookingDiscountPct: 20, superAdminCutPct: 5 },
        localization: { defaultLang: Language.EN }
    },
    {
        _id: 'settings-clinic-02', tenantId, clinicId: 'clinic-02',
        policies: { refSlotsTodayVisibilityPct: 75, refSlotsTodayMinOffsetMin: 30, perHourLimit: 8, selfBookingDiscountPct: 15, superAdminCutPct: 5 },
        localization: { defaultLang: Language.RU }
    },
];
let clinicSettingsIdCounter = clinicSettingsDB.length + 1;

let staffDB: Staff[] = [
    { _id: 'staff-cln1-rad1', tenantId, clinicId: 'clinic-01', userId: 'user-rad-01', role: UserRole.Radiologist, active: true, skills: ['MRI'], roomsAllowed: ['room-101'], schedulePrefs: {} },
    { _id: 'staff-cln1-mrt1', tenantId, clinicId: 'clinic-01', userId: 'user-mrt-01', role: UserRole.MrtOperator, active: true, skills: ['MRI', 'CT'], roomsAllowed: ['room-101', 'room-102'], schedulePrefs: {} },
];
let staffIdCounter = staffDB.length + 1;


// --- Utility Functions ---
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to check for overlapping time ranges
function hasOverlap(slots: { start: string; end: string }[]): boolean {
    const sortedSlots = [...slots].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sortedSlots.length - 1; i++) {
        if (sortedSlots[i].end > sortedSlots[i + 1].start) {
            return true; // Overlap found
        }
    }
    return false;
}

// --- Slot and Queue Generation ---
const generateDataForDay = (date: Date) => {
    const dateStr = formatDate(date);
    if (slotsDB.some(s => s.date === dateStr)) return; // Already generated for this day

    const daySlots: Slot[] = [];
    const dayQueue: QueueItem[] = [];
    const referrers = usersDB.filter(u => u.roles.includes(UserRole.Referrer));

    roomsDB.forEach(room => { // Use roomsDB for consistency
        const workHour = room.workHours.find(wh => wh.weekday === date.getDay());
        if (!workHour) return;

        const [startHour, startMinute] = workHour.start.split(':').map(Number);
        const [endHour, endMinute] = workHour.end.split(':').map(Number);

        for (let hour = startHour; hour < endHour + 1; hour++) {
            if(hour === endHour && endMinute === 0) continue;

            const minutesInHour = (hour === startHour ? startMinute : 0);
            for (let minute = minutesInHour; minute < (hour === endHour ? endMinute : 60); minute += Math.floor(60 / room.capacityPerHour)) { // Changed interval logic for more consistent slots
                
                const startAt = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const interval = Math.floor(60 / room.capacityPerHour);
                const endAtDate = new Date(`${dateStr}T${startAt}`);
                endAtDate.setMinutes(endAtDate.getMinutes() + interval);
                const endAt = `${String(endAtDate.getHours()).padStart(2, '0')}:${String(endAtDate.getMinutes()).padStart(2, '0')}`;

                const isPeakTime = (hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16);
                const bookingProbability = Math.random() < (isPeakTime ? 0.75 : 0.35); // Re-evaluate probability each time
                const isTaken = bookingProbability;

                const newSlot = {
                    _id: `slot-${dateStr}-${room._id}-${startAt}`,
                    clinicId: 'clinic-01',
                    roomId: room._id,
                    roomName: room.name,
                    modality: room.modality,
                    date: dateStr,
                    startAt,
                    endAt,
                    capacity: 1,
                    taken: isTaken ? 1 : 0,
                };
                daySlots.push(newSlot);

                if (isTaken) {
                    const newPatient: Patient = { 
                        _id: `patient-${patientIdCounter}`, 
                        maskedName: `Patient ${String(patientIdCounter++).padStart(4, '0')}`,
                        age: Math.floor(Math.random() * 60) + 20,
                    };
                    let status = QueueStatus.Queued;
                    const randStatus = Math.random();
                    if (randStatus > 0.85) status = QueueStatus.InProgress;
                    else if (randStatus > 0.7) status = QueueStatus.Described;

                    const newQueueItem: QueueItem = {
                        _id: `queue-${queueIdCounter++}`,
                        patient: newPatient,
                        clinicId: newSlot.clinicId,
                        roomId: newSlot.roomId,
                        roomName: newSlot.roomName,
                        slotId: newSlot._id,
                        startAt: newSlot.startAt,
                        priority: [Priority.STD, Priority.SR, Priority.PLN][Math.floor(Math.random() * 3)],
                        status,
                        complaints: 'Routine check-up or pre-booked procedure.',
                        referrerId: Math.random() > 0.5 ? referrers[Math.floor(Math.random() * referrers.length)]._id : undefined,
                        createdAt: new Date().toISOString(),
                    };
                    dayQueue.push(newQueueItem);
                }
            }
        }
    });
    slotsDB = [...slotsDB, ...daySlots];
    queueDB = [...queueDB, ...dayQueue];

    // Generate RoomSchedule for the day
    roomsDB.forEach(room => {
        const roomSlotsForDay = daySlots.filter(s => s.roomId === room._id && s.date === dateStr);
        if (roomSlotsForDay.length > 0) {
            const schedule: RoomSchedule = {
                _id: `schedule-${dateStr}-${room._id}`,
                tenantId,
                clinicId: room.clinicId,
                roomId: room._id,
                date: dateStr,
                slots: roomSlotsForDay.map(s => ({ start: s.startAt, end: s.endAt, capacity: s.capacity, booked: s.taken })),
                overrides: [],
                blackouts: [],
            };
            const existingIndex = roomSchedulesDB.findIndex(rs => rs._id === schedule._id);
            if (existingIndex > -1) {
                roomSchedulesDB[existingIndex] = schedule;
            } else {
                roomSchedulesDB.push(schedule);
            }
        }
    });
};

const generateDataForPeriod = (startDate: Date, days: number) => {
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        generateDataForDay(date);
    }
};


// --- API Functions ---
export const fetchRooms = async(clinicId: string): Promise<Room[]> => {
    await delay(100);
    return roomsDB.filter(r => r.clinicId === clinicId && r.tenantId === tenantId);
}


export const fetchSlots = async (clinicId: string, startDate: Date, days: number, role: UserRole): Promise<Slot[]> => {
    await delay(500);
    generateDataForPeriod(startDate, days);
    
    const dateStrings: string[] = [];
    for(let i=0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dateStrings.push(formatDate(d));
    }

    let availableSlots = slotsDB.filter(s => dateStrings.includes(s.date) && s.clinicId === clinicId && s.taken < s.capacity);
    const now = new Date();
    
    // For Referrer and Patient, apply time-based restrictions
    if (role === UserRole.Referrer || role === UserRole.Patient) {
        const clinicSettings = clinicSettingsDB.find(cs => cs.clinicId === clinicId)?.policies;
        const minOffset = clinicSettings?.refSlotsTodayMinOffsetMin || 60; // Default to 60 min

        const oneHourFromNow = new Date(now.getTime() + minOffset * 60 * 1000);
        
        availableSlots = availableSlots.filter(slot => {
             const slotDateTime = new Date(`${slot.date}T${slot.startAt}`);
             return slotDateTime > oneHourFromNow;
        });
        
        // Apply 50% visibility rule only for "today" for Referrers
        if (role === UserRole.Referrer) {
            const todayStr = formatDate(now);
            const todaySlots = availableSlots.filter(s => s.date === todayStr);
            const futureSlots = availableSlots.filter(s => s.date !== todayStr);
            
            const visibilityPct = clinicSettings?.refSlotsTodayVisibilityPct || 50; // Default 50%
            const visibleTodaySlots = todaySlots.filter((_, index) => (index * 100 / todaySlots.length) < visibilityPct); // Simple percentage approx
            
            return [...visibleTodaySlots, ...futureSlots];
        }

        return availableSlots;
    }
    
    // For other roles (e.g. Reception), just filter past slots for today
    const todayStr = formatDate(now);
    return availableSlots.filter(slot => {
        if (slot.date !== todayStr) return true;
        const slotDateTime = new Date(`${slot.date}T${slot.startAt}`);
        return slotDateTime > now;
    });
};

export const fetchClinicWorkload = async (clinicId: string, startDate: Date, days: number): Promise<Record<string, { total: number, taken: number }>> => {
    await delay(600);
    generateDataForPeriod(startDate, days);
    
    const dateStrings: string[] = [];
    for(let i=0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dateStrings.push(formatDate(d));
    }
    
    const relevantRooms = roomsDB.filter(r => r.clinicId === clinicId);
    const relevantSlots = slotsDB.filter(s => dateStrings.includes(s.date) && s.clinicId === clinicId);

    const workload = relevantRooms.reduce((acc, room) => {
        const roomSlots = relevantSlots.filter(s => s.roomId === room._id);
        acc[room.name] = {
            total: roomSlots.length,
            taken: roomSlots.filter(s => s.taken > 0).length,
        };
        return acc;
    }, {} as Record<string, { total: number, taken: number }>);
    
    return workload;
};


export const fetchQueue = async (clinicId: string, date: Date): Promise<QueueItem[]> => {
    await delay(300);
    const dateStr = formatDate(date);
    generateDataForDay(date);

    return queueDB.filter(q => {
        const slot = slotsDB.find(s => s._id === q.slotId);
        return slot && slot.date === dateStr && q.clinicId === clinicId;
    }).sort((a,b) => a.startAt.localeCompare(b.startAt));
};

export const bookSlot = async (slotId: string, patientName: string, complaints: string, priority: Priority, referralId?: string): Promise<QueueItem> => {
    await delay(700);
    const slotIndex = slotsDB.findIndex(s => s._id === slotId);
    if (slotIndex === -1) throw new Error("Slot not found");
    
    const slot = slotsDB[slotIndex];
    if (slot.taken >= slot.capacity) throw new Error("Slot is full");

    slotsDB[slotIndex] = { ...slot, taken: slot.taken + 1 };

    // Update RoomSchedule booked count
    const schedule = roomSchedulesDB.find(rs => rs.roomId === slot.roomId && rs.date === slot.date);
    if (schedule) {
        const slotInSchedule = schedule.slots.find(s => s.start === slot.startAt);
        if (slotInSchedule) slotInSchedule.booked += 1;
        broadcast(getRoomWsChannel(slot.roomId), 'room.schedule.updated', schedule, slot.roomId);
    }


    const newPatient: Patient = { _id: `patient-${patientIdCounter}`, maskedName: patientName || `Patient ${String(patientIdCounter++).padStart(4, '0')}` };
    
    const newQueueItem: QueueItem = {
        _id: `queue-${queueIdCounter++}`,
        patient: newPatient,
        clinicId: slot.clinicId,
        roomId: slot.roomId,
        roomName: slot.roomName,
        slotId: slot._id,
        startAt: slot.startAt,
        priority: priority,
        status: QueueStatus.Queued,
        complaints: complaints,
        createdAt: new Date().toISOString(),
        referralId: referralId,
    };

    queueDB.push(newQueueItem);
    
    setTimeout(() => broadcast('queue', 'queue.created', newQueueItem), 100);
    setTimeout(() => broadcast('mgr', 'queue.created', newQueueItem), 100);
    return newQueueItem;
};

export const decodeQrCode = async (qrCode: string) => {
    await delay(400);
    return qrCodeLookup[qrCode] || null;
}

// --- MRT MODULE API ---

export const fetchMrtQueue = async(roomId: string, date: Date): Promise<{queue: QueueItem[], studies: Study[]}> => {
    await delay(400);
    const dateStr = formatDate(date);
    generateDataForDay(date);

    const roomQueue = queueDB.filter(q => {
        const slot = slotsDB.find(s => s._id === q.slotId);
        return slot && slot.date === dateStr && q.roomId === roomId;
    }).sort((a,b) => a.startAt.localeCompare(b.startAt));

    const roomStudies = studiesDB.filter(s => roomQueue.some(q => q._id === s.queueItemId));

    return { queue: roomQueue, studies: roomStudies };
}

export const startStudy = async(queueItemId: string, operatorId: string): Promise<{updatedQueueItem: QueueItem, newStudy: Study}> => {
    await delay(500);
    const queueItemIndex = queueDB.findIndex(q => q._id === queueItemId);
    if(queueItemIndex === -1) throw new Error("Queue item not found");
    
    const queueItem = queueDB[queueItemIndex];
    if(queueItem.status !== QueueStatus.Queued) throw new Error("Study can only be started for queued patients.");

    const room = roomsDB.find(r => r._id === queueItem.roomId); // Use roomsDB
    
    // Create new study
    const newStudy: Study = {
        _id: `study-${studyIdCounter++}`,
        queueItemId,
        clinicId: queueItem.clinicId,
        roomId: queueItem.roomId,
        slotId: queueItem.slotId,
        modality: room?.modality || 'UNKNOWN' as RoomModality, // Ensure type safety
        operatorId,
        startedAt: new Date().toISOString(),
        dicom: { objects: [], totalSize: 0 },
        docs: [],
        status: StudyStatus.InProgress,
    };
    studiesDB.push(newStudy);

    // Update queue item
    const updatedQueueItem = { ...queueItem, status: QueueStatus.InProgress, studyId: newStudy._id };
    queueDB[queueItemIndex] = updatedQueueItem;

    // Broadcast events
    setTimeout(() => {
        broadcast('queue', 'queue.updated', updatedQueueItem);
        broadcast('mrt', 'study.started', { queueItem: updatedQueueItem, study: newStudy }, queueItem.roomId);
        broadcast('mgr', 'queue.updated', updatedQueueItem);
    }, 100);
    
    return { updatedQueueItem, newStudy };
};


export const uploadToStudy = async(studyId: string, file: Omit<FileMetadata, 'id' | 'uploadedAt' | 'signedUrl'>): Promise<Study> => {
    await delay(800);
    const studyIndex = studiesDB.findIndex(s => s._id === studyId);
    if(studyIndex === -1) throw new Error("Study not found");

    const study = studiesDB[studyIndex];
    const newFile: FileMetadata = {
        ...file,
        id: `file-${Date.now()}`,
        uploadedAt: new Date().toISOString(),
        // FIX: Ensure signedUrl is always generated
        signedUrl: `https://mockstorage.com/${file.name}`
    };
    
    if(file.contentType.startsWith('application/dicom') || file.name.endsWith('.dcm')){
        study.dicom.objects.push(newFile);
        study.dicom.totalSize += newFile.size;
    } else {
        study.docs.push(newFile);
    }
    
    study.status = StudyStatus.Uploaded;
    studiesDB[studyIndex] = study;

    // Broadcast event
    setTimeout(() => {
        broadcast('mrt', 'study.uploaded', study, study.roomId);
    }, 100);

    return study;
};

export const finishStudy = async(studyId: string): Promise<{updatedQueueItem: QueueItem, updatedStudy: Study}> => {
    await delay(600);
    const studyIndex = studiesDB.findIndex(s => s._id === studyId);
    if(studyIndex === -1) throw new Error("Study not found");

    const study = studiesDB[studyIndex];
    const queueItemIndex = queueDB.findIndex(q => q._id === study.queueItemId);
    if(queueItemIndex === -1) throw new Error("Associated queue item not found");
    
    // Update study
    study.status = StudyStatus.Finished;
    study.finishedAt = new Date().toISOString();
    studiesDB[studyIndex] = study;

    // Update queue item
    const queueItem = queueDB[queueItemIndex];
    queueItem.status = QueueStatus.Described;
    queueDB[queueItemIndex] = queueItem;

    // Update corresponding referral status to green
    if (queueItem.referralId) {
        const referralIndex = referralsDB.findIndex(r => r._id === queueItem.referralId);
        if (referralIndex > -1 && referralsDB[referralIndex].status === ReferralStatus.Yellow) {
            referralsDB[referralIndex].status = ReferralStatus.Green;
            referralsDB[referralIndex].updatedAt = new Date().toISOString();
            setTimeout(() => broadcast('ref', 'ref.updated', referralsDB[referralIndex]), 150);
        }
    }

     // Broadcast events
     setTimeout(() => {
        broadcast('queue', 'queue.updated', queueItem);
        broadcast('mrt', 'study.finished', { queueItem: queueItem, study: study }, study.roomId);
        broadcast('mgr', 'queue.updated', queueItem);
    }, 100);

    return { updatedQueueItem: queueItem, updatedStudy: study };
}

export const updateQueueItemStatus = async (queueItemId: string, status: QueueStatus): Promise<QueueItem> => {
    await delay(300);
    const queueItemIndex = queueDB.findIndex(q => q._id === queueItemId);
    if (queueItemIndex === -1) throw new Error("Queue item not found");

    const queueItem = queueDB[queueItemIndex];
    queueItem.status = status;
    queueDB[queueItemIndex] = queueItem;

    setTimeout(() => {
        broadcast('queue', 'queue.updated', queueItem);
        broadcast('mrt', 'queue.updated', queueItem, queueItem.roomId);
        broadcast('mgr', 'queue.updated', queueItem);
    }, 100);

    return queueItem;
};

// --- RADIOLOGY MODULE API ---

export const fetchRadiologyInbox = async (): Promise<Study[]> => {
    await delay(500);
    // Return studies that are finished by the MRT operator and ready for a radiologist's description.
    const inboxStudyIds = queueDB
        .filter(q => q.status === QueueStatus.Described)
        .map(q => q.studyId);
        
    return studiesDB.filter(s => s._id && inboxStudyIds.includes(s._id));
};

export const fetchStudyDetails = async (studyId: string): Promise<StudyDetails | null> => {
    await delay(350);
    const study = studiesDB.find(s => s._id === studyId);
    if (!study) return null;
    
    const queueItem = queueDB.find(q => q._id === study.queueItemId);
    if (!queueItem) return null;

    const radiologist = usersDB.find(u => u._id === study.radiologistId);

    const { patient, ...restOfQueueItem } = queueItem;

    return {
        ...study,
        patient: patient,
        queueItem: restOfQueueItem,
        radiologistName: radiologist?.name
    };
};

// --- REFERRER PORTAL API ---

export const createReferral = async (
    referrerId: string, 
    slotId: string, 
    patientName: string, 
    complaint: string
): Promise<{referral: Referral, queueItem: QueueItem}> => {
    await delay(750);
    const slot = slotsDB.find(s => s._id === slotId);
    if(!slot) throw new Error("Slot not found");

    const now = new Date().toISOString();
    const currentId = referralIdCounter;
    
    // FIX: Ensure QR code generation is robust and unique
    const qrCode = `QR-REF-${String(currentId).padStart(3, '0')}-${Date.now().toString(36)}`; // More unique QR
    const shortCode = `RF${String(currentId).padStart(4, '0')}`; // Short code remains simple

    const newReferral: Referral = {
        _id: `ref-${currentId}`,
        referrerId,
        clinicId: slot.clinicId,
        roomId: slot.roomId,
        slotId,
        qrCode,
        shortCode,
        patientHint: { name: patientName, complaint },
        status: ReferralStatus.Yellow,
        createdAt: now,
        updatedAt: now,
    };
    referralsDB.push(newReferral);
    referralIdCounter++;
    
    // This simulates the reception getting the referral and creating a queue item
    const queueItem = await bookSlot(slotId, `Referred: ${patientName}`, complaint, Priority.STD, newReferral._id);

    setTimeout(() => broadcast('ref', 'ref.created', newReferral), 100);

    return { referral: newReferral, queueItem };
};

export const fetchReferrals = async (referrerId: string): Promise<Referral[]> => {
    await delay(400);
    return referralsDB.filter(r => r.referrerId === referrerId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}


// --- PATIENT APP MOCK DB ---
let patientBookingsDB: PatientBooking[] = [];
let patientReportsDB: PatientReport[] = [];
let patientDataGenerated = false;

const generatePatientData = () => {
    if (patientDataGenerated) return;

    const patientId = 'user-pat-01'; // Hardcoded patient user for demo
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    generateDataForDay(today);
    generateDataForDay(tomorrow);
    generateDataForDay(yesterday);

    const todaySlots = slotsDB.filter(s => s.date === formatDate(today) && s.roomId === 'room-101');
    const tomorrowSlots = slotsDB.filter(s => s.date === formatDate(tomorrow) && s.roomId === 'room-102');
    const yesterdaySlots = slotsDB.filter(s => s.date === formatDate(yesterday) && s.roomId === 'room-201');
    
    // Booking for tomorrow (Booked status)
    if (tomorrowSlots.length > 0) {
        const slot = tomorrowSlots[0];
        patientBookingsDB.push({
            _id: 'pb-001', patientId, clinicId: slot.clinicId, roomId: slot.roomId, roomName: slot.roomName, modality: slot.modality, slotId: slot._id,
            startAt: slot.startAt, date: slot.date, status: PatientBookingStatus.Booked, source: BookingSource.Self, createdAt: new Date().toISOString(), price: 100, discount: 20, finalAmount: 80
        });
    }

    // Booking for today (Paid status)
    if (todaySlots.length > 0) {
        const slot = todaySlots[0];
        patientBookingsDB.push({
            _id: 'pb-002', patientId, clinicId: slot.clinicId, roomId: slot.roomId, roomName: slot.roomName, modality: slot.modality, slotId: slot._id,
            startAt: slot.startAt, date: slot.date, status: PatientBookingStatus.Paid, source: BookingSource.Referral, createdAt: new Date().toISOString(), price: 150, discount: 0, finalAmount: 150
        });
    }
    
    // Booking from yesterday (Done status, with report)
    if (yesterdaySlots.length > 0) {
        const slot = yesterdaySlots[0];
        const bookingId = 'pb-003';
        patientBookingsDB.push({
            _id: bookingId, patientId, clinicId: slot.clinicId, roomId: slot.roomId, roomName: slot.roomName, modality: slot.modality, slotId: slot._id,
            startAt: slot.startAt, date: slot.date, status: PatientBookingStatus.Done, source: BookingSource.Referral, createdAt: new Date(yesterday).toISOString(), price: 120, discount: 0, finalAmount: 120
        });
        patientReportsDB.push({
            _id: 'rep-001', bookingId, studyName: `${slot.modality} ${slot.roomName}`, reportUrl: 'https://mockstorage.com/report-123.pdf', createdAt: new Date().toISOString()
        });
    }

    // Cancelled booking
    if (tomorrowSlots.length > 1) {
        const slot = tomorrowSlots[1];
        patientBookingsDB.push({
            _id: 'pb-004', patientId, clinicId: slot.clinicId, roomId: slot.roomId, roomName: slot.roomName, modality: slot.modality, slotId: slot._id,
            startAt: slot.startAt, date: slot.date, status: PatientBookingStatus.Cancelled, source: BookingSource.Self, createdAt: new Date(yesterday).toISOString(), price: 200, discount: 40, finalAmount: 160
        });
    }
    patientDataGenerated = true;
};

// --- PATIENT APP API ---

export const bookSlotAsPatient = async (slotId: string, patientId: string): Promise<PatientBooking> => {
    await delay(700);
    const slotIndex = slotsDB.findIndex(s => s._id === slotId);
    if (slotIndex === -1) throw new Error("Slot not found");

    const slot = slotsDB[slotIndex];
    if (slot.taken >= slot.capacity) throw new Error("Slot is full");

    slotsDB[slotIndex] = { ...slot, taken: slot.taken + 1 };

    const basePrice = 100; // Mock base price
    const discount = clinicSettingsDB.find(cs => cs.clinicId === slot.clinicId)?.policies.selfBookingDiscountPct || 20; // 20%
    const finalAmount = basePrice * (1 - discount / 100);

    const newBooking: PatientBooking = {
        _id: `pb-${Date.now()}`,
        patientId,
        clinicId: slot.clinicId,
        roomId: slot.roomId,
        roomName: slot.roomName,
        modality: slot.modality,
        slotId: slot._id,
        startAt: slot.startAt,
        date: slot.date,
        status: PatientBookingStatus.Booked,
        source: BookingSource.Self,
        createdAt: new Date().toISOString(),
        price: basePrice,
        discount: discount,
        finalAmount: finalAmount,
    };
    
    patientBookingsDB.push(newBooking);

    setTimeout(() => broadcast('pat', 'pat.booking.update', newBooking), 100);
    return newBooking;
};


export const fetchPatientBookings = async (patientId: string): Promise<PatientBooking[]> => {
    await delay(400);
    generatePatientData();
    return patientBookingsDB.filter(b => b.patientId === patientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const cancelPatientBooking = async (bookingId: string): Promise<PatientBooking> => {
    await delay(300);
    const bookingIndex = patientBookingsDB.findIndex(b => b._id === bookingId);
    if (bookingIndex === -1) throw new Error("Booking not found");
    if (patientBookingsDB[bookingIndex].status !== PatientBookingStatus.Booked) throw new Error("Only booked appointments can be cancelled.");

    patientBookingsDB[bookingIndex].status = PatientBookingStatus.Cancelled;
    const updatedBooking = patientBookingsDB[bookingIndex];

    setTimeout(() => broadcast('pat', 'pat.booking.update', updatedBooking), 100);
    return updatedBooking;
};

export const payForBooking = async (bookingId: string): Promise<PatientBooking> => {
    await delay(800);
    const bookingIndex = patientBookingsDB.findIndex(b => b._id === bookingId);
    if (bookingIndex === -1) throw new Error("Booking not found");
    if (patientBookingsDB[bookingIndex].status !== PatientBookingStatus.Booked) throw new Error("Payment is only possible for booked appointments.");

    patientBookingsDB[bookingIndex].status = PatientBookingStatus.Paid;
    const updatedBooking = patientBookingsDB[bookingIndex];

    setTimeout(() => broadcast('pat', 'pat.booking.update', updatedBooking), 100);
    return updatedBooking;
}

export const reschedulePatientBooking = async (bookingId: string, newSlotId: string): Promise<PatientBooking> => {
    await delay(600);
    const bookingIndex = patientBookingsDB.findIndex(b => b._id === bookingId);
    if (bookingIndex === -1) throw new Error("Booking not found");
    
    const booking = patientBookingsDB[bookingIndex];
    if (booking.status !== PatientBookingStatus.Booked) {
        throw new Error("Only 'booked' appointments can be rescheduled.");
    }
    const oldSlotId = booking.slotId;

    const newSlotIndex = slotsDB.findIndex(s => s._id === newSlotId);
    if (newSlotIndex === -1) throw new Error("New slot not found");
    const newSlot = slotsDB[newSlotIndex];

    if (newSlot.taken >= newSlot.capacity) throw new Error("New slot is already full");

    // Free up old slot
    const oldSlotIndex = slotsDB.findIndex(s => s._id === oldSlotId);
    if (oldSlotIndex > -1) {
        slotsDB[oldSlotIndex].taken = Math.max(0, slotsDB[oldSlotIndex].taken - 1);
        const oldSchedule = roomSchedulesDB.find(rs => rs.roomId === slotsDB[oldSlotIndex].roomId && rs.date === slotsDB[oldSlotIndex].date);
        if (oldSchedule) {
            const slotInSchedule = oldSchedule.slots.find(s => s.start === slotsDB[oldSlotIndex].startAt);
            if (slotInSchedule) slotInSchedule.booked = Math.max(0, slotInSchedule.booked - 1);
            broadcast(getRoomWsChannel(slotsDB[oldSlotIndex].roomId), 'room.schedule.updated', oldSchedule, slotsDB[oldSlotIndex].roomId);
        }
    }
    
    // Take new slot
    slotsDB[newSlotIndex].taken += 1;
    const newSchedule = roomSchedulesDB.find(rs => rs.roomId === newSlot.roomId && rs.date === newSlot.date);
    if (newSchedule) {
        const slotInSchedule = newSchedule.slots.find(s => s.start === newSlot.startAt);
        if (slotInSchedule) slotInSchedule.booked += 1;
        broadcast(getRoomWsChannel(newSlot.roomId), 'room.schedule.updated', newSchedule, newSlot.roomId);
    }
    
    // Update booking
    booking.slotId = newSlot._id;
    booking.date = newSlot.date;
    booking.startAt = newSlot.startAt;
    
    patientBookingsDB[bookingIndex] = booking;

    setTimeout(() => broadcast('pat', 'pat.booking.update', booking), 100);
    return booking;
}


export const fetchPatientReports = async (patientId: string): Promise<PatientReport[]> => {
    await delay(500);
    const patientBookingIds = patientBookingsDB.filter(b => b.patientId === patientId && b.status === PatientBookingStatus.Done).map(b => b._id);
    return patientReportsDB.filter(r => patientBookingIds.includes(r.bookingId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};


// --- MANAGER PANEL API ---

export const fetchManagerKpis = async (clinicId: string): Promise<ManagerKpis> => {
    await delay(600);
    const radLoad = studiesDB.reduce((acc, study) => {
        const rad = usersDB.find(u => u.roles.includes(UserRole.Radiologist) && u._id === study.radiologistId);
        if (rad) {
            acc[rad.name] = (acc[rad.name] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const queueCounts = queueDB.reduce((acc, item) => {
        if(item.clinicId === clinicId && (item.status === QueueStatus.Queued || item.status === QueueStatus.InProgress || item.status === QueueStatus.Described)) {
            acc[item.priority] = (acc[item.priority] || 0) + 1;
        }
        return acc;
    }, { [Priority.SR]: 0, [Priority.STD]: 0, [Priority.PLN]: 0 });

    return {
        slaCompliance: 98.2,
        avgWaitTime: '42m',
        radLoad,
        queueCounts
    };
};

export const fetchManagerQueues = async (clinicId: string): Promise<QueueItem[]> => {
    await delay(500);
    const activeStatuses = [QueueStatus.Queued, QueueStatus.InProgress, QueueStatus.Described];
    return queueDB.filter(q => q.clinicId === clinicId && activeStatuses.includes(q.status))
        .sort((a, b) => {
            const priorityOrder = { [Priority.SR]: 0, [Priority.STD]: 1, [Priority.PLN]: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority] || a.createdAt.localeCompare(b.createdAt);
        });
};

export const fetchRadiologists = async (): Promise<{_id: string, name: string}[]> => {
    await delay(200);
    return usersDB.filter(u => u.roles.includes(UserRole.Radiologist)).map(u => ({_id: u._id, name: u.name}));
}

export const assignRadiologistToQueueItem = async (queueItemId: string, radiologistId: string, managerId: string): Promise<QueueItem> => {
    await delay(400);
    const queueItemIndex = queueDB.findIndex(q => q._id === queueItemId);
    if (queueItemIndex === -1) throw new Error("Queue item not found.");
    
    const queueItem = queueDB[queueItemIndex];
    queueItem.radiologistId = radiologistId; // Assign directly to queue for simplicity
    queueItem.assignedBy = managerId;

    if (queueItem.studyId) {
        const studyIndex = studiesDB.findIndex(s => s._id === queueItem.studyId);
        if (studyIndex > -1) {
            studiesDB[studyIndex].radiologistId = radiologistId;
        }
    }
    
    queueDB[queueItemIndex] = queueItem;
    
    setTimeout(() => broadcast('mgr', 'queue.updated', queueItem), 100);
    return queueItem;
}

export const escalateQueueItem = async (queueItemId: string): Promise<QueueItem> => {
    await delay(300);
    const queueItemIndex = queueDB.findIndex(q => q._id === queueItemId);
    if (queueItemIndex === -1) throw new Error("Queue item not found.");

    const queueItem = queueDB[queueItemIndex];
    if (queueItem.priority === Priority.PLN) {
        queueItem.priority = Priority.STD;
    } else if (queueItem.priority === Priority.STD) {
        queueItem.priority = Priority.SR;
    }
    // SR is already max priority

    queueDB[queueItemIndex] = queueItem;
    setTimeout(() => broadcast('mgr', 'queue.updated', queueItem), 100);
    return queueItem;
}

// --- FINANCE MODULE API ---
let financeStatementDB: FinanceStatement | null = null;
let financeDataGenerated = false;

const generateFinanceData = () => {
    if (financeDataGenerated) return;

    const lines: StatementLine[] = [];
    let totalIn = 0;

    // Simulate charges from radiologists' work
    const describedItems = queueDB.filter(q => q.status === QueueStatus.Described && q.radiologistId);
    describedItems.forEach(item => {
        const pointsMap: Record<Priority, number> = { [Priority.SR]: 30, [Priority.STD]: 20, [Priority.PLN]: 15 };
        const amount = pointsMap[item.priority] || 20;
        const radiologist = usersDB.find(u => u._id === item.radiologistId);
        const superAdminCut = clinicSettingsDB.find(cs => cs.clinicId === item.clinicId)?.policies.superAdminCutPct || 5; // Default 5%
        
        if (radiologist) {
            lines.push({
                type: 'charge',
                amount: amount * (1 - superAdminCut / 100), 
                actorRole: UserRole.Radiologist,
                actorId: radiologist._id,
                actorName: radiologist.name,
                ruleName: `radiology_${item.priority.toLowerCase()}_fee`,
                meta: { queueItemId: item._id, patientName: item.patient.maskedName },
                createdAt: item.createdAt,
            });
             lines.push({
                type: 'charge',
                amount: amount * (superAdminCut / 100), 
                actorRole: UserRole.SuperAdmin,
                actorId: 'user-sup-01',
                actorName: 'SuperAdmin',
                ruleName: `radiology_${item.priority.toLowerCase()}_split`,
                meta: { queueItemId: item._id },
                createdAt: item.createdAt,
            });
            totalIn += amount;
        }
    });

    // Simulate charges from referrals
    const completedReferrals = referralsDB.filter(r => r.status === ReferralStatus.Green);
    completedReferrals.forEach(ref => {
        const amount = 110;
        const referrer = usersDB.find(u => u._id === ref.referrerId);
        const superAdminCut = clinicSettingsDB.find(cs => cs.clinicId === ref.clinicId)?.policies.superAdminCutPct || 5; // Default 5%

        if(referrer) {
             lines.push({
                type: 'charge',
                amount: amount * (1 - superAdminCut / 100), 
                actorRole: UserRole.Referrer,
                actorId: referrer._id,
                actorName: referrer.name,
                ruleName: 'referrer_bonus',
                meta: { referralId: ref._id },
                createdAt: ref.createdAt,
            });
             lines.push({
                type: 'charge',
                amount: amount * (superAdminCut / 100), 
                actorRole: UserRole.SuperAdmin,
                actorId: 'user-sup-01',
                actorName: 'SuperAdmin',
                ruleName: 'referrer_bonus_split',
                meta: { referralId: ref._id },
                createdAt: ref.createdAt,
            });
            totalIn += amount;
        }
    });
    
    // Simulate charges from self-booking
    const selfBookings = patientBookingsDB.filter(b => b.source === BookingSource.Self);
    selfBookings.forEach(booking => {
        const superAdminCut = clinicSettingsDB.find(cs => cs.clinicId === booking.clinicId)?.policies.superAdminCutPct || 5; // Default 5%
        const amount = (booking.price || 100) * (superAdminCut / 100); 
         lines.push({
            type: 'charge',
            amount: amount,
            actorRole: UserRole.SuperAdmin,
            actorId: 'user-sup-01',
            actorName: 'SuperAdmin',
            ruleName: 'self_booking_fee',
            meta: {},
            createdAt: booking.createdAt,
        });
        totalIn += amount;
    });

    financeStatementDB = {
        _id: 'fin-stmt-01',
        clinicId: 'clinic-01',
        period: '2024-07',
        totals: {
            in: totalIn,
            out: 0, // No payouts simulated yet
            debt: totalIn,
        },
        lines: lines.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
    financeDataGenerated = true;
};

export const fetchFinanceStatement = async(clinicId: string, period: string): Promise<FinanceStatement | null> => {
    await delay(700);
    generateFinanceData();
    return financeStatementDB;
}

export const fetchClinicDebts = async(clinicId: string): Promise<DebtInfo> => {
    await delay(500);
    generateFinanceData();
    const debtByRole = financeStatementDB?.lines.reduce((acc, line) => {
        if(line.type === 'charge' && line.actorRole !== UserRole.SuperAdmin) {
            acc[line.actorRole] = (acc[line.actorRole] || 0) + line.amount;
        }
        return acc;
    }, Object.values(UserRole).reduce((acc, role) => ({...acc, [role]: 0}), {} as Record<UserRole, number>)) || Object.values(UserRole).reduce((acc, role) => ({...acc, [role]: 0}), {} as Record<UserRole, number>);

    return {
        totalDebt: financeStatementDB?.totals.debt || 0,
        debtByRole,
    };
}

// --- SUPERADMIN MODULE API ---
let policiesDB: Policy[] = [
    { key: 'referral.expiry.days', value: '3', description: 'Number of days after which a referral expires if not used.', group: 'Referrals' },
    { key: 'selfbook.discount.percentage', value: '20', description: 'Discount percentage for patients who book appointments themselves.', group: 'Finance' },
    { key: 'radiology.sr.bonus', value: '5', description: 'Extra bonus points for completing an urgent (SR) study.', group: 'Finance' },
    { key: 'system.maintenance.mode', value: 'false', description: 'Puts the entire system into maintenance mode.', group: 'System' },
];

export const fetchSuperAdminOverview = async (): Promise<SuperAdminOverview> => {
    await delay(800);
    generateDataForDay(new Date()); // Ensure today's data is present
    
    const totalRevenue = financeStatementDB?.totals.in || 0;
    const rads = usersDB.filter(u => u.roles.includes(UserRole.Radiologist));
    const radLoad = studiesDB.filter(s => s.radiologistId).length / (rads.length || 1);

    return {
        kpis: {
            totalPatients: queueDB.filter(q => formatDate(new Date(q.createdAt)) === formatDate(new Date())).length,
            totalRevenue: totalRevenue,
            avgRadLoad: parseFloat(radLoad.toFixed(1)),
            activeUsers: 15, // Mocked
        },
        forecast: {
            nextMonthRevenue: totalRevenue * 1.15,
            patientGrowth: 12, // in percent
        }
    };
};

export const fetchPolicies = async (): Promise<Policy[]> => {
    await delay(400);
    return policiesDB;
};

export const updatePolicy = async(key: string, value: string): Promise<Policy> => {
    await delay(500);
    const policyIndex = policiesDB.findIndex(p => p.key === key);
    if(policyIndex === -1) throw new Error("Policy not found");

    policiesDB[policyIndex].value = value;
    const updatedPolicy = policiesDB[policyIndex];
    
    setTimeout(() => broadcast('admin', 'sa.policy.changed', updatedPolicy), 100);
    
    // Side effect for demonstration
    if (updatedPolicy.key === 'referral.expiry.days') {
        console.log(`System notice: Referral expiry policy changed to ${value} days.`);
    }

    return updatedPolicy;
};

// --- RULES ENGINE API ---
let rulesDB: Rule[] = [
    {
        _id: 'rule-integrations',
        type: 'integrations',
        content: {
            "pacs": { "host": "pacs.clinic.local", "port": 11112, "aeTitle": "MEDMIS" },
            "billingApi": { "url": "https://billing.clinic.com/api/v2", "apiKey": "secret-key-goes-here" }
        },
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'rule-queue',
        type: 'queue',
        content: {
            "autoAssign": { "enabled": true, "strategy": "round-robin", "excludeOnCall": false },
            "escalation": { "std_to_sr_after_min": 120 }
        },
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'rule-sla',
        type: 'sla',
        content: {
            "deadlines_min": { "SR": 15, "STD": 240, "PLN": 1440 },
            "penalty": { "enabled": true, "per_hour_overdue": 5.5 }
        },
        updatedAt: new Date().toISOString()
    }
];

export const fetchRules = async(type: Rule['type']): Promise<Rule | null> => {
    await delay(400);
    return rulesDB.find(r => r.type === type) || null;
}

export const updateRule = async(type: Rule['type'], content: Rule['content']): Promise<Rule> => {
    await delay(600);
    const ruleIndex = rulesDB.findIndex(r => r.type === type);
    if(ruleIndex === -1) throw new Error("Rule not found");

    rulesDB[ruleIndex].content = content;
    rulesDB[ruleIndex].updatedAt = new Date().toISOString();
    const updatedRule = rulesDB[ruleIndex];
    
    setTimeout(() => broadcast('rules', 'rules.updated', updatedRule), 100);
    console.log(`Rule '${type}' updated. Broadcasting change.`);
    
    return updatedRule;
}


// --- BONUS & SLA API ---
let slaSettingsDB: SlaSetting[] = [
    { _id: 'sla-sr', priority: Priority.SR, targetMin: 15 },
    { _id: 'sla-std', priority: Priority.STD, targetMin: 120 },
    { _id: 'sla-pln', priority: Priority.PLN, targetMin: 1440 },
];

let bonusSettingsDB: BonusSetting[] = [
    { _id: 'bonus-rad-sr', ruleName: 'radiology_sr_fee', points: 30, splits: { toRadiologist: 0.8, toSuperAdmin: 0.2 } },
    { _id: 'bonus-rad-std', ruleName: 'radiology_std_fee', points: 20, splits: { toRadiologist: 0.8, toSuperAdmin: 0.2 } },
    { _id: 'bonus-rad-pln', ruleName: 'radiology_pln_fee', points: 15, splits: { toRadiologist: 0.8, toSuperAdmin: 0.2 } },
    { _id: 'bonus-referrer', ruleName: 'referrer_bonus', points: 110, splits: { toReferrer: 0.9, toSuperAdmin: 0.1 } },
];

export const fetchSlaSettings = async (): Promise<SlaSetting[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(slaSettingsDB)); // Deep copy
};

export const fetchBonusSettings = async (): Promise<BonusSetting[]> => {
    await delay(450);
    return JSON.parse(JSON.stringify(bonusSettingsDB)); // Deep copy
};

export const updateSlaSetting = async (id: string, targetMin: number): Promise<SlaSetting> => {
    await delay(500);
    const index = slaSettingsDB.findIndex(s => s._id === id);
    if (index === -1) throw new Error("SLA Setting not found");
    slaSettingsDB[index].targetMin = targetMin;
    const updated = slaSettingsDB[index];
    setTimeout(() => broadcast('sla', 'sla.changed', updated), 100);
    return updated;
};

export const updateBonusSetting = async (id: string, points: number, splits: Record<string, number>): Promise<BonusSetting> => {
    await delay(500);
    const index = bonusSettingsDB.findIndex(b => b._id === id);
    if (index === -1) throw new Error("Bonus Setting not found");
    bonusSettingsDB[index].points = points;
    bonusSettingsDB[index].splits = splits;
    const updated = bonusSettingsDB[index];
    setTimeout(() => broadcast('sla', 'bonus.changed', updated), 100);
    return updated;
};

export const runSlaDryRun = async (
    newSla: SlaSetting[],
    newBonuses: BonusSetting[]
): Promise<SlaDryRunResult> => {
    await delay(1200);
    
    // This is a simplified simulation
    const previousTotal = financeStatementDB?.totals.in || 0;
    const changeFactor = (Math.random() - 0.5) * 0.2; // -10% to +10% change
    const newTotal = previousTotal * (1 + changeFactor);

    return {
        affectedItems: Math.floor(queueDB.length * (Math.random() * 0.5 + 0.2)),
        totalBonusChange: newTotal - previousTotal,
        potentialBreaches: Math.floor(Math.random() * 5),
        previousTotal: previousTotal,
        newTotal: newTotal,
    };
};

// --- LANGUAGE MANAGER API ---

export const fetchLocales = async (): Promise<Record<Language, Record<string, string>>> => {
    await delay(400);
    return JSON.parse(JSON.stringify(i18nDB));
};

export const updateLocales = async (locales: Record<Language, Record<string, string>>): Promise<boolean> => {
    await delay(800);
    i18nDB = JSON.parse(JSON.stringify(locales)); // Overwrite the whole DB
    setTimeout(() => broadcast('i18n', 'i18n.updated', {}), 100);
    console.log("Locales updated and broadcast sent.");
    return true;
};

export const checkI18nCoverage = async (): Promise<I18nCoverage> => {
    await delay(600);
    const allKeys = new Set<string>();
    
    // Use English as the source of truth for all keys
    Object.keys(i18nDB[Language.EN]).forEach(key => allKeys.add(key));

    const totalKeys = allKeys.size;
    const coverage: I18nCoverage['coverage'] = {} as I18nCoverage['coverage'];

    (Object.keys(i18nDB) as Language[]).forEach(lang => {
        if (!i18nDB[lang]) {
             coverage[lang] = { count: 0, percentage: 0, missing: Array.from(allKeys) };
             return;
        };
        const langKeys = i18nDB[lang];
        const missing: string[] = [];
        allKeys.forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(langKeys, key) || langKeys[key] === '') {
                missing.push(key);
            }
        });
        const count = totalKeys - missing.length;
        coverage[lang] = {
            count,
            percentage: totalKeys > 0 ? parseFloat(((count / totalKeys) * 100).toFixed(1)) : 100,
            missing
        };
    });

    return { totalKeys, coverage };
};

// --- RBAC API ---
export const fetchUsers = async (): Promise<User[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(usersDB));
};

export const fetchPermissions = async (role: UserRole): Promise<Permissions> => {
    await delay(100);
    return permissionsDB[role] || { canSummarizeWithAI: false, canManageDicomPolicies: false, canUploadDicom: false, canViewDicom: false, canAccessMedRep: false, canAccessClinicAdmin: false, canManageRooms: false, canManageTariffs: false, canManageClinicSettings: false };
};

export const updateUserRoles = async (userId: string, roles: UserRole[]): Promise<User> => {
    await delay(500);
    const userIndex = usersDB.findIndex(u => u._id === userId);
    if (userIndex === -1) throw new Error("User not found");
    usersDB[userIndex].roles = roles;
    return usersDB[userIndex];
};

export const updatePermissions = async (role: UserRole, permissions: Permissions): Promise<Permissions> => {
    await delay(500);
    permissionsDB[role] = permissions;
    return permissionsDB[role];
};

// --- DICOM HUB API ---

// Helper to simulate signed URLs
const generateSignedUrl = (fileId: string, contentType: string, expirationHours: number = 1): string => {
    const expires = Date.now() + expirationHours * 60 * 60 * 1000;
    return `https://mockstorage.com/files/${fileId}?token=mock-jwt-${expires}&contentType=${contentType}`;
};

export const uploadDicomFile = async (studyId: string, file: Omit<FileMetadata, 'id' | 'uploadedAt' | 'signedUrl'>): Promise<FileMetadata> => {
    await delay(800);
    const generatedId = `dicom-${dicomIdCounter++}`;
    const generatedUploadedAt = new Date().toISOString();
    const generatedSignedUrl = generateSignedUrl(generatedId, file.contentType);
    
    const newFile: FileMetadata = {
        ...file,
        id: generatedId,
        uploadedAt: generatedUploadedAt,
        signedUrl: generatedSignedUrl, 
        storageKey: `path/to/study/${studyId}/${file.name}`,
        isRevoked: false,
    };
    dicomObjectsDB.push(newFile);

    const study = studiesDB.find(s => s._id === studyId);
    if (study) {
        study.dicom.objects.push(newFile);
        study.dicom.totalSize += newFile.size;
    }

    setTimeout(() => broadcast('dicom', 'dicom.uploaded', { file: newFile, studyId }), 100);
    return newFile;
};

export const fetchDicomPolicies = async (): Promise<DicomPolicy[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(dicomPoliciesDB));
};

export const updateDicomPolicy = async (policy: DicomPolicy): Promise<DicomPolicy> => {
    await delay(500);
    const index = dicomPoliciesDB.findIndex(p => p._id === policy._id);
    if (index === -1) throw new Error("Dicom policy not found");
    dicomPoliciesDB[index] = { ...policy };

    const relevantRole = policy.role;
    if (permissionsDB[relevantRole]) {
        permissionsDB[relevantRole].canViewDicom = policy.canView;
        permissionsDB[relevantRole].canUploadDicom = policy.canUpload;
    }

    setTimeout(() => broadcast('dicom', 'policy.updated', policy), 100);
    return dicomPoliciesDB[index];
};

export const fetchStudyDicomObjects = async (studyId: string): Promise<FileMetadata[]> => {
    await delay(400);
    return dicomObjectsDB.filter(obj => obj.storageKey?.includes(`study/${studyId}/`))
                        .sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const revokeDicomLink = async (fileId: string): Promise<FileMetadata> => {
    await delay(500);
    const index = dicomObjectsDB.findIndex(obj => obj.id === fileId);
    if (index === -1) throw new Error("DICOM object not found");

    dicomObjectsDB[index].isRevoked = true;
    dicomObjectsDB[index].signedUrl = `revoked-${dicomObjectsDB[index].signedUrl}`; 
    
    const updatedFile = dicomObjectsDB[index];
    setTimeout(() => broadcast('dicom', 'dicom.linkRevoked', updatedFile), 100);
    return updatedFile;
};

// --- MedRep Interface API ---

export const fetchMedRepKpis = async (userId: string, period: string): Promise<MedRepDash | null> => {
    await delay(500);
    const kpis = medRepDashDB.find(dash => dash.userId === userId && dash.period === period);
    return kpis ? JSON.parse(JSON.stringify(kpis)) : null;
};

export const fetchMedRepTasks = async (repId: string): Promise<MedRepTask[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(medRepTasksDB.filter(task => task.repId === repId)));
};

export const addMedRepTask = async (repId: string, title: string, dueAt: string, relatedClinicId?: string): Promise<MedRepTask> => {
    await delay(600);
    const now = new Date().toISOString();
    const newTask: MedRepTask = {
        _id: `medreptask-${medRepTaskIdCounter++}`,
        repId,
        title,
        dueAt,
        status: MedRepTaskStatus.Todo,
        relatedClinicId,
        createdAt: now,
        updatedAt: now,
    };
    medRepTasksDB.push(newTask);
    setTimeout(() => broadcast('medrep', 'medrep.task.created', newTask), 100);
    return JSON.parse(JSON.stringify(newTask));
};

export const updateMedRepTaskStatus = async (taskId: string, status: MedRepTaskStatus): Promise<MedRepTask> => {
    await delay(500);
    const index = medRepTasksDB.findIndex(task => task._id === taskId);
    if (index === -1) throw new Error("Task not found");

    medRepTasksDB[index] = { ...medRepTasksDB[index], status, updatedAt: new Date().toISOString() };
    const updatedTask = medRepTasksDB[index];
    setTimeout(() => broadcast('medrep', 'medrep.task.updated', updatedTask), 100);
    return JSON.parse(JSON.stringify(updatedTask));
};

export const fetchMedRepChats = async (repId: string): Promise<MedRepChat[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(medRepChatsDB.filter(chat => chat.repId === repId)));
};

export const sendMedRepChatMessage = async (chatId: string, senderId: string, text: string): Promise<MedRepChat> => {
    await delay(300);
    const chatIndex = medRepChatsDB.findIndex(chat => chat._id === chatId);
    if (chatIndex === -1) throw new Error("Chat not found");

    const sender = usersDB.find(u => u._id === senderId);
    if (!sender) throw new Error("Sender not found");

    const newMessage: MedRepMessage = {
        _id: `msg-${medRepMessageIdCounter++}`,
        senderId,
        senderRole: sender.roles[0], // Assuming first role for simplicity
        text,
        timestamp: new Date().toISOString(),
    };

    medRepChatsDB[chatIndex].messages.push(newMessage);
    medRepChatsDB[chatIndex].updatedAt = new Date().toISOString();
    const updatedChat = medRepChatsDB[chatIndex];
    setTimeout(() => broadcast('medrep', 'medrep.chat.msg', { chatId, message: newMessage }), 100);
    return JSON.parse(JSON.stringify(updatedChat));
};


// --- Clinic Module API ---

export const fetchClinics = async (): Promise<Clinic[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(clinicsDB.filter(c => c.tenantId === tenantId)));
};

export const createClinic = async (clinic: Omit<Clinic, '_id' | 'tenantId' | 'createdAt'>): Promise<Clinic> => {
    await delay(700);
    const newClinic: Clinic = {
        _id: `clinic-${clinicIdCounter++}`,
        tenantId,
        createdAt: new Date().toISOString(),
        status: ClinicStatus.Active,
        ...clinic,
    };
    clinicsDB.push(newClinic);
    broadcast('clinic', 'clinic.created', newClinic);
    return JSON.parse(JSON.stringify(newClinic));
};

export const updateClinic = async (id: string, updates: Partial<Omit<Clinic, '_id' | 'tenantId' | 'createdAt'>>): Promise<Clinic> => {
    await delay(600);
    const index = clinicsDB.findIndex(c => c._id === id && c.tenantId === tenantId);
    if (index === -1) throw new Error("Clinic not found");
    clinicsDB[index] = { ...clinicsDB[index], ...updates };
    const updatedClinic = clinicsDB[index];
    broadcast('clinic', 'clinic.updated', updatedClinic);
    return JSON.parse(JSON.stringify(updatedClinic));
};

export const suspendClinic = async (id: string, status: ClinicStatus): Promise<Clinic> => {
    await delay(500);
    const index = clinicsDB.findIndex(c => c._id === id && c.tenantId === tenantId);
    if (index === -1) throw new Error("Clinic not found");
    clinicsDB[index].status = status;
    const updatedClinic = clinicsDB[index];
    broadcast('clinic', 'clinic.updated', updatedClinic);
    return JSON.parse(JSON.stringify(updatedClinic));
};


export const fetchDepartments = async (clinicId: string): Promise<Department[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(departmentsDB.filter(d => d.clinicId === clinicId && d.tenantId === tenantId)));
};

export const createDepartment = async (department: Omit<Department, '_id' | 'tenantId' | 'createdAt'>): Promise<Department> => {
    await delay(700);
    const newDepartment: Department = {
        _id: `dep-${departmentIdCounter++}`,
        tenantId,
        createdAt: new Date().toISOString(),
        ...department,
    };
    departmentsDB.push(newDepartment);
    broadcast('clinic', 'department.created', newDepartment, newDepartment.clinicId);
    return JSON.parse(JSON.stringify(newDepartment));
};

export const updateDepartment = async (id: string, updates: Partial<Omit<Department, '_id' | 'tenantId' | 'createdAt'>>): Promise<Department> => {
    await delay(600);
    const index = departmentsDB.findIndex(d => d._id === id && d.tenantId === tenantId);
    if (index === -1) throw new Error("Department not found");
    departmentsDB[index] = { ...departmentsDB[index], ...updates };
    const updatedDepartment = departmentsDB[index];
    broadcast('clinic', 'department.updated', updatedDepartment, updatedDepartment.clinicId);
    return JSON.parse(JSON.stringify(updatedDepartment));
};


export const fetchClinicRooms = async (clinicId: string, modality?: RoomModality, status?: RoomStatus): Promise<Room[]> => {
    await delay(400);
    let filteredRooms = roomsDB.filter(r => r.clinicId === clinicId && r.tenantId === tenantId);
    if (modality) filteredRooms = filteredRooms.filter(r => r.modality === modality);
    if (status) filteredRooms = filteredRooms.filter(r => r.status === status);
    return JSON.parse(JSON.stringify(filteredRooms));
};

export const createRoom = async (room: Omit<Room, '_id' | 'tenantId' | 'createdAt' | 'deviceIds' | 'status' | 'tags'>): Promise<Room> => {
    await delay(800);
    const newRoom: Room = {
        _id: `room-${roomIdCounter++}`,
        tenantId,
        createdAt: new Date().toISOString(),
        deviceIds: [], // Start with no devices
        status: RoomStatus.Up, // Default status
        tags: [], // Start with no tags
        ...room,
    };
    roomsDB.push(newRoom);
    broadcast('clinic', 'room.created', newRoom, newRoom.clinicId);
    return JSON.parse(JSON.stringify(newRoom));
};

export const updateRoom = async (id: string, updates: Partial<Omit<Room, '_id' | 'tenantId' | 'createdAt'>>): Promise<Room> => {
    await delay(700);
    const index = roomsDB.findIndex(r => r._id === id && r.tenantId === tenantId);
    if (index === -1) throw new Error("Room not found");

    if (updates.workHours && hasOverlap(updates.workHours)) {
        throw new Error("Work hours cannot overlap.");
    }
    
    roomsDB[index] = { ...roomsDB[index], ...updates };
    const updatedRoom = roomsDB[index];
    broadcast('clinic', 'room.updated', updatedRoom, updatedRoom.clinicId);
    broadcast(getRoomWsChannel(updatedRoom._id), 'room.capacity.changed', { roomId: updatedRoom._id, newCapacity: updatedRoom.capacityPerHour }, updatedRoom._id);
    return JSON.parse(JSON.stringify(updatedRoom));
};

export const updateRoomStatus = async (id: string, status: RoomStatus): Promise<Room> => {
    await delay(500);
    const index = roomsDB.findIndex(r => r._id === id && r.tenantId === tenantId);
    if (index === -1) throw new Error("Room not found");
    roomsDB[index].status = status;
    const updatedRoom = roomsDB[index];
    broadcast('clinic', 'room.status.changed', updatedRoom, updatedRoom.clinicId);
    broadcast(getRoomWsChannel(updatedRoom._id), 'room.status.changed', { roomId: updatedRoom._id, newStatus: updatedRoom.status }, updatedRoom._id);
    return JSON.parse(JSON.stringify(updatedRoom));
};

export const fetchDevices = async (roomId: string): Promise<Device[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(devicesDB.filter(d => d.roomId === roomId && d.tenantId === tenantId)));
};

export const updateDeviceStatus = async (id: string, status: DeviceStatus): Promise<Device> => {
    await delay(500);
    const index = devicesDB.findIndex(d => d._id === id && d.tenantId === tenantId);
    if (index === -1) throw new Error("Device not found");
    devicesDB[index].status = status;
    const updatedDevice = devicesDB[index];
    // This could also broadcast to a specific device channel if needed
    broadcast('clinic', 'device.status.changed', updatedDevice, updatedDevice.roomId);
    return JSON.parse(JSON.stringify(updatedDevice));
};


export const fetchRoomSchedules = async (roomId: string, from: string, to: string): Promise<RoomSchedule[]> => {
    await delay(500);
    // Generate data if not already present
    const startDate = new Date(from);
    const endDate = new Date(to);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    generateDataForPeriod(startDate, days);

    return JSON.parse(JSON.stringify(roomSchedulesDB.filter(rs =>
        rs.roomId === roomId && rs.tenantId === tenantId && rs.date >= from && rs.date <= to
    )));
};

export const updateRoomSchedules = async (roomId: string, date: string, newSlots: RoomSchedule['slots']): Promise<RoomSchedule> => {
    await delay(1000);
    const room = roomsDB.find(r => r._id === roomId);
    if (!room) throw new Error("Room not found");

    if (hasOverlap(newSlots)) {
        throw new Error("Slots cannot overlap within the same room for the same day.");
    }

    let schedule = roomSchedulesDB.find(rs => rs.roomId === roomId && rs.date === date && rs.tenantId === tenantId);
    if (schedule) {
        schedule.slots = newSlots;
    } else {
        schedule = {
            _id: `schedule-${date}-${roomId}`,
            tenantId,
            clinicId: room.clinicId,
            roomId,
            date,
            slots: newSlots,
            overrides: [],
            blackouts: [],
        };
        roomSchedulesDB.push(schedule);
    }
    // Update slotsDB to reflect new schedule
    slotsDB = slotsDB.filter(s => !(s.roomId === roomId && s.date === date));
    newSlots.forEach(newSlot => {
        slotsDB.push({
            _id: `slot-${date}-${roomId}-${newSlot.start}`,
            clinicId: room.clinicId,
            roomId,
            roomName: room.name,
            modality: room.modality,
            date,
            startAt: newSlot.start,
            endAt: newSlot.end,
            capacity: newSlot.capacity,
            taken: newSlot.booked,
        });
    });

    broadcast('clinic', 'room.schedule.updated', schedule, room.clinicId);
    broadcast(getRoomWsChannel(roomId), 'room.schedule.updated', schedule, roomId);
    return JSON.parse(JSON.stringify(schedule));
};

export const createBlackout = async (roomId: string, date: string, blackout: Omit<Blackout, '_id'>): Promise<RoomSchedule> => {
    await delay(700);
    const room = roomsDB.find(r => r._id === roomId);
    if (!room) throw new Error("Room not found");

    let schedule = roomSchedulesDB.find(rs => rs.roomId === roomId && rs.date === date && rs.tenantId === tenantId);
    if (!schedule) {
        schedule = { _id: `schedule-${date}-${roomId}`, tenantId, clinicId: room.clinicId, roomId, date, slots: [], overrides: [], blackouts: [] };
        roomSchedulesDB.push(schedule);
    }

    const newBlackout: Blackout = { _id: `blackout-${Date.now()}`, ...blackout };
    schedule.blackouts.push(newBlackout);

    // Remove any slots that overlap with the blackout
    schedule.slots = schedule.slots.filter(slot => 
        !(slot.start < newBlackout.to && newBlackout.from < slot.end)
    );
    // Remove from global slotsDB as well
    slotsDB = slotsDB.filter(s => 
        !(s.roomId === roomId && s.date === date && s.startAt < newBlackout.to && newBlackout.from < s.endAt)
    );


    broadcast('clinic', 'clinic.blackout.created', newBlackout, room.clinicId);
    broadcast(getRoomWsChannel(roomId), 'room.blackout.created', newBlackout, roomId);
    broadcast(getRoomWsChannel(roomId), 'room.schedule.updated', schedule, roomId); // Send updated schedule
    return JSON.parse(JSON.stringify(schedule));
};

export const deleteBlackout = async (roomId: string, date: string, blackoutId: string): Promise<RoomSchedule> => {
    await delay(500);
    let schedule = roomSchedulesDB.find(rs => rs.roomId === roomId && rs.date === date && rs.tenantId === tenantId);
    if (!schedule) throw new Error("Schedule or blackout not found");

    const initialBlackoutCount = schedule.blackouts.length;
    schedule.blackouts = schedule.blackouts.filter(b => b._id !== blackoutId);
    if (schedule.blackouts.length === initialBlackoutCount) throw new Error("Blackout not found");

    // Re-generate slots for the removed blackout period (simplified - could be more complex with original workHours)
    const room = roomsDB.find(r => r._id === roomId);
    if (room) {
        const removedBlackout = JSON.parse(JSON.stringify(schedule.blackouts.find(b => b._id === blackoutId))); // Get original blackout
        const workHour = room.workHours.find(wh => wh.weekday === new Date(date).getDay());
        if (workHour) {
             const [startHour, startMinute] = workHour.start.split(':').map(Number);
             const [endHour, endMinute] = workHour.end.split(':').map(Number);
            // Re-add slots for the period (simplified to just re-generate without conflict checks)
            const newSlotsForPeriod = [];
            for (let hour = startHour; hour < endHour + 1; hour++) {
                if(hour === endHour && endMinute === 0) continue;
                const minutesInHour = (hour === startHour ? startMinute : 0);
                for (let minute = minutesInHour; minute < (hour === endHour ? endMinute : 60); minute += Math.floor(60 / room.capacityPerHour)) {
                    const startAt = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    const interval = Math.floor(60 / room.capacityPerHour);
                    const endAtDate = new Date(`${date}T${startAt}`);
                    endAtDate.setMinutes(endAtDate.getMinutes() + interval);
                    const endAt = `${String(endAtDate.getHours()).padStart(2, '0')}:${String(endAtDate.getMinutes()).padStart(2, '0')}`;

                    if (removedBlackout && !(startAt < removedBlackout.to && removedBlackout.from < endAt)) { // Only add if not overlapping with *other* existing blackouts
                        // For simplicity just regenerate all for the day
                        const existingSlot = schedule.slots.find(s => s.start === startAt);
                        if (!existingSlot) {
                           newSlotsForPeriod.push({ start: startAt, end: endAt, capacity: 1, booked: 0 }); // Assuming default capacity/booked
                        }
                    }
                }
            }
             schedule.slots = [...schedule.slots, ...newSlotsForPeriod].sort((a,b) => a.start.localeCompare(b.start));
             // Also update slotsDB to reflect the newly available slots
             newSlotsForPeriod.forEach(ns => slotsDB.push({ _id: `slot-${date}-${roomId}-${ns.start}`, clinicId: room.clinicId, roomId, roomName: room.name, modality: room.modality, date, startAt: ns.start, endAt: ns.end, capacity: ns.capacity, taken: ns.booked }));
        }
    }


    broadcast('clinic', 'clinic.blackout.removed', { roomId, date, blackoutId }, room.clinicId);
    broadcast(getRoomWsChannel(roomId), 'room.blackout.removed', { roomId, date, blackoutId }, roomId);
    broadcast(getRoomWsChannel(roomId), 'room.schedule.updated', schedule, roomId); // Send updated schedule
    return JSON.parse(JSON.stringify(schedule));
};


export const fetchAvailability = async (clinicId: string, days: 1 | 3 | 7 | 30, roomId?: string, referrerView: boolean = false): Promise<Record<string, AvailabilityQuantum[]>> => {
    await delay(600);
    const startDate = new Date();
    generateDataForPeriod(startDate, days);

    const relevantRooms = roomId ? roomsDB.filter(r => r._id === roomId && r.clinicId === clinicId) : roomsDB.filter(r => r.clinicId === clinicId);
    
    const settings = clinicSettingsDB.find(cs => cs.clinicId === clinicId)?.policies;
    const refSlotsTodayVisibilityPct = settings?.refSlotsTodayVisibilityPct || 50;
    const refSlotsTodayMinOffsetMin = settings?.refSlotsTodayMinOffsetMin || 60;

    const result: Record<string, AvailabilityQuantum[]> = {};

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = formatDate(date);

        const dailySlots = slotsDB.filter(s => s.clinicId === clinicId && s.date === dateStr && (!roomId || s.roomId === roomId));
        const dailySchedule = roomSchedulesDB.filter(rs => rs.clinicId === clinicId && rs.date === dateStr && (!roomId || rs.roomId === roomId));

        const quantaMap: Record<string, { total: number, booked: number, count: number }> = {}; // Map by start time of a quantum

        relevantRooms.forEach(room => {
            const roomWorkHours = room.workHours.find(wh => wh.weekday === date.getDay());
            if (!roomWorkHours) return;

            const [startHour, startMinute] = roomWorkHours.start.split(':').map(Number);
            const [endHour, endMinute] = roomWorkHours.end.split(':').map(Number);

            for (let h = startHour; h <= endHour; h++) {
                const quantumStart = `${String(h).padStart(2, '0')}:${String(0).padStart(2, '0')}`; // Always :00 for hourly quantum
                const quantumEnd = `${String(h + 1).padStart(2, '0')}:${String(0).padStart(2, '0')}`;

                const slotsInQuantum = dailySlots.filter(s => {
                    const slotStart = s.startAt;
                    const slotEnd = s.endAt;
                    return slotStart < quantumEnd && quantumStart < slotEnd;
                });

                let totalCapacity = 0;
                let totalBooked = 0;

                slotsInQuantum.forEach(s => {
                    totalCapacity += s.capacity;
                    totalBooked += s.taken;
                });

                if (!quantaMap[quantumStart]) {
                    quantaMap[quantumStart] = { total: 0, booked: 0, count: 0 };
                }
                quantaMap[quantumStart].total += totalCapacity;
                quantaMap[quantumStart].booked += totalBooked;
                quantaMap[quantumStart].count++; // Count rooms contributing to this quantum
            }
        });

        const hourlyQuanta: AvailabilityQuantum[] = Object.keys(quantaMap).sort().map(ts => {
            const { total, booked, count } = quantaMap[ts];
            const free = total - booked;
            const loadPct = total > 0 ? (booked / total) * 100 : 0;
            return { ts, totalCapacity: total, booked, free, loadPct: parseFloat(loadPct.toFixed(1)) };
        });

        // Apply referrer view filters
        if (referrerView) {
            const now = new Date();
            const nowPlusOffset = new Date(now.getTime() + refSlotsTodayMinOffsetMin * 60 * 1000);
            
            result[dateStr] = hourlyQuanta.filter(q => {
                const quantumDateTime = new Date(`${dateStr}T${q.ts}`);
                
                // Filter by offset
                if (dateStr === formatDate(now) && quantumDateTime < nowPlusOffset) return false;

                // Apply 50% visibility (simplified: if more than 50% are free, show it)
                if (dateStr === formatDate(now) && q.loadPct > refSlotsTodayVisibilityPct) return false;
                
                return q.free > 0; // Only show if there are free slots
            });
        } else {
            result[dateStr] = hourlyQuanta;
        }
    }
    return JSON.parse(JSON.stringify(result));
};

export const compareRoomsWorkload = async (clinicId: string, modality: RoomModality, M: 7 | 30): Promise<RoomCompareKpi[]> => {
    await delay(800);
    const startDate = new Date();
    generateDataForPeriod(startDate, M);

    const relevantRooms = roomsDB.filter(r => r.clinicId === clinicId && r.tenantId === tenantId && r.modality === modality);
    
    const dateStrings: string[] = [];
    for(let i=0; i < M; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dateStrings.push(formatDate(d));
    }

    // FIX: Completed the map callback to return RoomCompareKpi objects.
    const comparisonData: RoomCompareKpi[] = relevantRooms.map((room: Room) => {
        // Calculate total capacity, total booked, and average load for the period
        const roomSlotsForPeriod = slotsDB.filter(s => dateStrings.includes(s.date) && s.roomId === room._id);
        let totalCapacity = 0;
        let totalBooked = 0;

        roomSlotsForPeriod.forEach(s => {
            totalCapacity += s.capacity;
            totalBooked += s.taken;
        });

        const avgLoadPct = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

        // Return a RoomCompareKpi object
        return {
            roomId: room._id,
            roomName: room.name,
            modality: room.modality,
            avgLoadPct: parseFloat(avgLoadPct.toFixed(1)),
            totalBooked: totalBooked,
            totalCapacity: totalCapacity,
        };
    });
    return comparisonData;
};
