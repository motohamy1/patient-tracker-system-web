// src/lib/dev/mock-clinical.ts — DEV-ONLY MOCK CLINICAL DATA (authorized preview).
//
// READ THIS BEFORE TREATING ANYTHING HERE AS REAL. This module is SYNTHETIC
// sample data for a development preview of the doctor dashboard. It is NOT real
// patient information, NOT a schema, and NOT a source of truth. Names, record
// references, dates and measurements are invented for layout purposes only.
//
// ── WHY THIS IS ALLOWED TO EXIST (and how it stays contained) ─────────────────
// The project's FOUND-01 / D-18 rule bans fake *clinical* data from PRODUCT code
// and the client bundle. This module is a deliberate, owner-authorized exception
// for a temporary dev preview, and it is fenced on every side:
//
//   1. LOCATION — it lives in `src/lib/dev/`, the sanctioned fixture home.
//   2. NOT SCANNED BY THE FIXTURE-VALUE TESTS — `tests/unit/dev-fixtures.test.ts`
//      reads only `fixtures.ts` for its dosage/date/vocabulary assertions;
//      `fixtures.ts` is left value-free and untouched.
//   3. NOT IN A PRODUCT ROUTE — its only consumer is the dev gallery route
//      (`src/app/dev/gallery/page.tsx`), the single importer the reachability
//      test permits. No file under the real `/provider` or `/patient` trees
//      imports it.
//   4. NOT IN THE CLIENT BUNDLE AS A MODULE — the gallery page (a Server
//      Component) imports it and passes the values down as props, so the data
//      rides the request-time render payload and is never compiled into
//      `.next/static`. It also never contains the `dev-placeholder` literal the
//      bundle test greps for.
//   5. GATED OUT OF PRODUCTION — the gallery route 404s unless the dev-route
//      gate flag is set (D-26; the flag is named only in `dev-route-gate.ts`),
//      so this data is unreachable in every real deployment.
//
// DELETE THIS FILE (and `mock-view-types.ts` + `MockDoctorDashboard.tsx`) once
// the real data layer lands. It is scaffolding, not product.
import type {
  MockPatientView,
} from '@/lib/mock-view-types';

const PATIENTS: MockPatientView[] = [
  {
    id: 'pt-avery-chen',
    displayName: 'Avery Chen',
    age: 58,
    sex: 'Female',
    dob: '1968-04-12',
    recordRef: 'PCW-100241',
    phone: '+1 (415) 555-0142',
    bloodType: 'A+',
    clinician: 'Dr. Morgan Reyes',
    statusTone: 'warning',
    statusLabel: 'Monitoring',
    lastVisit: '2026-09-28',
    snapshot: {
      taken: '2026-09-28 09:14',
      tiles: [
        { label: 'Blood pressure', value: '138/86', unit: 'mmHg', flag: 'high' },
        { label: 'Heart rate', value: '78', unit: 'bpm', flag: 'normal' },
        { label: 'Temperature', value: '36.7', unit: '°C', flag: 'normal' },
        { label: 'SpO2', value: '97', unit: '%', flag: 'normal' },
        { label: 'Weight', value: '72.4', unit: 'kg', flag: 'normal' },
        { label: 'BMI', value: '26.1', unit: '', flag: 'high' },
      ],
    },
    problems: [
      { code: 'E11.9', label: 'Type 2 diabetes mellitus without complications', status: 'active', onset: '2019-06-01' },
      { code: 'I10', label: 'Essential (primary) hypertension', status: 'active', onset: '2017-02-14' },
      { code: 'E78.5', label: 'Hyperlipidemia, unspecified', status: 'active', onset: '2020-11-03' },
    ],
    medications: [
      { name: 'Metformin', dose: '500 mg', frequency: 'Twice daily', route: 'Oral', status: 'active', start: '2019-06-10', prescriber: 'Dr. Morgan Reyes' },
      { name: 'Lisinopril', dose: '10 mg', frequency: 'Once daily', route: 'Oral', status: 'active', start: '2017-03-02', prescriber: 'Dr. Morgan Reyes' },
      { name: 'Atorvastatin', dose: '20 mg', frequency: 'At night', route: 'Oral', status: 'active', start: '2020-11-20', prescriber: 'Dr. Morgan Reyes' },
      { name: 'Aspirin', dose: '81 mg', frequency: 'Once daily', route: 'Oral', status: 'stopped', start: '2021-01-05', prescriber: 'Dr. Morgan Reyes' },
    ],
    labs: [
      { name: 'HbA1c', value: '7.2', unit: '%', range: '4.0 – 5.6', flag: 'high', collected: '2026-09-28' },
      { name: 'LDL cholesterol', value: '142', unit: 'mg/dL', range: '< 100', flag: 'high', collected: '2026-09-28' },
      { name: 'HDL cholesterol', value: '54', unit: 'mg/dL', range: '40 – 60', flag: 'normal', collected: '2026-09-28' },
      { name: 'Creatinine', value: '0.9', unit: 'mg/dL', range: '0.6 – 1.2', flag: 'normal', collected: '2026-09-28' },
      { name: 'eGFR', value: '88', unit: 'mL/min', range: '> 60', flag: 'normal', collected: '2026-09-28' },
    ],
    allergies: [
      { substance: 'Penicillin', reaction: 'Urticaria', severity: 'moderate', status: 'active' },
      { substance: 'Sulfonamides', reaction: 'Rash', severity: 'mild', status: 'active' },
    ],
    encounters: [
      { date: '2026-09-28', kind: 'Follow-up', reason: 'Diabetes and hypertension review', clinician: 'Dr. Morgan Reyes', note: 'HbA1c trending down. Continue current regimen. Recheck in 3 months.', status: 'completed' },
      { date: '2026-06-15', kind: 'Office visit', reason: 'Medication review', clinician: 'Dr. Morgan Reyes', note: 'Statin dose optimized. Counselled on diet and activity.', status: 'completed' },
      { date: '2026-03-02', kind: 'Telehealth', reason: 'Blood pressure check', clinician: 'Dr. Priya Nair', note: 'Home readings well controlled.', status: 'completed' },
    ],
    imaging: [
      { study: 'Chest X-ray', bodyPart: 'Chest', date: '2026-06-15', impression: 'Clear lungs. No acute cardiopulmonary process.', status: 'final' },
      { study: 'Renal ultrasound', bodyPart: 'Abdomen', date: '2025-11-10', impression: 'Normal kidney sizes. No hydronephrosis.', status: 'final' },
    ],
    genetics: [
      { gene: 'SLCO1B1', variant: 'c.521T>C', significance: 'likely pathogenic', condition: 'Statin myopathy risk' },
      { gene: 'CYP2C9', variant: '*2/*3', significance: 'uncertain', condition: 'Warfarin sensitivity' },
    ],
    insights: [
      { kind: 'risk', title: 'Glycaemic control improving', detail: 'HbA1c has fallen 0.6% over the last two quarters on the current regimen.', tone: 'success' },
      { kind: 'alert', title: 'LDL above target', detail: 'LDL remains above the 100 mg/dL goal for a high-risk patient. Consider statin review.', tone: 'warning' },
      { kind: 'recommendation', title: 'Retinal screening due', detail: 'Annual diabetic eye exam is overdue by 2 months.', tone: 'info' },
    ],
    documents: [
      { title: 'Annual physical summary', kind: 'PDF', date: '2026-09-28', size: '240 KB' },
      { title: 'Lab requisition', kind: 'PDF', date: '2026-09-28', size: '88 KB' },
      { title: 'Prior imaging report', kind: 'PDF', date: '2025-11-10', size: '1.1 MB' },
    ],
  },
  {
    id: 'pt-daniel-okafor',
    displayName: 'Daniel Okafor',
    age: 41,
    sex: 'Male',
    dob: '1985-01-23',
    recordRef: 'PCW-100242',
    phone: '+1 (415) 555-0177',
    bloodType: 'O-',
    clinician: 'Dr. Morgan Reyes',
    statusTone: 'success',
    statusLabel: 'Stable',
    lastVisit: '2026-08-19',
    snapshot: {
      taken: '2026-08-19 11:02',
      tiles: [
        { label: 'Blood pressure', value: '122/78', unit: 'mmHg', flag: 'normal' },
        { label: 'Heart rate', value: '64', unit: 'bpm', flag: 'normal' },
        { label: 'Temperature', value: '36.5', unit: '°C', flag: 'normal' },
        { label: 'SpO2', value: '99', unit: '%', flag: 'normal' },
        { label: 'Weight', value: '84.1', unit: 'kg', flag: 'normal' },
        { label: 'BMI', value: '25.4', unit: '', flag: 'normal' },
      ],
    },
    problems: [
      { code: 'J45.20', label: 'Mild intermittent asthma, uncomplicated', status: 'active', onset: '2015-09-01' },
    ],
    medications: [
      { name: 'Albuterol', dose: '90 mcg', frequency: 'As needed', route: 'Inhalation', status: 'active', start: '2015-09-12', prescriber: 'Dr. Morgan Reyes' },
      { name: 'Fluticasone', dose: '110 mcg', frequency: 'Twice daily', route: 'Inhalation', status: 'active', start: '2022-04-01', prescriber: 'Dr. Priya Nair' },
    ],
    labs: [
      { name: 'CBC — Hemoglobin', value: '15.2', unit: 'g/dL', range: '13.5 – 17.5', flag: 'normal', collected: '2026-08-19' },
      { name: 'IgE', value: '118', unit: 'IU/mL', range: '0 – 100', flag: 'high', collected: '2026-08-19' },
    ],
    allergies: [
      { substance: 'Peanuts', reaction: 'Anaphylaxis', severity: 'critical', status: 'active' },
      { substance: 'Dust mites', reaction: 'Rhinitis', severity: 'mild', status: 'active' },
    ],
    encounters: [
      { date: '2026-08-19', kind: 'Follow-up', reason: 'Asthma control check', clinician: 'Dr. Morgan Reyes', note: 'Well controlled on inhaled corticosteroid. Rescue inhaler used < 1x/week.', status: 'completed' },
      { date: '2026-02-11', kind: 'Office visit', reason: 'Spirometry', clinician: 'Dr. Priya Nair', note: 'FEV1 normal. Continue current therapy.', status: 'completed' },
    ],
    imaging: [
      { study: 'Chest X-ray', bodyPart: 'Chest', date: '2026-02-11', impression: 'Lungs clear. No infiltrate.', status: 'final' },
    ],
    genetics: [],
    insights: [
      { kind: 'trend', title: 'Stable respiratory control', detail: 'No exacerbations in 12 months; rescue inhaler use remains low.', tone: 'success' },
      { kind: 'alert', title: 'Severe peanut allergy', detail: 'Anaphylaxis history documented. Ensure epinephrine auto-injector is current.', tone: 'critical' },
    ],
    documents: [
      { title: 'Spirometry report', kind: 'PDF', date: '2026-02-11', size: '156 KB' },
      { title: 'Allergy action plan', kind: 'PDF', date: '2026-08-19', size: '64 KB' },
    ],
  },
  {
    id: 'pt-sofia-marino',
    displayName: 'Sofia Marino',
    age: 73,
    sex: 'Female',
    dob: '1953-07-30',
    recordRef: 'PCW-100243',
    phone: '+1 (415) 555-0193',
    bloodType: 'B+',
    clinician: 'Dr. Priya Nair',
    statusTone: 'critical',
    statusLabel: 'High risk',
    lastVisit: '2026-10-02',
    snapshot: {
      taken: '2026-10-02 08:41',
      tiles: [
        { label: 'Blood pressure', value: '154/92', unit: 'mmHg', flag: 'critical' },
        { label: 'Heart rate', value: '96', unit: 'bpm', flag: 'high' },
        { label: 'Temperature', value: '37.1', unit: '°C', flag: 'normal' },
        { label: 'SpO2', value: '94', unit: '%', flag: 'low' },
        { label: 'Weight', value: '58.2', unit: 'kg', flag: 'low' },
        { label: 'BMI', value: '21.0', unit: '', flag: 'normal' },
      ],
    },
    problems: [
      { code: 'I50.9', label: 'Heart failure, unspecified', status: 'active', onset: '2022-08-17' },
      { code: 'N18.3', label: 'Chronic kidney disease, stage 3', status: 'active', onset: '2023-01-09' },
      { code: 'I48.91', label: 'Unspecified atrial fibrillation', status: 'active', onset: '2021-05-22' },
    ],
    medications: [
      { name: 'Furosemide', dose: '40 mg', frequency: 'Once daily', route: 'Oral', status: 'active', start: '2022-08-20', prescriber: 'Dr. Priya Nair' },
      { name: 'Apixaban', dose: '5 mg', frequency: 'Twice daily', route: 'Oral', status: 'active', start: '2021-06-01', prescriber: 'Dr. Priya Nair' },
      { name: 'Metoprolol', dose: '25 mg', frequency: 'Twice daily', route: 'Oral', status: 'active', start: '2022-09-05', prescriber: 'Dr. Priya Nair' },
      { name: 'Spironolactone', dose: '25 mg', frequency: 'Once daily', route: 'Oral', status: 'active', start: '2023-02-14', prescriber: 'Dr. Priya Nair' },
    ],
    labs: [
      { name: 'BNP', value: '642', unit: 'pg/mL', range: '< 100', flag: 'critical', collected: '2026-10-02' },
      { name: 'Creatinine', value: '1.8', unit: 'mg/dL', range: '0.6 – 1.2', flag: 'high', collected: '2026-10-02' },
      { name: 'Potassium', value: '5.3', unit: 'mmol/L', range: '3.5 – 5.1', flag: 'high', collected: '2026-10-02' },
      { name: 'Hemoglobin', value: '10.8', unit: 'g/dL', range: '12.0 – 16.0', flag: 'low', collected: '2026-10-02' },
    ],
    allergies: [
      { substance: 'ACE inhibitors', reaction: 'Angioedema', severity: 'severe', status: 'active' },
    ],
    encounters: [
      { date: '2026-10-02', kind: 'Urgent visit', reason: 'Shortness of breath and weight gain', clinician: 'Dr. Priya Nair', note: 'Volume overloaded. Increased diuretic and arranged close follow-up.', status: 'completed' },
      { date: '2026-07-08', kind: 'Follow-up', reason: 'Heart failure management', clinician: 'Dr. Priya Nair', note: 'Stable on current regimen. Reinforced fluid restriction.', status: 'completed' },
    ],
    imaging: [
      { study: 'Echocardiogram', bodyPart: 'Heart', date: '2026-07-08', impression: 'Reduced ejection fraction ~35%. Mild mitral regurgitation.', status: 'final' },
      { study: 'Chest X-ray', bodyPart: 'Chest', date: '2026-10-02', impression: 'Pulmonary congestion consistent with fluid overload.', status: 'preliminary' },
    ],
    genetics: [
      { gene: 'TTN', variant: 'c.39901C>T', significance: 'uncertain', condition: 'Dilated cardiomyopathy' },
    ],
    insights: [
      { kind: 'alert', title: 'Rising BNP', detail: 'BNP has climbed over three readings; consistent with decompensation. Prioritise review.', tone: 'critical' },
      { kind: 'risk', title: 'Renal function declining', detail: 'eGFR trending down alongside diuretic therapy. Monitor electrolytes.', tone: 'warning' },
      { kind: 'recommendation', title: 'Anticoagulation review', detail: 'Apixaban dose should be re-checked against renal function.', tone: 'info' },
    ],
    documents: [
      { title: 'Echocardiogram report', kind: 'PDF', date: '2026-07-08', size: '2.2 MB' },
      { title: 'Discharge summary', kind: 'PDF', date: '2026-10-02', size: '320 KB' },
    ],
  },
  {
    id: 'pt-liam-haddad',
    displayName: 'Liam Haddad',
    age: 29,
    sex: 'Male',
    dob: '1997-11-05',
    recordRef: 'PCW-100244',
    phone: '+1 (415) 555-0128',
    bloodType: 'AB+',
    clinician: 'Dr. Morgan Reyes',
    statusTone: 'info',
    statusLabel: 'New patient',
    lastVisit: '2026-10-05',
    snapshot: {
      taken: '2026-10-05 14:23',
      tiles: [
        { label: 'Blood pressure', value: '118/74', unit: 'mmHg', flag: 'normal' },
        { label: 'Heart rate', value: '71', unit: 'bpm', flag: 'normal' },
        { label: 'Temperature', value: '36.6', unit: '°C', flag: 'normal' },
        { label: 'SpO2', value: '98', unit: '%', flag: 'normal' },
        { label: 'Weight', value: '76.0', unit: 'kg', flag: 'normal' },
        { label: 'BMI', value: '23.8', unit: '', flag: 'normal' },
      ],
    },
    problems: [
      { code: 'M54.50', label: 'Low back pain, unspecified', status: 'active', onset: '2026-09-20' },
    ],
    medications: [
      { name: 'Ibuprofen', dose: '400 mg', frequency: 'Three times daily as needed', route: 'Oral', status: 'active', start: '2026-09-20', prescriber: 'Dr. Morgan Reyes' },
    ],
    labs: [
      { name: 'CBC — Hemoglobin', value: '14.8', unit: 'g/dL', range: '13.5 – 17.5', flag: 'normal', collected: '2026-10-05' },
      { name: 'Vitamin D', value: '22', unit: 'ng/mL', range: '30 – 100', flag: 'low', collected: '2026-10-05' },
    ],
    allergies: [],
    encounters: [
      { date: '2026-10-05', kind: 'Initial consult', reason: 'Establishing care; persistent low back pain', clinician: 'Dr. Morgan Reyes', note: 'Baseline labs ordered. Referred to physiotherapy. No red flags.', status: 'completed' },
      { date: '2026-10-26', kind: 'Follow-up', reason: 'Review physiotherapy progress', clinician: 'Dr. Morgan Reyes', note: 'Scheduled for follow-up.', status: 'scheduled' },
    ],
    imaging: [
      { study: 'Lumbar spine X-ray', bodyPart: 'Lumbar spine', date: '2026-10-05', impression: 'No acute bony abnormality. Mild degenerative change.', status: 'final' },
    ],
    genetics: [],
    insights: [
      { kind: 'recommendation', title: 'Vitamin D supplementation', detail: 'Level below the reference range; consider supplementation and recheck.', tone: 'info' },
    ],
    documents: [
      { title: 'New patient intake form', kind: 'PDF', date: '2026-10-05', size: '128 KB' },
      { title: 'Physiotherapy referral', kind: 'PDF', date: '2026-10-05', size: '42 KB' },
    ],
  },
  {
    id: 'pt-maya-petrov',
    displayName: 'Maya Petrov',
    age: 34,
    sex: 'Female',
    dob: '1992-02-18',
    recordRef: 'PCW-100245',
    phone: '+1 (415) 555-0164',
    bloodType: 'O+',
    clinician: 'Dr. Priya Nair',
    statusTone: 'success',
    statusLabel: 'Stable',
    lastVisit: '2026-09-11',
    snapshot: {
      taken: '2026-09-11 10:37',
      tiles: [
        { label: 'Blood pressure', value: '112/70', unit: 'mmHg', flag: 'normal' },
        { label: 'Heart rate', value: '68', unit: 'bpm', flag: 'normal' },
        { label: 'Temperature', value: '36.8', unit: '°C', flag: 'normal' },
        { label: 'SpO2', value: '99', unit: '%', flag: 'normal' },
        { label: 'Weight', value: '61.5', unit: 'kg', flag: 'normal' },
        { label: 'BMI', value: '22.6', unit: '', flag: 'normal' },
      ],
    },
    problems: [
      { code: 'E03.9', label: 'Hypothyroidism, unspecified', status: 'active', onset: '2018-03-14' },
    ],
    medications: [
      { name: 'Levothyroxine', dose: '75 mcg', frequency: 'Once daily', route: 'Oral', status: 'active', start: '2018-03-20', prescriber: 'Dr. Priya Nair' },
    ],
    labs: [
      { name: 'TSH', value: '2.4', unit: 'mIU/L', range: '0.4 – 4.0', flag: 'normal', collected: '2026-09-11' },
      { name: 'Free T4', value: '1.3', unit: 'ng/dL', range: '0.8 – 1.8', flag: 'normal', collected: '2026-09-11' },
    ],
    allergies: [
      { substance: 'Latex', reaction: 'Contact dermatitis', severity: 'mild', status: 'active' },
    ],
    encounters: [
      { date: '2026-09-11', kind: 'Follow-up', reason: 'Thyroid function review', clinician: 'Dr. Priya Nair', note: 'TSH within range on current dose. Continue and recheck annually.', status: 'completed' },
    ],
    imaging: [],
    genetics: [
      { gene: 'DUOX2', variant: 'c.1588A>G', significance: 'benign', condition: 'Congenital hypothyroidism' },
    ],
    insights: [
      { kind: 'trend', title: 'Thyroid stable', detail: 'TSH and free T4 have remained within range on a steady dose.', tone: 'success' },
    ],
    documents: [
      { title: 'Thyroid panel results', kind: 'PDF', date: '2026-09-11', size: '96 KB' },
    ],
  },
];

/**
 * The dev-preview patient set. Synthetic data, dev-only, gated behind the
 * dev-route gate flag (see the containment note above). Delete with the
 * preview when the real data layer lands.
 */
export const MOCK_PATIENTS: MockPatientView[] = PATIENTS;
