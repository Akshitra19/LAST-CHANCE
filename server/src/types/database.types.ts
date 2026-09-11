export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          marked_for_review: boolean
          marks_awarded: number | null
          mistake_type: string | null
          question_id: string
          submitted_answer: Json
          time_seconds: number
          updated_at: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marked_for_review?: boolean
          marks_awarded?: number | null
          mistake_type?: string | null
          question_id: string
          submitted_answer: Json
          time_seconds?: number
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marked_for_review?: boolean
          marks_awarded?: number | null
          mistake_type?: string | null
          question_id?: string
          submitted_answer?: Json
          time_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          exam_date: string | null
          exam_name: string
          monday_study_hours: number
          saturday_study_hours: number
          singleton_key: string
          sunday_study_hours: number
          target_marks: number
          updated_at: string
          weekday_study_hours: number
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          exam_name: string
          monday_study_hours: number
          saturday_study_hours?: number
          singleton_key?: string
          sunday_study_hours: number
          target_marks: number
          updated_at?: string
          weekday_study_hours: number
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          exam_name?: string
          monday_study_hours?: number
          saturday_study_hours?: number
          singleton_key?: string
          sunday_study_hours?: number
          target_marks?: number
          updated_at?: string
          weekday_study_hours?: number
        }
        Relationships: []
      }
      attempts: {
        Row: {
          created_at: string
          id: string
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          test_id: string
          total_time_seconds: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          test_id: string
          total_time_seconds?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          test_id?: string
          total_time_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          plan_key: string | null
          plan_slot: number | null
          planned_minutes: number
          started_at: string | null
          status: string
          subject_id: string | null
          task_date: string
          task_type: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plan_key?: string | null
          plan_slot?: number | null
          planned_minutes: number
          started_at?: string | null
          status?: string
          subject_id?: string | null
          task_date: string
          task_type: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plan_key?: string | null
          plan_slot?: number | null
          planned_minutes?: number
          started_at?: string | null
          status?: string
          subject_id?: string | null
          task_date?: string
          task_type?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_topic_subject_fkey"
            columns: ["topic_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "subject_id"]
          },
        ]
      }
      question_options: {
        Row: {
          created_at: string
          display_order: number
          id: string
          option_key: string
          option_text: string
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          option_key: string
          option_text: string
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          option_key?: string
          option_text?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          archived: boolean
          archived_at: string | null
          correct_answer: Json
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          image_path: string | null
          marks: number
          question_text: string
          question_type: string
          source: string | null
          subject_id: string
          topic_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          correct_answer: Json
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          image_path?: string | null
          marks: number
          question_text: string
          question_type: string
          source?: string | null
          subject_id: string
          topic_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          correct_answer?: Json
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          image_path?: string | null
          marks?: number
          question_text?: string
          question_type?: string
          source?: string | null
          subject_id?: string
          topic_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_subject_fkey"
            columns: ["topic_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "subject_id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_official: boolean
          name: string
          official_section_number: number | null
          source_paper_code: string
          source_url: string | null
          syllabus_version: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order: number
          id?: string
          is_official?: boolean
          name: string
          official_section_number?: number | null
          source_paper_code: string
          source_url?: string | null
          syllabus_version: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_official?: boolean
          name?: string
          official_section_number?: number | null
          source_paper_code?: string
          source_url?: string | null
          syllabus_version?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          created_at: string
          position: number
          question_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          position: number
          question_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          position?: number
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          name: string
          test_type: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          name: string
          test_type: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          test_type?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_official: boolean
          name: string
          official_source_text: string | null
          parent_topic_id: string | null
          preparation_status: string
          subject_id: string
          syllabus_version: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order: number
          id?: string
          is_official?: boolean
          name: string
          official_source_text?: string | null
          parent_topic_id?: string | null
          preparation_status?: string
          subject_id: string
          syllabus_version: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_official?: boolean
          name?: string
          official_source_text?: string | null
          parent_topic_id?: string | null
          preparation_status?: string
          subject_id?: string
          syllabus_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_parent_same_subject_version_fkey"
            columns: ["parent_topic_id", "subject_id", "syllabus_version"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "subject_id", "syllabus_version"]
          },
          {
            foreignKeyName: "topics_subject_version_fkey"
            columns: ["subject_id", "syllabus_version"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id", "syllabus_version"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
