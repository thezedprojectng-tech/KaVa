export type Language = 'en' | 'ha';

export const UI_TRANSLATIONS = {
  en: {
    appTitle: 'KaVa',
    appSubtitle: 'KASSEP Field-Survey Platform',
    clientName: 'Doctors Medical Aid Foundation (DMAF)',
    state: 'Kano State, Nigeria',
    nav: {
      map: 'EA Map',
      browseEAs: 'Enumeration Areas',
      households: 'Households',
      surveyWizard: 'New Interview',
      reviewQueue: 'Review Queue',
      responses: 'Responses & Export',
      users: 'User & EA Assignments',
      analytics: 'Monitoring Stats'
    },
    roles: {
      admin: 'Administrator',
      supervisor: 'Supervisor',
      interviewer: 'Field Interviewer'
    },
    status: {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
      draft: 'Draft',
      submitted: 'Submitted',
      reviewed: 'Reviewed'
    },
    sync: {
      online: 'Online',
      offline: 'Offline (Draft Saved Locally)',
      synced: 'All Synced',
      syncing: 'Syncing...'
    },
    wizard: {
      sectionA: 'Section A: Household & Consent',
      sectionB: 'Section B: Female Roster',
      sectionC: 'Section C: Death Screen & Roster',
      sectionD: 'Section D: Individual Consent & Screening',
      sectionE: 'Section E: Pregnancy & Baby History',
      sectionF: 'Section F: Closure & Referrals',
      next: 'Next Section',
      back: 'Back',
      saveDraft: 'Save Draft',
      submit: 'Submit Interview',
      reviewBeforeSubmit: 'Review & Verify',
      addWoman: 'Add Eligible Woman',
      addDeath: 'Report Household Death',
      addPregnancy: 'Add Pregnancy Episode',
      addBaby: 'Add Baby Record'
    },
    flags: {
      title: 'Review Queue & Surveillance Flags',
      pending: 'Pending Review',
      resolved: 'Resolved',
      stillbirth: 'Stillbirth Verification',
      maternalDeath: 'Maternal Death Verification',
      mismatch: 'Count Mismatch',
      resolve: 'Resolve Flag',
      notes: 'Supervisor Review Notes',
      lock: 'Lock Final Classification'
    },
    export: {
      title: 'Survey Responses & Analytical Export',
      deidentified: 'Export De-Identified (Recommended)',
      identified: 'Export Identified (Admin Only)',
      downloadExcel: 'Download XLSX',
      downloadCsv: 'Download CSV'
    }
  },
  ha: {
    appTitle: 'KaVa',
    appSubtitle: 'Dandalin Binciken KASSEP a Yanki',
    clientName: 'Gidauniyar Agajin Likitoci (DMAF)',
    state: 'Jihar Kano, Najeriya',
    nav: {
      map: 'Taswirar Yanki (EA)',
      browseEAs: 'Duba Yankuna (EAs)',
      households: 'Gidaje',
      surveyWizard: 'Sabuwar Hira',
      reviewQueue: 'Kwamitin Dubawa',
      responses: 'Amsoshi da Fitarwa',
      users: 'Masu Aiki da Yankuna',
      analytics: 'Alkaluman Bibiya'
    },
    roles: {
      admin: 'Babban Jami\'i (Admin)',
      supervisor: 'Mai Kulawa (Supervisor)',
      interviewer: 'Mai Bincike (Interviewer)'
    },
    status: {
      not_started: 'Ba a fara ba',
      in_progress: 'Ana yi',
      completed: 'An kammala',
      draft: 'Daftari',
      submitted: 'An aika',
      reviewed: 'An duba'
    },
    sync: {
      online: 'A kan layi',
      offline: 'Ba a kan layi ba (An ajiye a waya)',
      synced: 'Komai ya daidaita',
      syncing: 'Ana aikawa...'
    },
    wizard: {
      sectionA: 'Sashe A: Gano Gida da Yarda',
      sectionB: 'Sashe B: Jerin Mata',
      sectionC: 'Sashe C: Rasuwar Gida',
      sectionD: 'Sashe D: Yardar Mutum da Tantance Ciki',
      sectionE: 'Sashe E: Tarihin Ciki da Jarirai',
      sectionF: 'Sashe F: Kammalawa da Shawara',
      next: 'Na Gaba',
      back: 'Baya',
      saveDraft: 'Ajiye Daftari',
      submit: 'Aika Bincike',
      reviewBeforeSubmit: 'Duba Kafin Aika',
      addWoman: 'Ƙara Mace Mai Cancanta',
      addDeath: 'Sanar da Rasuwa',
      addPregnancy: 'Ƙara Ciki',
      addBaby: 'Ƙara Jariri'
    },
    flags: {
      title: 'Kwamitin Dubawa da Bayanan Tantancewa',
      pending: 'Ana jira',
      resolved: 'An warware',
      stillbirth: 'Tantance Haihuwar Jariri Ba Rai',
      maternalDeath: 'Tantance Rasuwar Mace Mai Ciki',
      mismatch: 'Rashin Daidaito',
      resolve: 'Warware Alama',
      notes: 'Bayanin Mai Kula',
      lock: 'Rufe Matsayin Ƙarshe'
    },
    export: {
      title: 'Amsoshin Bincike da Fitarwa',
      deidentified: 'Fitar da Bayanai Ba Tare da Suna Ba (An Shawarta)',
      identified: 'Fitar da Bayanai da Suna (Admin Kadai)',
      downloadExcel: 'Sauke XLSX',
      downloadCsv: 'Sauke CSV'
    }
  }
};

