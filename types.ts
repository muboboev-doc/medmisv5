




export enum PatientBookingStatus {
    Booked = 'booked',
    Paid = 'paid',
    Done = 'done',
    Cancelled = 'cancelled',
}

export enum BookingSource {
    Referral = 'referral',
    Self = 'self',
}

export interface PatientBooking {
    _id: string;
    patientId: string;
    clinicId: string;
    roomId: string;
    roomName: string;
    modality: string;
    slotId: string;
    startAt: string; // HH:mm
    date: string; // YYYY-MM-DD
    status: PatientBookingStatus;
    source: BookingSource;
    referralId?: string;
    createdAt: string; // ISO DateTime
    price?: number;
    discount?: number;
    finalAmount?: number;
}

export interface PatientReport {
    _id: string;
    bookingId: string;
    reportUrl: string;
    createdAt: string; // ISO DateTime
    studyName: string; // e.g., "MRI Brain"
}


export interface WorkHour {
    weekday: number; // 0 for Sunday, 1 for Monday, etc.
    start: string; // HH:mm
    end: string; // HH:mm
}

export interface Slot {
  _id: string;
  clinicId: string;
  roomId: string;
  roomName: string;
  modality: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  startAt: string; // HH:mm
  endAt: string; // HH:mm
  capacity: number;
  taken: number;
}

export interface Patient {
    _id: string;
    maskedName: string;
    age?: number;
}

export interface FileMetadata {
    id: string;
    name: string;
    size: number;
    contentType: string;
    signedUrl: string;
    uploadedAt: string;
    // New fields for DICOM hub management
    storageKey?: string; // e.g., path in cloud storage
    isRevoked?: boolean; // For tracking revoked links
}

// New: Define StudyStatus enum
export enum StudyStatus {
    InProgress = 'in_progress',
    Uploaded = 'uploaded',
    Finished = 'finished',
    Described = 'described', // When radiologist has described it
}

export interface Study {
    _id: string;
    queueItemId: string;
    clinicId: string;
    roomId: string;
    slotId: string;
    modality: string;
    operatorId: string;
    radiologistId?: string;
    startedAt?: string;
    finishedAt?: string;
    dicom: {
        objects: FileMetadata[];
        totalSize: number;
    };
    docs: FileMetadata[];
    status: StudyStatus;
}

// New: Define Priority enum
export enum Priority {
    SR = 'SR', // Urgent
    STD = 'STD', // Standard
    PLN = 'PLN', // Planned
}

// New: Define QueueStatus enum
export enum QueueStatus {
    Queued = 'queued',
    InProgress = 'in_progress',
    Described = 'described',
    Done = 'done', // Added based on context in patient app / manager panel
    Cancelled = 'cancelled', // Added based on patient app
    NoShow = 'no_show',
}

export interface QueueItem {
  _id: string;
  patient: Patient;
  clinicId: string;
  roomId: string; // Add roomId to QueueItem
  roomName: string;
  slotId: string;
  startAt: string; // HH:mm
  priority: Priority;
  status: QueueStatus;
  complaints: string;
  attachments?: { name: string, type: string, size: number }[];
  referrerId?: string;
  referralId?: string; // Link to the referral
  createdAt: string; // ISO DateTime string
  studyId?: string; // Link to the study
  radiologistId?: string;
  assignedBy?: string;
}

// New: Define ReferralStatus enum
export enum ReferralStatus {
    Yellow = 'yellow', // Waiting / Pending
    Green = 'green',   // Completed / Used
    Red = 'red',       // Expired / Cancelled
}

export interface Referral {
    _id: string;
    referrerId: string;
    clinicId: string;
    roomId: string;
    slotId: string;
    qrCode: string;
    shortCode: string;
    patientHint: {
        complaint: string;
        name: string;
    };
    status: ReferralStatus;
    createdAt: string;
    updatedAt: string;
}

export interface StudyDetails extends Study {
    patient: Patient;
    queueItem: Omit<QueueItem, 'patient'>;
    radiologistName?: string;
}

export interface ManagerKpis {
    slaCompliance: number;
    avgWaitTime: string; // e.g., "1h 15m"
    radLoad: Record<string, number>;
    queueCounts: Record<Priority, number>;
}

// Finance Module Types
export interface StatementLine {
    type: 'charge' | 'payout' | 'correction';
    amount: number;
    actorRole: UserRole;
    actorId: string;
    actorName: string;
    ruleName: string; // e.g., 'radiology_sr_fee', 'referrer_bonus'
    meta: {
        queueItemId?: string;
        referralId?: string;
        patientName?: string;
    };
    createdAt: string;
}

export interface FinanceStatement {
    _id: string;
    clinicId: string;
    period: string; // e.g., '2024-07'
    totals: {
        in: number;
        out: number;
        debt: number;
    };
    lines: StatementLine[];
}

export interface ScoreRule {
    name: string;
    points: number;
    split: Record<string, number>; // e.g., { toRadiologist: 0.8, toSuperAdmin: 0.2 }
}

export interface Payout {
    _id: string;
    targetRole: UserRole;
    targetId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}

export interface DebtInfo {
    totalDebt: number;
    debtByRole: Record<UserRole, number>;
}

// SuperAdmin Module Types
export interface Policy {
    key: string;
    value: string;
    description: string;
    group: 'Referrals' | 'Finance' | 'System';
}

export interface SuperAdminOverview {
    kpis: {
        totalPatients: number;
        totalRevenue: number;
        avgRadLoad: number;
        activeUsers: number;
    };
    forecast: {
        nextMonthRevenue: number;
        patientGrowth: number;
    };
}

// Rules Engine Module Types
export interface Rule {
    _id: string;
    type: 'integrations' | 'queue' | 'sla';
    content: Record<string, any>;
    updatedAt: string;
}

// Bonus & SLA Module Types
export interface SlaSetting {
    _id: string;
    priority: Priority;
    targetMin: number;
}

export interface BonusSetting {
    _id: string;
    ruleName: string;
    points: number;
    splits: Record<string, number>; // e.g., { "toRadiologist": 0.8, "toSuperAdmin": 0.2 }
}

export interface SlaDryRunResult {
    affectedItems: number;
    totalBonusChange: number;
    potentialBreaches: number;
    previousTotal: number;
    newTotal: number;
}

// New: Define Language enum
export enum Language {
    EN = 'en',
    RU = 'ru',
    UZ = 'uz',
    KK = 'kk',
}

// Language Manager Module Types
export interface I18nCoverage {
    totalKeys: number;
    coverage: Record<Language, { count: number; percentage: number; missing: string[] }>;
}

// RBAC Module Types
export interface User {
    _id: string;
    name: string;
    email: string;
    roles: UserRole[];
    status: 'active' | 'disabled';
    createdAt: string;
}

export enum UserRole {
    SuperAdmin = 'superAdmin',
    Admin = 'admin',
    Manager = 'manager',
    Radiologist = 'radiologist',
    Referrer = 'referrer',
    Patient = 'patient',
    Finance = 'finance',
    MrtOperator = 'mrtOperator',
    Reception = 'reception',
    MedRep = 'medRep',
    ClinicAdmin = 'clinicAdmin', // New role
}

export enum Module {
    ReceptionQueue = 'receptionQueue',
    MrtRoom = 'mrtRoom',
    RadiologyWorkbench = 'radiologyWorkbench',
    ReferrerPortal = 'referrerPortal',
    PatientApp = 'patientApp',
    ManagerPanel = 'managerPanel',
    ClinicFinance = 'clinicFinance',
    SuperAdmin = 'superAdmin',
    RoleAccess = 'roleAccess',
    RulesEngine = 'rulesEngine',
    BonusSla = 'bonusSla',
    LanguageManager = 'languageManager',
    ModuleConstructor = 'moduleConstructor',
    TestSandbox = 'testSandbox',
    DicomHub = 'dicomHub',
    MedRepInterface = 'medRepInterface',
    Clinic = 'clinic', // New module
}


export interface Permissions {
    canSummarizeWithAI: boolean;
    canManageDicomPolicies: boolean;
    canUploadDicom: boolean;
    canViewDicom: boolean;
    canAccessMedRep: boolean;
    canAccessClinicAdmin: boolean; // New permission
    canManageRooms: boolean; // New permission
    canManageTariffs: boolean; // New permission
    canManageClinicSettings: boolean; // New permission
}

export interface DicomPolicy {
    _id: string; // Role-based ID, e.g., 'policy-radiologist'
    role: UserRole;
    canView: boolean;
    canUpload: boolean;
}

// MedRep Module Types
export enum MedRepTaskStatus {
    Todo = 'todo',
    Doing = 'doing',
    Done = 'done',
}

export interface MedRepDash {
    _id: string;
    userId: string;
    period: string; // e.g., '2024-07'
    kpis: {
        referrals: {
            total: number;
            accepted: number;
            converted: number;
        };
        conversions: {
            referralToBooking: number; // percentage
        };
        revenue: {
            total: number;
            fromReferrals: number;
        };
    };
    plan: {
        referrals: number;
        revenue: number;
    };
    actual: {
        referrals: number;
        revenue: number;
    };
    updatedAt: string;
}

export interface MedRepTask {
    _id: string;
    repId: string;
    title: string;
    dueAt: string; // ISO Date string
    status: MedRepTaskStatus;
    relatedClinicId?: string; // Optional, for tasks related to a specific clinic
    createdAt: string; // ISO DateTime
    updatedAt: string; // ISO DateTime
}

export interface MedRepMessage {
    _id: string;
    senderId: string;
    senderRole: UserRole;
    text: string;
    timestamp: string; // ISO DateTime
}

export interface MedRepChat {
    _id: string;
    repId: string; // The MedRep user ID this chat belongs to
    topic: string; // e.g., "Clinic Alpha Visit Feedback", "New Product Launch"
    participants: { id: string, name: string, role: UserRole }[];
    messages: MedRepMessage[];
    createdAt: string; // ISO DateTime
    updatedAt: string; // ISO DateTime
}

// Clinic Module Types
export enum ClinicStatus {
    Active = 'active',
    Suspended = 'suspended',
}

export interface Clinic {
    _id: string;
    tenantId: string;
    code: string;
    name: string;
    address: string;
    phones: string[];
    email: string;
    geo?: { lat: number; lng: number };
    status: ClinicStatus;
    createdAt: string;
}

export enum DepartmentModality {
    MRI = 'MRI',
    CT = 'CT',
    XRAY = 'X-RAY',
    US = 'US',
    LAB = 'LAB', // Added for completeness, might not be used in rooms
}

export interface Department {
    _id: string;
    tenantId: string;
    clinicId: string;
    name: string;
    code: string;
    modalities: DepartmentModality[];
    createdAt: string;
}

export enum RoomModality {
    MRI = 'MRI',
    CT = 'CT',
    XRAY = 'X-RAY',
    US = 'US',
}

export enum RoomStatus {
    Up = 'up',
    Down = 'down',
    Maintenance = 'maintenance',
}

export interface Room {
    _id: string;
    tenantId: string;
    clinicId: string;
    departmentId: string;
    name: string;
    code: string;
    modality: RoomModality;
    deviceIds: string[];
    status: RoomStatus;
    capacityPerHour: number; // int
    workHours: WorkHour[]; // {mon..sun:[{start,end}]}
    tags: string[];
    createdAt: string;
}

export enum DeviceStatus {
    Up = 'up',
    Down = 'down',
    Maintenance = 'maintenance',
}

export interface Device {
    _id: string;
    tenantId: string;
    roomId: string;
    vendor: string;
    model: string;
    serial: string;
    status: DeviceStatus;
    uptimePct: number;
    lastServiceAt: string;
    nextServiceAt: string;
    notes: string;
}

export interface Blackout {
    _id: string;
    reason?: string;
    from: string; // HH:mm
    to: string; // HH:mm
}

export interface RoomSchedule {
    _id: string;
    tenantId: string;
    clinicId: string;
    roomId: string;
    date: string; // YYYY-MM-DD
    slots: {
        start: string; // HH:mm
        end: string; // HH:mm
        capacity: number; // max for this slot
        booked: number; // count
    }[];
    overrides: any[]; // Specific slot overrides not detailed in prompt, keeping as any
    blackouts: Blackout[]; // New field for blackouts
}

export enum PayerType {
    Self = 'self',
    Insurance = 'insurance',
    Corporate = 'corporate',
}

export interface Tariff {
    _id: string;
    tenantId: string;
    clinicId: string;
    modality: RoomModality;
    serviceCode: string;
    title: string;
    price: number;
    currency: string;
    effectiveFrom: string; // YYYY-MM-DD
    effectiveTo: string; // YYYY-MM-DD
    contractId?: string;
    discounts?: {
        selfBookingPct?: number;
        urgentMarkupPct?: number;
    };
}

export interface Contract {
    _id: string;
    tenantId: string;
    clinicId: string;
    payerType: PayerType;
    payerName: string;
    terms: Record<string, any>; // Specific terms not detailed
    validFrom: string; // YYYY-MM-DD
    validTo: string; // YYYY-MM-DD
    status: 'active' | 'expired';
}

export interface ClinicSettings {
    _id: string;
    tenantId: string;
    clinicId: string;
    policies: {
        refSlotsTodayVisibilityPct: number; // int=50
        refSlotsTodayMinOffsetMin: number; // int=60
        perHourLimit: number; // int
        selfBookingDiscountPct: number; // int=20
        superAdminCutPct: number; // int=5
    };
    localization: {
        defaultLang: Language;
    };
}

export interface Staff {
    _id: string;
    tenantId: string;
    clinicId: string;
    userId: string;
    role: UserRole; // clinic_admin|manager|radiologist|mrt_operator|finance|referrer|medrep
    active: boolean;
    skills: string[];
    roomsAllowed: string[]; // roomIds
    schedulePrefs: Record<string, any>;
}

// For GET /availability API
export interface AvailabilityQuantum {
    ts: string; // HH:mm, start of quantum
    totalCapacity: number;
    booked: number;
    free: number;
    loadPct: number;
}

// For GET /rooms/compare API
export interface RoomCompareKpi {
    roomId: string;
    roomName: string;
    modality: RoomModality;
    avgLoadPct: number;
    totalBooked: number;
    totalCapacity: number;
}

// Interface to correctly type translation objects, allowing for nested objects like 'roles'
// FIX: Update the TranslationMap interface to allow for optional nested objects like modules, ensuring broader compatibility across components while keeping 'roles' mandatory.
export interface TranslationMap {
    [key: string]: string | Record<string, string>;
    roles: Record<UserRole, string>;
    modules?: Record<Module, string>;
    // Add other nested objects here if they exist
    // Based on the provided constants, other enum values (like RoomModality, RoomStatus) are
    // direct string keys in the translation object, so they are covered by `Record<string, string>`.
}