export interface SettingsData {
  examName: string;
  examDate: string | null;
  targetMarks: number;
  weekdayStudyHours: number;
  sundayStudyHours: number;
  mondayStudyHours: number;
  updatedAt: string;
}

export type SettingsPatch = Partial<Pick<SettingsData, 'examDate' | 'targetMarks' | 'weekdayStudyHours' | 'sundayStudyHours' | 'mondayStudyHours'>>;
