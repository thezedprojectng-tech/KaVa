# KaVa — KASSEP Household Survey Platform
**Client:** Doctors Medical Aid Foundation (DMAF)  
**Study:** Kano Antenatal and Stillbirth Surveillance and Evaluation Program (KASSEP)  
**Scope:** ~140 Enumeration Areas (EAs) across Kano State, Nigeria  
**Reference Period:** 1 August 2024 – 31 July 2026 (Phase 1 & Phase 2)

---

## 🚀 Overview

**KaVa** is a production-grade, offline-first field survey application built for field interviewers, supervisors, and study coordinators assessing pregnancy, childbirth, and mortality recording across Kano State. Designed for high-stakes public health surveillance where data quality, privacy, and clinical verification are paramount.

### Key Capabilities
- **Hierarchical Survey Engine:** Strict 4-level nested repeats:
  - **Level 1:** Household (Sections A, C1, F)
  - **Level 2a:** Female Roster & Screening (Sections B, D1, D2)
  - **Level 2b:** Household Death Roster (Section C2)
  - **Level 3:** Pregnancy Episodes (Sections E1, E3, E4)
  - **Level 4:** Baby Records (Section E2, vital status, stillbirth checks)
- **Offline-First Resilience:** Instant autosave to IndexedDB (`Dexie.js`) with zero data loss on page refresh, network dropouts, or battery loss. Background synchronization to Supabase Postgres with conflict resolution.
- **Automated Surveillance Referrals:** Real-time flagging of suspected stillbirths, neonatal deaths, maternal mortality (during pregnancy, childbirth, or within 42 days), and pregnancy-associated deaths for verbal autopsy verification.
- **Strict Sampling Protocol:** Built-in safeguards preventing informal household substitution; non-response tracking for visit attempts 1–3.
- **Role-Based Access Control (RBAC):**
  - **Admin:** Full system access, staff assignment, identified analytical export (PII unmasked).
  - **Supervisor:** Workload monitoring, review queue clearance, classification locking, supervisor follow-up dispatch.
  - **Interviewer:** Assigned EAs and households only, direct draft and submit permissions.
- **Analytical SheetJS Export:** Generates multi-tab Excel files matching the official KASSEP data layout (`HH_Data`, `Women_Data`, `Deaths_Data`, `Pregnancy_Data`, `Baby_Data`) with de-identified PII masking by default.
- **Bilingual Interface:** English (`en`) and Hausa (`ha`) localization for interview prompts, consent texts, and options.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript (strict mode)
- **Styling & UI:** Tailwind CSS, shadcn/ui, Gridline Dashboard components
- **Map Engine:** Kano State interactive mapping with MapLibre GL coordinates (~12.0022° N, 8.5920° E)
- **Local Persistence:** Dexie.js (IndexedDB)
- **Cloud Database & Auth:** Supabase (PostgreSQL, Row-Level Security policies)
- **Data Export:** SheetJS (`xlsx`)
- **Icons:** Lucide React

---

## 📁 Directory Structure

```
c:\Users\Zayd Tahir\KaVa\
├── app/                              # Next.js App Router (layout, page, globals.css)
├── components/
│   ├── admin/                        # User roles and EA assignments view
│   ├── dashboard/                    # Kano map, EA list, stats cards, EA importer
│   ├── responses/                    # Multi-level responses tables & Excel exporter
│   ├── review/                       # Supervisor review queue & referral verification
│   ├── ui/                           # shadcn UI components (button, input, drawer, etc.)
│   ├── watermelon/gridline-dashboard/# Gridline layout shell, sidebar, navbar, router
│   └── wizard/                       # 6-step survey wizard, question renderer, loops
├── docs/                             # Original survey specification spreadsheet
├── lib/
│   ├── auth/                         # User profile context, RBAC simulation
│   ├── db/                           # Dexie schema, sync engine, 20 seed Kano EAs
│   ├── i18n/                         # English & Hausa translations
│   ├── supabase/                     # Supabase client wrapper & offline fallback
│   └── survey/                       # Form definitions, routing engine, SheetJS export
├── supabase/
│   └── migrations/                   # PostgreSQL schema, RLS policies, audit triggers
├── types/                            # Typed survey records, database entities, auth
└── README.md                         # Documentation
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for live Supabase)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*Note: KaVa includes an automatic local Dexie fallback. If no Supabase credentials are provided, the platform runs in complete offline mode using IndexedDB!*

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 👥 Roles & Access Controls

Switch roles anytime using the top-right profile avatar or the **Users & EA Assignments** view:
| Role | Map & EAs | Survey Wizard | Review Queue | Exports | Staff Management |
|------|-----------|---------------|--------------|---------|------------------|
| **Admin** | Full Kano State | Create / Edit | Clear & Lock | De-Identified & Identified | Full assignment & user creation |
| **Supervisor** | Assigned LGAs | Create / Edit | Clear & Lock | De-Identified Only | Read-only view in assigned LGAs |
| **Interviewer** | Assigned EAs | Create / Edit Own | View Own Flags | Read Own EAs | Access Restricted |

### 🔑 Bootstrapping the First Administrator Account

To establish the initial Study Administrator account in a newly provisioned Supabase environment:
1. Open the Supabase Dashboard -> **SQL Editor**.
2. Run the script located in `supabase/bootstrap_admin.sql`:
```sql
insert into public.profiles (
  id, role, full_name, email, phone, assigned_lgas, assigned_eas, status
) values (
  'your-auth-user-id', -- From Supabase Auth -> Users
  'admin',
  'Dr. Amina Sabu (Study Coordinator)',
  'coordinator@dmaf-kassep.org',
  '0800 000 0001',
  array['Kano Municipal', 'Dala', 'Fagge', 'Gwale', 'Tarauni', 'Nassarawa', 'Kumbotso', 'Ungogo', 'Bichi', 'Rano'],
  array['All ~140 EAs'],
  'active'
) on conflict (id) do update set role = 'admin', status = 'active';
```
3. Admins can then create additional supervisors and interviewers directly through the **Users & EA Assignments** UI or the secure server-side API (`/api/users`), which uses the Supabase service role key to securely provision accounts without client-side exposure.

---

## 📋 How to Edit the Form Definition

The survey schema is centralized in `lib/survey/form-definition.json` and typed in `lib/survey/form-definition.ts`.

To add or modify a question:
1. Open `lib/survey/form-definition.json`.
2. Locate the appropriate section (`A`, `B`, `C1`, `C2`, `D1`, `D2`, `E1`, `E2`, `E3`, `E4`, `F`).
3. Add or edit an item with the standard structure:
```json
{
  "no": "A22",
  "variable": "custom_variable_name",
  "label": "Question text in English",
  "haLabel": "Tambaya a Hausa",
  "type": "single_choice",
  "required": true,
  "options": [
    { "code": 1, "label": "Option 1" },
    { "code": 0, label: "Option 2" }
  ]
}
```
4. Update `lib/survey/routing.ts` if custom skip-logic or auto-referral flags are required.

---

## 🔒 Privacy & De-Identification Protocol

In compliance with national ethical clearance and DMAF data protection requirements:
- All Personally Identifiable Information (PII) including respondent names, household head names, phone numbers, and deceased names are marked as `restricted: true`.
- Analytical exports via SheetJS mask all PII as `[REDACTED]` by default.
- Identified exports require an authenticated user with the `admin` role and generate a cryptographically logged audit trail.

---

## 📄 License
Confidential property of **Doctors Medical Aid Foundation (DMAF)**. Prepared for the KASSEP Household Survey, Kano State, Nigeria.
