const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const wb = xlsx.readFile(path.join(__dirname, '..', 'docs', 'KASSEP_Household_Survey_Form_3.xlsx'));

const sheetMappings = [
  { sheet: 'A Household ID & Consent', section: 'A', title: 'Household ID, Eligibility & Consent', level: 'household' },
  { sheet: 'B Female Roster', section: 'B', title: 'Focused Female Roster', level: 'woman' },
  { sheet: 'C1 Death Screen', section: 'C1', title: 'Household Death Screen', level: 'household' },
  { sheet: 'C2 Death Roster', section: 'C2', title: 'Death Roster', level: 'death' },
  { sheet: 'D1 Respondent', section: 'D1', title: 'Respondent & Privacy', level: 'woman' },
  { sheet: 'D1 Individual Consent', section: 'D1_Consent', title: 'Individual Consent', level: 'woman' },
  { sheet: 'D2 Pregnancy Screening', section: 'D2', title: 'Pregnancy Screening', level: 'woman' },
  { sheet: 'E1 Timing & Outcome', section: 'E1', title: 'Pregnancy Timing & Outcome', level: 'pregnancy' },
  { sheet: 'E2 Baby Record', section: 'E2', title: 'Baby Record', level: 'baby' },
  { sheet: 'E3 Maternal Survival', section: 'E3', title: 'Maternal Survival', level: 'pregnancy' },
  { sheet: 'E4 Notification & Follow-up', section: 'E4', title: 'Notification & Follow-up', level: 'pregnancy' },
  { sheet: 'F Closure & Referrals', section: 'F', title: 'Closure & Referrals', level: 'household' }
];

const extracted = {
  version: '1.0.0',
  title: 'KASSEP Household Pregnancy and Outcome Assessment',
  organization: 'Doctors Medical Aid Foundation (DMAF)',
  referencePeriod: {
    start: '2024-08-01',
    end: '2026-07-31',
    phase1: 'Aug 2024 – Jul 2025',
    phase2: 'Aug 2025 – Jul 2026'
  },
  contact: {
    name: 'Amina Sabu',
    phone: '08144435403'
  },
  sections: []
};

sheetMappings.forEach(mapping => {
  const ws = wb.Sheets[mapping.sheet];
  if (!ws) {
    console.error('Missing sheet:', mapping.sheet);
    return;
  }
  const rawData = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  // Extract info blocks (paragraphs at the top)
  const infoBlocks = [];
  let headerRowIndex = -1;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const text0 = (row[0] || '').toString().trim();
    if (text0 === 'No.' || text0 === 'Variable') {
      headerRowIndex = i;
      break;
    }
    // Collect intro and consent text
    if (text0 && !text0.startsWith('Section') && !text0.startsWith('⟳')) {
      infoBlocks.push(text0);
    }
  }

  const items = [];
  if (headerRowIndex !== -1) {
    const headers = rawData[headerRowIndex].map(h => h.toString().trim());
    const varIdx = headers.findIndex(h => h === 'Variable');
    const noIdx = headers.findIndex(h => h === 'No.');
    const qIdx = headers.findIndex(h => h.includes('Question') || h.includes('Field'));
    const respIdx = headers.findIndex(h => h.includes('Response') || h.includes('coding'));
    const instrIdx = headers.findIndex(h => h.includes('Instruction') || h.includes('Routing'));

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      const varName = (row[varIdx] || '').toString().trim();
      const itemNo = noIdx !== -1 ? (row[noIdx] || '').toString().trim() : '';
      const question = qIdx !== -1 ? (row[qIdx] || '').toString().trim() : '';
      const responseCoding = respIdx !== -1 ? (row[respIdx] || '').toString().trim() : '';
      const routing = instrIdx !== -1 ? (row[instrIdx] || '').toString().trim() : '';

      if (!varName && !question) continue;

      items.push({
        no: itemNo,
        variable: varName,
        label: question,
        responseCoding: responseCoding,
        instructions: routing
      });
    }
  }

  extracted.sections.push({
    code: mapping.section,
    title: mapping.title,
    level: mapping.level,
    sheetName: mapping.sheet,
    infoBlocks: infoBlocks,
    items: items
  });
});

fs.mkdirSync(path.join(__dirname, '..', 'lib', 'survey'), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, '..', 'lib', 'survey', 'raw-survey-extracted.json'),
  JSON.stringify(extracted, null, 2),
  'utf8'
);

console.log('Survey successfully extracted. Total sections:', extracted.sections.length);
extracted.sections.forEach(s => {
  console.log(`- Section ${s.code} (${s.title}): ${s.items.length} items, ${s.infoBlocks.length} info blocks`);
});

