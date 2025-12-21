export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      category_urls: {
        Row: {
          category: Database["public"]["Enums"]["scholarship_category"]
          custom_url: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["scholarship_category"]
          custom_url: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["scholarship_category"]
          custom_url?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scholarship_submissions: {
        Row: {
          admin_notes: string | null
          applicant_status: Database["public"]["Enums"]["applicant_status"]
          berkas_pendukung_url: string | null
          bukti_listrik_url: string | null
          bukti_penghasilan_url: string | null
          bukti_struk_url: string | null
          category: Database["public"]["Enums"]["scholarship_category"]
          cv_url: string | null
          email: string
          essay: string | null
          full_name: string
          id: string
          kartu_pelajar_url: string | null
          khs_url: string | null
          ktm_url: string | null
          phone: string | null
          sertifikat_prestasi_url: string | null
          sktm_url: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          surat_keterangan_yatim_url: string | null
          token_id: string
          transkrip_nilai_url: string | null
          updated_at: string
          user_id: string
          video_tiktok_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          applicant_status: Database["public"]["Enums"]["applicant_status"]
          berkas_pendukung_url?: string | null
          bukti_listrik_url?: string | null
          bukti_penghasilan_url?: string | null
          bukti_struk_url?: string | null
          category: Database["public"]["Enums"]["scholarship_category"]
          cv_url?: string | null
          email: string
          essay?: string | null
          full_name: string
          id?: string
          kartu_pelajar_url?: string | null
          khs_url?: string | null
          ktm_url?: string | null
          phone?: string | null
          sertifikat_prestasi_url?: string | null
          sktm_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          surat_keterangan_yatim_url?: string | null
          token_id: string
          transkrip_nilai_url?: string | null
          updated_at?: string
          user_id: string
          video_tiktok_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          applicant_status?: Database["public"]["Enums"]["applicant_status"]
          berkas_pendukung_url?: string | null
          bukti_listrik_url?: string | null
          bukti_penghasilan_url?: string | null
          bukti_struk_url?: string | null
          category?: Database["public"]["Enums"]["scholarship_category"]
          cv_url?: string | null
          email?: string
          essay?: string | null
          full_name?: string
          id?: string
          kartu_pelajar_url?: string | null
          khs_url?: string | null
          ktm_url?: string | null
          phone?: string | null
          sertifikat_prestasi_url?: string | null
          sktm_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          surat_keterangan_yatim_url?: string | null
          token_id?: string
          transkrip_nilai_url?: string | null
          updated_at?: string
          user_id?: string
          video_tiktok_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_submissions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "scholarship_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_tokens: {
        Row: {
          category: Database["public"]["Enums"]["scholarship_category"]
          created_at: string
          id: string
          status: Database["public"]["Enums"]["token_status"]
          token_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["scholarship_category"]
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["token_status"]
          token_code: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["scholarship_category"]
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["token_status"]
          token_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      applicant_status: "pelajar" | "gap_year" | "mahasiswa"
      scholarship_category: "prestasi" | "yatim" | "ekonomi" | "umum"
      submission_status: "menunggu" | "diverifikasi" | "ditolak"
      token_status: "valid" | "digunakan" | "tidak_valid"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      applicant_status: ["pelajar", "gap_year", "mahasiswa"],
      scholarship_category: ["prestasi", "yatim", "ekonomi", "umum"],
      submission_status: ["menunggu", "diverifikasi", "ditolak"],
      token_status: ["valid", "digunakan", "tidak_valid"],
    },
  },
} as const
