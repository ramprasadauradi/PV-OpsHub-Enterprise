/**
 * PV-OpsHub seed constants — 3 tenants, 24 users/tenant, report types, SLA rules.
 * Password for all users: Demo@123456!
 */

export const TENANTS = [
    {
        id: 'indus-pv',
        name: 'Indus PV Services Pvt. Ltd.',
        region: 'INDIA' as const,
        timezone: 'Asia/Kolkata',
        domain: 'induspv.com',
        holdAutoReleaseHours: 24,
        maxReassignments: 3,
    },
    {
        id: 'eurosafe',
        name: 'EuroSafe Clinical Research GmbH',
        region: 'EU' as const,
        timezone: 'Europe/Berlin',
        domain: 'eurosafe.de',
        holdAutoReleaseHours: 12,
        maxReassignments: 3,
    },
    {
        id: 'pharmasafety',
        name: 'PharmaSafety Solutions Inc.',
        region: 'US' as const,
        timezone: 'America/New_York',
        domain: 'pharmasafety.us',
        holdAutoReleaseHours: 48,
        maxReassignments: 5,
    },
] as const

export const THERAPEUTIC_AREAS = [
    'Oncology', 'Cardiology', 'Neurology', 'Immunology', 'Endocrinology',
    'Infectious Disease', 'Dermatology', 'Respiratory', 'Gastroenterology',
]

export const PRODUCTS_BY_AREA: Record<string, string[]> = {
    Oncology: ['Pembrolizumab', 'Nivolumab'],
    Cardiology: ['Atorvastatin', 'Rivaroxaban'],
    Neurology: ['Natalizumab', 'Ocrelizumab'],
    Immunology: ['Adalimumab', 'Etanercept'],
    Endocrinology: ['Semaglutide', 'Insulin Glargine'],
    'Infectious Disease': ['Zolmira 50mg', 'Nexoprax 100mg'],
    Dermatology: ['Dermaclar Gel'],
    Respiratory: ['Respivent HFA', 'PulmoRelief'],
    Gastroenterology: ['Gastroshield'],
}

export const COUNTRIES_WEIGHTED: [string, number][] = [
    ['US', 18], ['DE', 8], ['FR', 7], ['GB', 7], ['IT', 6], ['ES', 5],
    ['JP', 8], ['IN', 5], ['CA', 4], ['AU', 3], ['BR', 3],
    ['NL', 2], ['PL', 2], ['BE', 1], ['CH', 1], ['MX', 1], ['CN', 1], ['KR', 1], ['Other', 5],
]

export const REPORT_TYPES_WEIGHTED: [string, number][] = [
    ['SPONTANEOUS', 42], ['LITERATURE', 14], ['NON_INTERVENTIONAL_STUDIES', 12],
    ['POST_MARKETING_SURVEILLANCE', 10], ['EXPEDITED_E2A', 6], ['PSUR', 3],
    ['ANNUAL_SAFETY_REPORT', 3], ['PREGNANCY_LACTATION', 4], ['PDSUR', 2],
    ['PATIENT_ORIENTED_PROGRAM', 2], ['CLINICAL_TRIALS', 2],
]

export const REPORT_TYPES_CONFIG = [
    { code: 'SPONTANEOUS', label: 'Spontaneous' },
    { code: 'LITERATURE', label: 'Literature' },
    { code: 'NON_INTERVENTIONAL_STUDIES', label: 'Non-Interventional Studies' },
    { code: 'POST_MARKETING_SURVEILLANCE', label: 'Post-Marketing Surveillance' },
    { code: 'EXPEDITED_E2A', label: 'Expedited (E2A)' },
    { code: 'PSUR', label: 'PSUR' },
    { code: 'ANNUAL_SAFETY_REPORT', label: 'Annual Safety Report' },
    { code: 'PREGNANCY_LACTATION', label: 'Pregnancy/Lactation' },
    { code: 'PDSUR', label: 'PDSUR' },
    { code: 'PATIENT_ORIENTED_PROGRAM', label: 'Patient-Oriented Program' },
    { code: 'CLINICAL_TRIALS', label: 'Clinical Trials' },
    { code: 'RMP_REPORTS', label: 'RMP Reports', isCustom: true },
    { code: 'PBRER_REPORTS', label: 'PBRER Reports', isCustom: true },
]

export const USER_TEMPLATES = [
    { emailPrefix: 'admin', name: 'Tenant Admin', role: 'TENANT_ADMIN' as const, dailyCaseLimit: 0 },
    { emailPrefix: 'pm1', name: 'Meera Krishnamurthy', role: 'PROJECT_MANAGER' as const, dailyCaseLimit: 0 },
    { emailPrefix: 'pm2', name: 'Rajesh Nambiar', role: 'PROJECT_MANAGER' as const, dailyCaseLimit: 0 },
    { emailPrefix: 'qm1', name: 'Dr. Ananya Sharma', role: 'QUALITY_MANAGER' as const, dailyCaseLimit: 0 },
    { emailPrefix: 'ops1', name: 'Vikram Patel', role: 'OPS_MANAGER' as const, dailyCaseLimit: 0 },
    { emailPrefix: 'tl1', name: 'Priya Subramaniam', role: 'TEAM_LEAD' as const, dailyCaseLimit: 15 },
    { emailPrefix: 'tl2', name: 'Arjun Kumar', role: 'TEAM_LEAD' as const, dailyCaseLimit: 15 },
    { emailPrefix: 'tl3', name: 'Sneha Iyer', role: 'TEAM_LEAD' as const, dailyCaseLimit: 15 },
    { emailPrefix: 'tl4', name: 'Ravi Menon', role: 'TEAM_LEAD' as const, dailyCaseLimit: 15 },
    { emailPrefix: 'proc01', name: 'Aishwarya Nair', role: 'PROCESSOR' as const, dailyCaseLimit: 25 },
    { emailPrefix: 'proc02', name: 'Karthik Balasubramaniam', role: 'PROCESSOR' as const, dailyCaseLimit: 22 },
    { emailPrefix: 'proc03', name: 'Deepa Venkataraman', role: 'PROCESSOR' as const, dailyCaseLimit: 24 },
    { emailPrefix: 'proc04', name: 'Suresh Chandrasekaran', role: 'PROCESSOR' as const, dailyCaseLimit: 23 },
    { emailPrefix: 'proc05', name: 'Pooja Reddy', role: 'PROCESSOR' as const, dailyCaseLimit: 18 },
    { emailPrefix: 'proc06', name: 'Akash Gupta', role: 'PROCESSOR' as const, dailyCaseLimit: 20 },
    { emailPrefix: 'proc07', name: 'Shreya Pillai', role: 'PROCESSOR' as const, dailyCaseLimit: 19 },
    { emailPrefix: 'proc08', name: 'Nikhil Deshpande', role: 'PROCESSOR' as const, dailyCaseLimit: 20 },
    { emailPrefix: 'proc09', name: 'Kavitha Raghunathan', role: 'PROCESSOR' as const, dailyCaseLimit: 17 },
    { emailPrefix: 'proc10', name: 'Sanjay Mohan', role: 'PROCESSOR' as const, dailyCaseLimit: 21 },
    { emailPrefix: 'proc11', name: 'Ritu Agarwal', role: 'PROCESSOR' as const, dailyCaseLimit: 18 },
    { emailPrefix: 'proc12', name: 'Pranav Joshi', role: 'PROCESSOR' as const, dailyCaseLimit: 20 },
    { emailPrefix: 'proc13', name: 'Arun Sivakumar', role: 'PROCESSOR' as const, dailyCaseLimit: 15 },
    { emailPrefix: 'proc14', name: 'Pallavi Nair', role: 'PROCESSOR' as const, dailyCaseLimit: 14 },
    { emailPrefix: 'proc15', name: 'Varun Shah', role: 'PROCESSOR' as const, dailyCaseLimit: 13 },
    { emailPrefix: 'proc16', name: 'Inactive User', role: 'PROCESSOR' as const, dailyCaseLimit: 10, isActive: false },
] as const

/** At-risk processor indices (0-based in USER_TEMPLATES) for extra corrections */
export const AT_RISK_PROCESSOR_INDICES = [12, 13, 14] // proc13, proc14, proc15

export const CORRECTION_DESCRIPTIONS = [
    'Patient date of birth incorrectly transcribed from source document',
    'MedDRA coding mismatch — wrong PT selected for verbatim term',
    'Narrative missing key concomitant medication details',
    'Duplicate case identified — consolidation required',
    'Follow-up information not integrated within SLA window',
    'SLA deadline missed due to late allocation',
    'Medical review returned for causality re-assessment',
    'Gender field transposed from source report',
]

export const CORRECTION_CATEGORIES = [
    'DATA_ENTRY', 'CODING', 'NARRATIVE', 'DUPLICATE', 'MISSING_FOLLOWUP', 'SLA_MISS', 'MR_RETURN',
] as const

export const CAPA_ROOT_CAUSES = [
    'Insufficient training on MedDRA coding updates',
    'High workload during regulatory submission window',
    'Ambiguous source document formatting',
    'Lack of standard operating procedure for edge cases',
]
