import { FormDefinition, OptionItem } from '@/types/survey';
import formData from './form-definition.json';

export const YES_NO_DK_DECLINED: OptionItem[] = [
  { code: 1, label: 'Yes', haLabel: 'I (Eh)' },
  { code: 0, label: 'No', haLabel: "A'a" },
  { code: 8, label: 'Do not know', haLabel: 'Ban sani ba' },
  { code: 9, label: 'Declined', haLabel: 'An ƙi amsawa' }
];

export const YES_NO_UNKNOWN: OptionItem[] = [
  { code: 1, label: 'Yes', haLabel: 'I' },
  { code: 0, label: 'No', haLabel: "A'a" },
  { code: 8, label: 'Unknown / Uncertain', haLabel: 'Ba a sani ba' }
];

export const KASSEP_FORM_DEFINITION: FormDefinition = formData as unknown as FormDefinition;
