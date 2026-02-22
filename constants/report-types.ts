export const REPORT_TYPES = [
    { code: 'SPONTANEOUS', label: 'Spontaneous', sortOrder: 1 },
    { code: 'NON_INTERVENTIONAL_STUDIES', label: 'Non-Interventional Studies (NIS)', sortOrder: 2 },
    { code: 'LITERATURE', label: 'Literature', sortOrder: 3 },
    { code: 'POST_MARKETING_SURVEILLANCE', label: 'Post-Marketing Surveillance', sortOrder: 4 },
    { code: 'EXPEDITED_E2A', label: 'Expedited (E2A)', sortOrder: 5 },
    { code: 'PSUR', label: 'PSUR / PBRER', sortOrder: 6 },
    { code: 'ANNUAL_SAFETY_REPORT', label: 'Annual Safety Report', sortOrder: 7 },
    { code: 'PDSUR', label: 'PDSUR', sortOrder: 8 },
    { code: 'PREGNANCY_LACTATION', label: 'Pregnancy / Lactation', sortOrder: 9 },
    { code: 'PATIENT_ORIENTED_PROGRAM', label: 'Patient-Oriented Program', sortOrder: 10 },
    { code: 'CLINICAL_TRIALS', label: 'Clinical Trials', sortOrder: 11 },
    { code: 'OTHER', label: 'Other', sortOrder: 12 },
] as const

export type ReportTypeCode = (typeof REPORT_TYPES)[number]['code']
