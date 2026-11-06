const fs = require('fs');
const path = require('path');

const tsContent = `import { FormDefinition, OptionItem } from '@/types/survey';

export const YES_NO_DK_DECLINED: OptionItem[] = [
  { code: 1, label: "Yes', haLabel: "I (Eh)' },
  { code: 0, label: "No', haLabel: \"A"a" },
  { code: 8, label: "Do not know', haLabel: "Ban sani ba' },
  { code: 9, label: "Declined', haLabel: "An ƙi amsawa' }
];

export const YES_NO_UNKNOWN: OptionItem[] = [
  { code: 1, label: "Yes', haLabel: "I' },
  { code: 0, label: "No', haLabel: \"A"a" },
  { code: 8, label: "Unknown / Uncertain', haLabel: "Ba a sani ba' }
];

export const KASSEP_FORM_DEFINITION: FormDefinition = {
  version: '1.0.0',
  title: 'KASSEP Household Pregnancy and Outcome Assessment',
  organization: 'Doctors Medical Aid Foundation (DMAF)',
  contact: {
    name: 'Amina Sabu',
    phone: '08144435403'
  },
  referencePeriod: {
    start: '2024-08-01',
    end: '2026-07-31'
  },
  sections: [
    {
      code: 'A',
      title: 'Household Identification, Eligibility and Consent',
      haTitle: 'Gano Gida, Cancanta da Yarda',
      level: 'household',
      infoBlocks: [
        'Read household consent: "Hello. My name is [NAME], and I am working with Doctors Medical Aid Foundation (DMAF). We are assessing how pregnancies, births, and deaths were recorded in this community between August 2024 and July 2026."',
        '"I would first like to ask who lived in this household during that time. We may then invite eligible women to answer a short questionnaire privately. We may also ask about household members who died. With permission, selected details will be compared with surveillance records."',
        '"Participation is voluntary. You may decline any question or stop the interview. Your decision will not affect any services or benefits. Information will be kept confidential and reported without identifying you."',
        '"If you have questions, you may contact Amina Sabu on 08144435403. May I continue?"',
        'Respondent: An adult household member knowledgeable about household membership during the reference period.'
      ],
      haInfoBlocks: [
        'Karatun Yardar Gida: "Sannu. Sunana [NAME], ina aiki da Gidauniyar Agajin Likitoci (DMAF). Muna tantance yadda aka rubuta ciki, haihuwa, da mace-mace a wannan al\'umma tsakanin Agusta 2024 da Yuli 2026."',
        '"Zan so in fara tambaya game da wanda ya zauna a wannan gida a wancan lokacin. Sannan za mu iya gayyatar mata da suka cancanta su amsa gajeriyar tambayoyi a asirce."',
        '"Shiga cikin wannan binciken na son rai ne. Za ku iya ƙin amsa kowace tambaya ko dakatar da tambayoyin. Bayananku za su kasance a asirce."',
        '"Idan kuna da tambaya, za ku iya tuntuɓar Amina Sabu a 08144435403. Zan iya ci gaba?"'
      ],
      items: [
        {
          no: 'A01',
          variable: 'interviewer_id',
          label: 'Interviewer identification',
          haLabel: 'Lambar Mai Bincike',
          type: 'text',
          required: true,
          instructions: 'Assigned code'
        },
        {
          no: 'A02',
          variable: 'interview_date',
          label: 'Interview date & time',
          haLabel: 'Kwanan Watan Bincike',
          type: 'auto_field',
          instructions: 'Record start/end times automatically'
        },
        {
          no: 'A03',
          variable: 'lga_code',
          label: 'Local Government Area (LGA)',
          haLabel: 'Karamar Hukuma',
          type: 'single_choice',
          required: true,
          options: [
            { code: "KAN_MUN', label: "Kano Municipal' },
            { code: "FAG', label: "Fagge' },
            { code: "DAL', label: "Dala' },
            { code: "GWA', label: "Gwale' },
            { code: "NAS', label: "Nassarawa' },
            { code: "TAR', label: "Tarauni' },
            { code: "UNG', label: "Ungogo' },
            { code: "KUM', label: "Kumbotso' },
            { code: "BIC', label: "Bichi' },
            { code: "RAN', label: "Rano' }
          ]
        },
        {
          no: 'A04',
          variable: 'ward_code',
          label: 'Ward',
          haLabel: 'Wardi',
          type: 'text',
          required: true,
          instructions: 'Preload where available'
        },
        {
          no: 'A05',
          variable: 'community',
          label: 'Community / Settlement',
          haLabel: 'Gari / Unguwa',
          type: 'text',
          required: true,
          instructions: 'Confirm location'
        },
        {
          no: 'A06',
          variable: 'ea_id',
          label: 'Enumeration Area (EA) ID',
          haLabel: 'Lambar Yanki (EA)',
          type: 'text',
          required: true,
          instructions: 'Preload; no unauthorised changes'
        },
        {
          no: 'A07',
          variable: 'segment_id',
          label: 'Segment ID',
          haLabel: 'Lambar Sashe',
          type: 'text',
          instructions: 'From sampling record'
        },
        {
          no: 'A08',
          variable: 'assessment_hh_id',
          label: 'Assessment Household ID',
          haLabel: 'Lambar Gida Ta Bincike',
          type: 'text',
          required: true,
          instructions: 'Assigned unique code (e.g. KAN-01-001). Must not depend on a KASSEP record existing'
        },
        {
          no: 'A09',
          variable: 'hh_head_name',
          label: 'Household head name',
          haLabel: 'Sunan Mai Gida',
          type: 'text',
          restricted: true,
          instructions: 'Restricted linkage field — PII'
        },
        {
          no: 'A10',
          variable: 'visit_number',
          label: 'Visit attempt',
          haLabel: 'Ƙoƙarin Ziyara',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - First attempt' },
            { code: 2, label: '2 - Second attempt' },
            { code: 3, label: '3 - Subsequent attempt' }
          ]
        },
        {
          no: 'A11',
          variable: 'visit_result',
          label: 'Household visit result',
          haLabel: 'Sakamakon Ziyarar Gida',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Located, respondent available' },
            { code: 2, label: '2 - Located, nobody available' },
            { code: 3, label: '3 - Respondent unavailable' },
            { code: 4, label: '4 - Not located' },
            { code: 5, label: '5 - Dwelling vacant' },
            { code: 6, label: '6 - Household moved / dissolved' },
            { code: 7, label: '7 - Other' }
          ],
          instructions: 'If 2–7, record explanation and arrange supervisor-directed follow-up; do not assume household ineligible'
        },
        {
          no: 'A12',
          variable: 'hh_respondent_name',
          label: 'Respondent name',
          haLabel: 'Sunan Mai Amsa Tambayoyi',
          type: 'text',
          restricted: true,
          instructions: 'Restricted linkage field'
        },
        {
          no: 'A13',
          variable: 'hh_respondent_relationship',
          label: 'Relationship to household head',
          haLabel: 'Dangantaka da Mai Gida',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Head' },
            { code: 2, label: '2 - Spouse / partner' },
            { code: 3, label: '3 - Daughter / son' },
            { code: 4, label: '4 - Other relative' },
            { code: 5, label: '5 - Other household member' }
          ]
        },
        {
          no: 'A14',
          variable: 'hh_consent',
          label: 'Household respondent consents?',
          haLabel: 'Mai amsa ya amince?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Yes' },
            { code: 0, label: '0 - No (Close respectfully)' }
          ],
          instructions: 'No → close respectfully'
        },
        {
          no: 'A15',
          variable: 'hh_reference_residence',
          label: 'Did this household exist here, or did any of its members live here, at any time between 1 August 2024 and 31 July 2026?',
          haLabel: 'Shin wannan gida ya wanzu a nan, ko kuma wani daga cikin \'ya\'yansa ya zauna a nan tsakanin 1 Agusta 2024 da 31 Yuli 2026?',
          type: 'single_choice',
          required: true,
          options: YES_NO_UNKNOWN,
          instructions: 'No → document and refer for eligibility review; unknown → continue cautiously'
        },
        {
          no: 'A16',
          variable: 'hh_residence_start',
          label: 'When did this household begin living here?',
          haLabel: 'Yaushe wannan gida ya fara zama a nan?',
          type: 'flexible_date',
          instructions: 'Month/year; before reference period; unknown'
        },
        {
          no: 'A17',
          variable: 'hh_contact_permission',
          label: 'May the assessment team contact you again if information needs clarification?',
          haLabel: 'Kungiyar binciken za ta iya sake tuntuɓarku idan ana bukatar ƙarin bayani?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Yes' },
            { code: 0, label: '0 - No' }
          ]
        },
        {
          no: 'A18',
          variable: 'hh_contact',
          label: 'Preferred contact number',
          haLabel: 'Lambar Waya',
          type: 'text',
          restricted: true,
          instructions: 'Ask only if A17=1; restricted field',
          showIf: (values) => Number(values.hh_contact_permission) === 1
        },
        {
          no: 'A19',
          variable: 'hh_total_members',
          label: 'Total number of household members (including the household head)',
          haLabel: 'Jimillar adadin mutanen gida (ciki har da mai gida)',
          type: 'integer',
          required: true,
          instructions: 'Include all usual members, including the household head'
        },
        {
          no: 'A20',
          variable: 'hh_total_women',
          label: 'Total number of women in the household',
          haLabel: 'Jimillar mata a cikin gidan',
          type: 'integer',
          required: true,
          instructions: 'All female household members, any age'
        },
        {
          no: 'A21',
          variable: 'hh_eligible_women',
          label: 'Total number of eligible women in the household (aged 15–49 between 1 Aug 2024 and 31 Jul 2026)',
          haLabel: 'Jimillar mata da suka cancanta (masu shekaru 15–49 tsakanin 1 Agusta 2024 da 31 Yuli 2026)',
          type: 'integer',
          required: true,
          instructions: 'Women/girls aged 15–49 at any point between 1 Aug 2024 and 31 Jul 2026, incl. those who moved away or died; must match roster count in Section B'
        }
      ]
    },
    {
      code: 'B',
      title: 'Focused Female Roster',
      haTitle: 'Jerin Mata Masu Cancanta',
      level: 'woman',
      infoBlocks: [
        'Opening question (C1_roster_count): "How many women or girls lived in this household at any time between 1 August 2024 and 31 July 2026 and were aged 15–49 at any point during that period? Include those who have since moved away or died."',
        'Loop per number of women depending on roster count.',
        'Validation check (C2_roster_count_validation): "Have we included every eligible woman or girl, including daughters, unmarried women, other relatives, and anyone who moved away or died?"'
      ],
      haInfoBlocks: [
        'Tambayar Farko: "Mata ko \'yan mata nawa ne suka zauna a wannan gida a kowane lokaci tsakanin 1 ga Agusta 2024 da 31 ga Yuli 2026 kuma suna da shekaru 15–49 a kowane lokaci a wancan lokacin? Ku haɗa da waɗanda suka ƙaura ko suka mutu."',
        'Tantancewa: "Shin mun haɗa kowace mace ko yarinya da ta cancanta, ciki har da \'ya\'ya mata, matan da ba su da aure, sauran dangi, da duk wanda ya tafi ko ya mutu?"'
      ],
      items: [
        {
          no: 'B01',
          variable: 'woman_line',
          label: 'Woman roster line number',
          haLabel: 'Lambar Jerin Mace',
          type: 'auto_field',
          required: true
        },
        {
          no: 'B02',
          variable: 'woman_name',
          label: 'Name / Linkage identifier',
          haLabel: 'Suna / Lambar Shaida',
          type: 'text',
          restricted: true,
          required: true
        },
        {
          no: 'B03',
          variable: 'woman_dob',
          label: 'Date of birth (if known)',
          haLabel: 'Ranar Haihuwa',
          type: 'flexible_date'
        },
        {
          no: 'B04',
          variable: 'woman_age',
          label: 'Current age (if deceased, age at death)',
          haLabel: 'Shekaru a Yanzu (idan ta rasu, shekaru lokacin rasuwa)',
          type: 'integer',
          required: true
        },
        {
          no: 'B05',
          variable: 'age_basis',
          label: 'Basis of age',
          haLabel: 'Tushen Sanin Shekaru',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Known date of birth' },
            { code: 2, label: '2 - Reported age' },
            { code: 3, label: '3 - Estimated' },
            { code: 8, label: '8 - Unknown' }
          ]
        },
        {
          no: 'B06',
          variable: 'relationship_head',
          label: 'Relationship to household head',
          haLabel: 'Dangantaka da Mai Gida',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Head' },
            { code: 2, label: '2 - Wife / partner' },
            { code: 3, label: '3 - Daughter' },
            { code: 4, label: '4 - Sister' },
            { code: 5, label: '5 - Mother' },
            { code: 6, label: '6 - Daughter-in-law' },
            { code: 7, label: '7 - Other relative' },
            { code: 8, label: '8 - Non-relative' }
          ]
        },
        {
          no: 'B07',
          variable: 'residence_status',
          label: 'Current status',
          haLabel: 'Matsayin Zama a Yanzu',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Current resident' },
            { code: 2, label: '2 - Moved away' },
            { code: 3, label: '3 - Deceased' }
          ]
        },
        {
          no: 'B08',
          variable: 'residence_start',
          label: 'When did she begin living here?',
          haLabel: 'Yaushe ta fara zama a nan?',
          type: 'flexible_date'
        },
        {
          no: 'B09',
          variable: 'residence_end',
          label: 'When did she leave or die?',
          haLabel: 'Yaushe ta bar nan ko ta rasu?',
          type: 'flexible_date',
          showIf: (values) => Number(values.residence_status) === 2 || Number(values.residence_status) === 3
        },
        {
          no: 'B10',
          variable: 'reference_age_eligible',
          label: 'Was she aged 15–49 at any point during the reference period (1 Aug 2024 – 31 Jul 2026)?',
          haLabel: 'Shin tana da shekaru 15–49 a kowane lokaci tsakanin 1 Agusta 2024 da 31 Yuli 2026?',
          type: 'single_choice',
          required: true,
          options: YES_NO_UNKNOWN,
          instructions: 'Uncertain (8) → retain information for supervisor review rather than automatically excluding.'
        },
        {
          no: 'B11',
          variable: 'available_direct',
          label: 'Available for a direct private interview?',
          haLabel: 'Akwai damar yin hira da ita kai tsaye a asirce?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Now' },
            { code: 2, label: '2 - At a revisit' },
            { code: 3, label: '3 - Unavailable' },
            { code: 4, label: '4 - Deceased' },
            { code: 5, label: '5 - Declines' }
          ]
        },
        {
          no: 'B12',
          variable: 'woman_interview_status',
          label: 'Individual interview outcome',
          haLabel: 'Sakamakon Hirar Mutum',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Complete' },
            { code: 2, label: '2 - Partial' },
            { code: 3, label: '3 - Revisit needed' },
            { code: 4, label: '4 - Proxy completed' },
            { code: 5, label: '5 - Refused' },
            { code: 6, label: '6 - Unavailable' },
            { code: 7, label: '7 - No knowledgeable respondent' }
          ]
        }
      ]
    },
    {
      code: 'C1',
      title: 'Household Death Screen',
      haTitle: 'Tantance Rasuwar Gida',
      level: 'household',
      infoBlocks: [
        'Ask every consenting household, including those with no women on the roster.',
        '"Between 1 August 2024 and 31 July 2026, did anyone who belonged to this household die, including a baby who lived only briefly?"'
      ],
      haInfoBlocks: [
        '"Tsakanin 1 ga Agusta 2024 da 31 ga Yuli 2026, akwai wani da ke wannan gida da ya rasu, gami da jaririn da ya rayu na ɗan lokaci kaɗan?"'
      ],
      items: [
        {
          no: 'C01',
          variable: 'any_death',
          label: 'Any household death during the reference period?',
          haLabel: 'Akwai wani mutuwar gida a wannan lokacin?',
          type: 'single_choice',
          required: true,
          options: YES_NO_DK_DECLINED,
          instructions: 'Yes (1) → opens death roster (Section C2); otherwise proceed to Section D.'
        }
      ]
    },
    {
      code: 'C2',
      title: 'Death Roster',
      haTitle: 'Jerin Mamata',
      level: 'death',
      infoBlocks: [
        'Repeat for each reported death.',
        'Babies born without signs of life are captured through pregnancy outcomes, not counted again as deaths after live birth.',
        'This screen identifies cases for verification; it does not establish clinical maternal cause of death.'
      ],
      items: [
        {
          no: 'C02',
          variable: 'death_line',
          label: 'Death record number',
          haLabel: 'Lambar Rasuwa',
          type: 'auto_field',
          required: true
        },
        {
          no: 'C03',
          variable: 'deceased_name',
          label: 'Name / Linkage identifier',
          haLabel: 'Sunan Mamaci',
          type: 'text',
          restricted: true,
          required: true
        },
        {
          no: 'C04',
          variable: 'deceased_sex',
          label: 'Sex',
          haLabel: 'Jinsi',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: "1 - Female', haLabel: "Mace' },
            { code: 2, label: "2 - Male', haLabel: "Namiji' },
            { code: 8, label: "8 - Unknown', haLabel: "Ba a sani ba' }
          ]
        },
        {
          no: 'C05',
          variable: 'age_at_death',
          label: 'Age at death',
          haLabel: 'Shekaru Lokacin Rasuwa',
          type: 'number_unit',
          unitOptions: ["days', "months', 'years'],
          required: true,
          instructions: 'Permit age 0 completed days'
        },
        {
          no: 'C06',
          variable: 'death_date',
          label: 'When did the death occur?',
          haLabel: 'Yaushe rasuwar ta faru?',
          type: 'flexible_date',
          required: true
        },
        {
          no: 'C07',
          variable: 'death_residence',
          label: 'Was this person a household member when they died?',
          haLabel: 'Shin wannan mutumin mazaunin gidan nan ne lokacin da ya rasu?',
          type: 'single_choice',
          options: YES_NO_UNKNOWN
        },
        {
          no: 'C08',
          variable: 'pregnant_at_death',
          label: 'Was she pregnant when she died?',
          haLabel: 'Shin tana da ciki lokacin da ta rasu?',
          type: 'single_choice',
          options: YES_NO_DK_DECLINED,
          instructions: 'Ask for female deaths potentially within reproductive ages (12-55)',
          showIf: (values) => Number(values.deceased_sex) === 1
        },
        {
          no: 'C09',
          variable: 'recent_pregnancy_end',
          label: 'Did a pregnancy end during the six weeks before she died, whether through childbirth, miscarriage or another pregnancy loss?',
          haLabel: 'Shin wani ciki ya kare a cikin makonni shida kafin ta rasu (ta hanyar haihuwa ko ɓari)?',
          type: 'single_choice',
          options: YES_NO_DK_DECLINED,
          instructions: 'Ask if C08 ≠ 1',
          showIf: (values) => Number(values.deceased_sex) === 1 && Number(values.pregnant_at_death) !== 1
        },
        {
          no: 'C10',
          variable: 'death_followup',
          label: 'Mortality-verification referral required?',
          haLabel: 'Ana bukatar tura bayani don tantance mutuwar mata?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Yes (Referral flagged)' },
            { code: 0, label: '0 - No' }
          ],
          instructions: 'Auto-set if C08=1, C09=1, or pregnancy relationship remains uncertain'
        }
      ]
    },
    {
      code: 'D1',
      title: 'Respondent & Privacy',
      haTitle: 'Mai Amsa da Asiri',
      level: 'woman',
      infoBlocks: [
        'Repeat for each eligible woman (reference_age_eligible = 1 or 8).',
        'Direct interview preferred.'
      ],
      items: [
        {
          no: 'D01',
          variable: 'woman_id',
          label: 'Woman roster ID',
          haLabel: 'Lambar Shaida Ta Mace',
          type: 'auto_field',
          required: true
        },
        {
          no: 'D02',
          variable: 'response_type',
          label: 'Interview type',
          haLabel: 'Nau\'in Hirar',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Woman herself' },
            { code: 2, label: '2 - Proxy — woman unavailable' },
            { code: 3, label: '3 - Proxy — woman deceased' }
          ]
        },
        {
          no: 'D03',
          variable: 'proxy_relationship',
          label: 'Proxy relationship to woman',
          haLabel: 'Dangantakar Mai Maye Gurbi da Matar',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Spouse' },
            { code: 2, label: '2 - Mother / father' },
            { code: 3, label: '3 - Sister / brother' },
            { code: 4, label: '4 - Other relative' },
            { code: 5, label: '5 - Other knowledgeable person' }
          ],
          showIf: (values) => Number(values.response_type) === 2 || Number(values.response_type) === 3
        },
        {
          no: 'D04',
          variable: 'proxy_reason',
          label: 'Reason direct interview unavailable',
          haLabel: 'Dalilin Da Ya Sa Ba A Yi Hira Kai Tsaye Ba',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Temporarily absent' },
            { code: 2, label: '2 - Moved away' },
            { code: 3, label: '3 - Too ill' },
            { code: 4, label: '4 - Deceased' },
            { code: 5, label: '5 - Other' }
          ],
          instructions: 'Do not use proxy to bypass refusal',
          showIf: (values) => Number(values.response_type) === 2 || Number(values.response_type) === 3
        },
        {
          no: 'D05',
          variable: 'privacy',
          label: 'Privacy adequate to proceed?',
          haLabel: 'Wurin yana da cikakken asiri?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Yes' },
            { code: 0, label: '0 - No (Seek private setting / revisit)' }
          ]
        }
      ]
    },
    {
      code: 'D1_Consent',
      title: 'Individual Consent',
      haTitle: 'Yardar Mutum',
      level: 'woman',
      infoBlocks: [
        'Read individual consent: "We are assessing whether pregnancies and their outcomes were recorded correctly between August 2024 and July 2026. I would like to ask about pregnancies during that period and whether anyone contacted you to monitor them. Some questions concern pregnancy losses or deaths. You may skip any question or stop at any time. With your permission, selected details will later be compared with surveillance records. Your answers will be kept confidential. May I continue?"',
        'For proxies: adapt pronouns and explain that only information they know should be provided.'
      ],
      haInfoBlocks: [
        'Karatun Yardar Mutum: "Muna tantance ko an rubuta ciki da haihuwa daidai tsakanin Agusta 2024 da Yuli 2026. Ina son in tambaye ku game da ciki a wancan lokacin da kuma ko wani ya tuntuɓe ku don bibiya. Wasu tambayoyi sun shafi ɓarin ciki ko mutuwa. Za ku iya tsallake kowace tambaya. Za a kiyaye amsoshinku a asirce. Zan iya ci gaba?"'
      ],
      items: [
        {
          no: 'D06',
          variable: 'individual_consent',
          label: 'Appropriate individual / proxy consent obtained?',
          haLabel: 'An samu yardar matar ko mai maye gurbi?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Yes' },
            { code: 0, label: '0 - No (Close individual interview)' }
          ],
          instructions: 'No → close individual interview'
        }
      ]
    },
    {
      code: 'D2',
      title: 'Pregnancy Screening',
      haTitle: 'Tantance Ciki',
      level: 'woman',
      infoBlocks: [
        'D2. Pregnancy screening — asks D07, D08, D09 as completeness checks.',
        'Any yes → D10 sets pregnancy episode repeat count; all no → close individual interview.'
      ],
      items: [
        {
          no: 'D07',
          variable: 'pregnancy_any',
          label: 'Between 1 August 2024 and 31 July 2026, were you pregnant at any time? Include a pregnancy that began before August 2024 but continued into the period.',
          haLabel: 'Tsakanin 1 ga Agusta 2024 da 31 ga Yuli 2026, kin taɓa samun ciki a kowane lokaci? Haɗa da cikin da aka samu kafin Agusta 2024 amma ya ci gaba zuwa lokacin.',
          type: 'single_choice',
          required: true,
          options: YES_NO_DK_DECLINED
        },
        {
          no: 'D08',
          variable: 'pregnancy_loss_probe',
          label: 'During that period, was there any pregnancy that ended before delivery, including a miscarriage or another pregnancy loss?',
          haLabel: 'A wancan lokacin, akwai wani ciki da ya zube ko ya ɓaci kafin haihuwa?',
          type: 'single_choice',
          required: true,
          options: YES_NO_DK_DECLINED
        },
        {
          no: 'D09',
          variable: 'birth_probe',
          label: 'During that period, did you give birth, including to a baby born without signs of life or a baby who died soon after birth?',
          haLabel: 'A wancan lokacin, kin taɓa haihuwa, gami da jaririn da aka haifa ba ya numfashi ko kuma wanda ya rasu jim kaɗan bayan haihuwa?',
          type: 'single_choice',
          required: true,
          options: YES_NO_DK_DECLINED
        },
        {
          no: 'D10',
          variable: 'pregnancy_number',
          label: 'Altogether, how many different pregnancies overlapped that period? (Count twins or multiple births as ONE pregnancy)',
          haLabel: 'Gaba ɗaya, ciki daban-daban guda nawa ne suka shiga wancan lokacin? (Yi lissafin tagwaye a matsayin ciki ɗaya)',
          type: 'integer',
          required: true,
          instructions: 'Any yes (D07/D08/D09) → create episodes; all no → close individual interview'
        }
      ]
    },
    {
      code: 'E1',
      title: 'Pregnancy Timing, Residence and Outcome',
      haTitle: 'Lokaci da Sakamakon Ciki',
      level: 'pregnancy',
      infoBlocks: [
        'Repeat for each pregnancy overlapping the reference period (loops D10 times).',
        '"I will ask a few questions about each pregnancy, beginning with the most recent."',
        'Note: Do not ask respondent to apply technical stillbirth definition. Record signs of life and duration for classification.'
      ],
      items: [
        {
          no: 'E01',
          variable: 'pregnancy_id',
          label: 'Pregnancy episode ID',
          haLabel: 'Lambar Ciki',
          type: 'auto_field',
          required: true
        },
        {
          no: 'E02',
          variable: 'pregnancy_start',
          label: 'Around what month and year did this pregnancy begin?',
          haLabel: 'Wane wata da shekara ne wannan cikin ya fara?',
          type: 'flexible_date',
          instructions: 'An estimate is acceptable'
        },
        {
          no: 'E03',
          variable: 'pregnancy_status_cutoff',
          label: 'By 31 July 2026, had this pregnancy ended, or was it still ongoing?',
          haLabel: 'Zuwa 31 Yuli 2026, wannan cikin ya ƙare, ko yana nan?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Ended' },
            { code: 2, label: '2 - Ongoing' },
            { code: 8, label: '8 - Unknown' },
            { code: 9, label: '9 - Declined' }
          ]
        },
        {
          no: 'E04',
          variable: 'pregnancy_current_status',
          label: 'Has this pregnancy ended since then?',
          haLabel: 'Shin wannan cikin ya ƙare tun daga lokacin?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Yes, has ended' },
            { code: 0, label: '0 - Still ongoing' },
            { code: 8, label: '8 - Unknown' },
            { code: 9, label: '9 - Declined' }
          ],
          showIf: (values) => Number(values.pregnancy_status_cutoff) === 2 || Number(values.pregnancy_status_cutoff) === 8
        },
        {
          no: 'E05',
          variable: 'pregnancy_end_date',
          label: 'When did the pregnancy end?',
          haLabel: 'Yaushe cikin ya ƙare?',
          type: 'flexible_date',
          instructions: 'Ask for all ended pregnancies, not only live births',
          showIf: (values) => Number(values.pregnancy_status_cutoff) === 1 || Number(values.pregnancy_current_status) === 1
        },
        {
          no: 'E06',
          variable: 'date_certainty',
          label: 'Date certainty',
          haLabel: 'Tabbacin Kwanan Wata',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Exact date' },
            { code: 2, label: '2 - Month / year only' },
            { code: 3, label: '3 - Approximate period' },
            { code: 8, label: '8 - Unknown' }
          ],
          instructions: 'Do not force exact dates'
        },
        {
          no: 'E07',
          variable: 'gestation',
          label: 'About how many weeks or months pregnant were you when it ended?',
          haLabel: 'Kimanin makonni ko watanni nawa ne cikin lokacin da ya ƙare?',
          type: 'number_unit',
          unitOptions: ["weeks', "months'],
          instructions: 'Retain original unit'
        },
        {
          no: 'E08',
          variable: 'pregnancy_residence',
          label: 'Where were you usually living during this pregnancy?',
          haLabel: 'A ina kika fi zama a lokacin wannan cikin?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - This household throughout' },
            { code: 2, label: '2 - Joined during pregnancy' },
            { code: 3, label: '3 - Left during pregnancy' },
            { code: 4, label: '4 - Elsewhere throughout' },
            { code: 8, label: '8 - Unknown' }
          ]
        },
        {
          no: 'E09',
          variable: 'outcome_residence',
          label: 'Where were you usually living when the pregnancy ended?',
          haLabel: 'A ina kika fi zama lokacin da cikin ya ƙare?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - This household' },
            { code: 2, label: '2 - Elsewhere in this EA' },
            { code: 3, label: '3 - Outside this EA' },
            { code: 8, label: '8 - Unknown' }
          ],
          instructions: 'Residence — not delivery facility location'
        },
        {
          no: 'E10',
          variable: 'outcome_type',
          label: 'How did this pregnancy end?',
          haLabel: 'Ta yaya wannan cikin ya ƙare?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Birth of one or more babies (Live birth or stillbirth)' },
            { code: 2, label: '2 - Pregnancy ended without a birth — reported miscarriage' },
            { code: 3, label: '3 - Other pregnancy loss' },
            { code: 4, label: '4 - Still ongoing' },
            { code: 8, label: '8 - Uncertain' },
            { code: 9, label: '9 - Declined' }
          ],
          instructions: 'Birth (1) → proceed to Baby repeat (E11); loss (2/3) → skip babies to E15.'
        },
        {
          no: 'E11',
          variable: 'babies_number',
          label: 'How many babies were born from this pregnancy?',
          haLabel: 'Jarirai nawa aka haifa daga wannan cikin?',
          type: 'integer',
          instructions: 'One baby record per baby born',
          showIf: (values) => Number(values.outcome_type) === 1
        },
        {
          no: 'E12',
          variable: 'delivery_place',
          label: 'Where did the birth occur?',
          haLabel: 'A ina haihuwar ta faru?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Home' },
            { code: 2, label: '2 - Public facility' },
            { code: 3, label: '3 - Private facility' },
            { code: 4, label: '4 - Other' },
            { code: 8, label: '8 - Unknown' }
          ],
          showIf: (values) => Number(values.outcome_type) === 1
        }
      ]
    },
    {
      code: 'E2',
      title: 'Baby Record',
      haTitle: 'Bayanin Jariri',
      level: 'baby',
      infoBlocks: [
        'Repeat for every baby from the pregnancy (loops E11 times when E10 = 1).',
        'Routing: Suspected stillbirth or uncertain signs of life triggers verification referral flag.'
      ],
      items: [
        {
          no: 'E13a',
          variable: 'baby_id',
          label: 'Baby number within pregnancy',
          haLabel: 'Lambar Jariri',
          type: 'auto_field',
          required: true
        },
        {
          no: 'E13b',
          variable: 'baby_sex',
          label: 'Baby sex',
          haLabel: 'Jinsin Jariri',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: "1 - Female', haLabel: "Mace' },
            { code: 2, label: "2 - Male', haLabel: "Namiji' },
            { code: 8, label: "8 - Unknown', haLabel: "Ba a sani ba' }
          ]
        },
        {
          no: 'E13c',
          variable: 'signs_life',
          label: 'After birth, did the baby show any sign of life — for example, breathing, crying or movement?',
          haLabel: 'Bayan haihuwa, jaririn ya nuna alamar rai — misali, numfashi, kuka, ko motsi?',
          type: 'single_choice',
          required: true,
          options: YES_NO_DK_DECLINED,
          instructions: 'If no (0) or unknown (8), ask clarification in E13d.'
        },
        {
          no: 'E13d',
          variable: 'heartbeat_sign',
          label: 'Was a heartbeat or pulsation of the cord noticed, even if the baby did not cry or breathe?',
          haLabel: 'Shin an ji bugun zuciya ko jijiyar cibiya, ko da jaririn bai yi kuka ko numfashi ba?',
          type: 'single_choice',
          options: YES_NO_UNKNOWN,
          instructions: 'Ask if E13c ≠ 1',
          showIf: (values) => Number(values.signs_life) !== 1
        },
        {
          no: 'E13e',
          variable: 'baby_alive',
          label: 'Is the baby alive now?',
          haLabel: 'Shin jaririn yana da rai a yanzu?',
          type: 'single_choice',
          options: YES_NO_DK_DECLINED,
          instructions: 'Ask where any sign of life reported (E13c=1 or E13d=1)',
          showIf: (values) => Number(values.signs_life) === 1 || Number(values.heartbeat_sign) === 1
        },
        {
          no: 'E13f',
          variable: 'baby_death_age',
          label: 'How long did the baby live?',
          haLabel: 'Tsawon wane lokaci jaririn ya rayu?',
          type: 'number_unit',
          unitOptions: ["days', "months'],
          instructions: 'If deceased; permit 0 completed days',
          showIf: (values) => Number(values.baby_alive) === 0
        },
        {
          no: 'E13g',
          variable: 'baby_death_date',
          label: 'When did the baby die?',
          haLabel: 'Yaushe jaririn ya rasu?',
          type: 'flexible_date',
          showIf: (values) => Number(values.baby_alive) === 0
        },
        {
          no: 'E13h',
          variable: 'baby_evidence',
          label: 'Is a birth, delivery or other relevant record available and may we view it?',
          haLabel: 'Akwai takardar haihuwa ko wani bayani da za mu iya gani?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - Viewed' },
            { code: 2, label: '2 - Available, not viewed' },
            { code: 3, label: '3 - Unavailable' },
            { code: 4, label: '4 - Permission declined' }
          ],
          instructions: 'Do not require documents for inclusion'
        }
      ]
    },
    {
      code: 'E3',
      title: 'Maternal Survival',
      haTitle: 'Rayuwar Uwa',
      level: 'pregnancy',
      infoBlocks: [
        'E3. Maternal survival — asked once per pregnancy episode.',
        'For direct interviews with a living woman, record current survival automatically (E15=1). Do not ask her whether she died.',
        'Referral: Death during pregnancy/childbirth, within 42 days after outcome, or uncertain timing → mortality-verification referral tool.'
      ],
      items: [
        {
          no: 'E15',
          variable: 'maternal_status',
          label: 'Is [NAME] alive now?',
          haLabel: 'Shin [NAME] tana da rai a yanzu?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Yes, alive' },
            { code: 0, label: '0 - No, deceased' },
            { code: 8, label: '8 - Unknown' }
          ],
          instructions: 'Ask proxies; auto-filled as 1 for direct interviews'
        },
        {
          no: 'E16',
          variable: 'maternal_death_date',
          label: 'When did she die?',
          haLabel: 'Yaushe ta rasu?',
          type: 'flexible_date',
          showIf: (values) => Number(values.maternal_status) === 0
        },
        {
          no: 'E17',
          variable: 'death_timing',
          label: 'Did she die while pregnant, during childbirth, or after the pregnancy ended?',
          haLabel: 'Shin ta rasu tana da ciki, lokacin haihuwa, ko bayan cikin ya ƙare?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - While pregnant' },
            { code: 2, label: '2 - During childbirth' },
            { code: 3, label: '3 - After pregnancy ended' },
            { code: 8, label: '8 - Unknown' }
          ],
          showIf: (values) => Number(values.maternal_status) === 0
        },
        {
          no: 'E18',
          variable: 'end_to_death',
          label: 'How long after the pregnancy ended did she die?',
          haLabel: 'Bayan wane lokaci da cikin ya ƙare ta rasu?',
          type: 'number_unit',
          unitOptions: ["days', "weeks', 'months'],
          showIf: (values) => Number(values.maternal_status) === 0 && Number(values.death_timing) === 3
        }
      ]
    },
    {
      code: 'E4',
      title: 'Notification and Follow-up',
      haTitle: 'Sanarwa da Bibiya',
      level: 'pregnancy',
      infoBlocks: [
        'E4. Notification and follow-up — ask for each episode, adapting pronouns for proxies.',
        'Interviewer note: Contact recalled by a household is not proof that a KASSEP record exists or that formal follow-up was completed.'
      ],
      items: [
        {
          no: 'E19',
          variable: 'pregnancy_contact',
          label: 'Did anyone in the community contact you about this pregnancy to record it or monitor how it was progressing?',
          haLabel: 'Wani a cikin al\'umma ya tuntuɓe ku game da wannan cikin don rubuta shi ko duba yadda yake tafiya?',
          type: 'single_choice',
          required: true,
          options: YES_NO_DK_DECLINED
        },
        {
          no: 'E20',
          variable: 'contact_actor',
          label: 'Who contacted you? (Select all that apply)',
          haLabel: 'Waye ya tuntuɓe ku?',
          type: 'multi_choice',
          options: [
            { code: "WDC', label: "Community leader / WDC' },
            { code: "SCRIBE', label: "KASSEP Scribe' },
            { code: "FSO', label: "Field Surveillance Officer (FSO)' },
            { code: "FACILITY', label: "Health facility worker' },
            { code: "OTHER', label: "Other person' },
            { code: "UNKNOWN', label: "Role unknown' }
          ],
          showIf: (values) => Number(values.pregnancy_contact) === 1
        },
        {
          no: 'E21',
          variable: 'contact_timing',
          label: 'When did they first contact you?',
          haLabel: 'Yaushe suka fara tuntuɓarku?',
          type: 'single_choice',
          options: [
            { code: 1, label: '1 - During pregnancy' },
            { code: 2, label: '2 - At birth / pregnancy ending' },
            { code: 3, label: '3 - Afterwards' },
            { code: 8, label: '8 - Unknown' }
          ],
          showIf: (values) => Number(values.pregnancy_contact) === 1
        },
        {
          no: 'E22',
          variable: 'contact_purpose',
          label: 'What did they ask or do? (Select all that apply)',
          haLabel: 'Me suka tambaya ko suka yi?',
          type: 'multi_choice',
          options: [
            { code: "REC_PREG', label: "Recorded pregnancy details' },
            { code: "PROGRESS', label: "Asked about progress' },
            { code: "REC_OUTCOME', label: "Recorded outcome' },
            { code: "CHECK_MOTHER', label: "Checked maternal survival' },
            { code: "CHECK_BABY', label: "Checked baby survival' },
            { code: "CLINICAL_ONLY', label: "Provided clinical care only' },
            { code: "OTHER', label: "Other action' },
            { code: "UNKNOWN', label: "Unknown' }
          ],
          showIf: (values) => Number(values.pregnancy_contact) === 1
        },
        {
          no: 'E23',
          variable: 'outcome_contact',
          label: 'After the pregnancy ended, did anyone contact you or the household to ask what happened to you and, where relevant, the baby?',
          haLabel: 'Bayan cikin ya ƙare, wani ya tuntuɓe ku don jin halin da kuke ciki da jaririn?',
          type: 'single_choice',
          options: YES_NO_DK_DECLINED
        },
        {
          no: 'E24',
          variable: 'followup_timing',
          label: 'Was there any such contact six weeks or more after the pregnancy ended?',
          haLabel: 'Shin an yi wata tuntuɓar makonni shida ko fiye bayan cikin ya ƙare?',
          type: 'single_choice',
          options: YES_NO_UNKNOWN,
          showIf: (values) => Number(values.outcome_contact) === 1
        },
        {
          no: 'E25',
          variable: 'followup_content',
          label: 'What did they check during follow-up? (Select all that apply)',
          haLabel: 'Me suka duba yayin bibiyar?',
          type: 'multi_choice',
          options: [
            { code: "OUTCOME', label: "Pregnancy outcome' },
            { code: "MOTHER_HEALTH', label: "Woman\'s health / survival' },
            { code: "BABY_HEALTH', label: "Baby\'s health / survival' },
            { code: "OTHER', label: "Other' },
            { code: "UNKNOWN', label: "Unknown' }
          ],
          showIf: (values) => Number(values.outcome_contact) === 1
        },
        {
          no: 'E26',
          variable: 'notification_attempt',
          label: 'Did you or someone in the household tell a community reporting person about the pregnancy or outcome?',
          haLabel: 'Shin ku ko wani a gida ya sanar da mai karɓar rahoto a al\'umma?',
          type: 'single_choice',
          options: YES_NO_DK_DECLINED
        },
        {
          no: 'E27',
          variable: 'reporting_problem',
          label: 'Was there any difficulty reporting the pregnancy or outcome or receiving follow-up?',
          haLabel: 'Akwai wata matsala wajen sanarwa ko samun bibiya?',
          type: 'single_choice',
          options: [
            { code: 0, label: '0 - None reported' },
            { code: 1, label: '1 - Person unavailable' },
            { code: 2, label: '2 - Did not know whom to tell' },
            { code: 3, label: '3 - Privacy / disclosure concern' },
            { code: 4, label: '4 - Household moved / absent' },
            { code: 5, label: '5 - Other' },
            { code: 8, label: '8 - Unknown' }
          ]
        }
      ]
    },
    {
      code: 'F',
      title: 'Closure and Referrals',
      haTitle: 'Kammalawa da Bayar da Shawara',
      level: 'household',
      infoBlocks: [
        'F01: "Have we included every pregnancy during the period, including any loss or baby who lived only briefly?"',
        'If F01 identifies another pregnancy (0), return to Section E.',
        'Thank respondents and explain any agreed follow-up. Obtain separate consent for mortality verification.'
      ],
      haInfoBlocks: [
        '"Shin mun haɗa kowane ciki a wancan lokacin, gami da ɓari ko jaririn da ya rayu na ɗan lokaci kaɗan?"',
        'Godiya ga masu amsa tambayoyi tare da bayyana duk wata bibiya da aka amince da ita.'
      ],
      items: [
        {
          no: 'F01',
          variable: 'history_check',
          label: 'Have we included every pregnancy during the period, including any loss or baby who lived only briefly?',
          haLabel: 'Shin mun haɗa kowane ciki a wancan lokacin, ciki har da ɓari ko jaririn da ya rasu?',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Yes, all included' },
            { code: 0, label: '0 - Additional episode identified (Return to Section E)' },
            { code: 8, label: '8 - Uncertain' },
            { code: 9, label: '9 - Declined' }
          ]
        },
        {
          no: 'F02',
          variable: 'referral_ids',
          label: 'Cases requiring mortality / stillbirth verification (Linked IDs)',
          haLabel: 'Shaidar mutuwa ko jaririn da aka haifa ba rai (Lambar Shaida)',
          type: 'text',
          readOnly: true,
          instructions: 'Automatically populated with referral identifiers'
        },
        {
          no: 'F03',
          variable: 'interview_outcome',
          label: 'Final household assessment outcome',
          haLabel: 'Sakamakon Ƙarshe na Binciken Gida',
          type: 'single_choice',
          required: true,
          options: [
            { code: 1, label: '1 - Complete' },
            { code: 2, label: '2 - Partial' },
            { code: 3, label: '3 - Further woman interview needed' },
            { code: 4, label: '4 - Refused' },
            { code: 5, label: '5 - Other' }
          ]
        },
        {
          no: 'F04',
          variable: 'interviewer_notes',
          label: 'Essential unresolved issues',
          haLabel: 'Bayanai na Musamman / Matsalolin da ba a warware ba',
          type: 'long_text',
          instructions: 'Short text; no unnecessary sensitive narrative'
        }
      ]
    }
  ]
};
`;

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'survey', 'form-definition.ts'), tsContent, 'utf8');
console.log('form-definition.ts generated successfully!');

