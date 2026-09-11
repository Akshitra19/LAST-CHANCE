export interface SettingsData {
  examName: string;
  examDate: string | null;
  targetMarks: number;
  weekdayStudyHours: number;
  saturdayStudyHours: number;
  sundayStudyHours: number;
  mondayStudyHours: number;
  updatedAt: string;
}

export type SettingsPatch = Partial<Pick<SettingsData, 'examDate' | 'targetMarks' | 'weekdayStudyHours' | 'saturdayStudyHours' | 'sundayStudyHours' | 'mondayStudyHours'>>;
