export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  auth_api: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_session_access: {
        Args: Record<PropertyKey, never>;
        Returns: {
          auth_mode: string;
          security_settings_allowed: boolean;
          workspace_allowed: boolean;
        }[];
      };
      process_clerk_identity_event: {
        Args: {
          p_clerk_subject_id: string;
          p_email_verified: boolean;
          p_event_id: string;
          p_event_timestamp: number;
          p_event_type: string;
          p_signed_delivery_at: string;
          p_updated_at: number;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  private: {
    Tables: {
      access_audit_events: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          reason_code: string;
          resource_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          reason_code: string;
          resource_id: string;
          workspace_id: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          reason_code?: string;
          resource_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_audit_events_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "access_audit_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      access_command_receipts: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          expires_at: string;
          request_hash: string;
          request_id: string;
          response: NonNullable<Json>;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          expires_at?: string;
          request_hash: string;
          request_id: string;
          response: NonNullable<Json>;
          workspace_id: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          expires_at?: string;
          request_hash?: string;
          request_id?: string;
          response?: NonNullable<Json>;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_command_receipts_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "access_command_receipts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      access_policy: {
        Row: {
          mode: Database["private"]["Enums"]["auth_mode"];
          pilot_workspace_id: string | null;
          singleton: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          mode: Database["private"]["Enums"]["auth_mode"];
          pilot_workspace_id?: string | null;
          singleton?: boolean;
          updated_at?: string;
        };
        Update: {
          mode?: Database["private"]["Enums"]["auth_mode"];
          pilot_workspace_id?: string | null;
          singleton?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_policy_pilot_workspace_id_fkey";
            columns: ["pilot_workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      app_users: {
        Row: {
          clerk_event_timestamp: number | null;
          clerk_subject_id: string;
          clerk_updated_at: number | null;
          created_at: string;
          disabled_at: string | null;
          email_verified: boolean;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          clerk_event_timestamp?: number | null;
          clerk_subject_id: string;
          clerk_updated_at?: number | null;
          created_at?: string;
          disabled_at?: string | null;
          email_verified?: boolean;
          id?: string;
        };
        Update: {
          clerk_event_timestamp?: number | null;
          clerk_subject_id?: string;
          clerk_updated_at?: number | null;
          created_at?: string;
          disabled_at?: string | null;
          email_verified?: boolean;
          id?: string;
        };
        Relationships: [];
      };
      brand_assignments: {
        Row: {
          brand_id: string;
          user_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          brand_id: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          brand_id?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_assignments_workspace_id_brand_id_fkey";
            columns: ["workspace_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "brand_assignments_workspace_id_user_id_fkey";
            columns: ["workspace_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      brand_playbooks: {
        Row: {
          audience: string;
          brand_id: string;
          created_at: string;
          created_by_user_id: string;
          guidance: string;
          version: number;
          voice: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          audience: string;
          brand_id: string;
          created_at?: string;
          created_by_user_id: string;
          guidance: string;
          version: number;
          voice: string;
          workspace_id: string;
        };
        Update: {
          audience?: string;
          brand_id?: string;
          created_at?: string;
          created_by_user_id?: string;
          guidance?: string;
          version?: number;
          voice?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_playbooks_workspace_id_brand_id_fkey";
            columns: ["workspace_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "brand_playbooks_workspace_id_created_by_user_id_fkey";
            columns: ["workspace_id", "created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      brands: {
        Row: {
          access_version: number;
          created_at: string;
          id: string;
          name: string;
          version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          access_version?: number;
          created_at?: string;
          id?: string;
          name: string;
          version?: number;
          workspace_id: string;
        };
        Update: {
          access_version?: number;
          created_at?: string;
          id?: string;
          name?: string;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brands_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      destination_grants: {
        Row: {
          destination_id: string;
          user_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          destination_id: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          destination_id?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "destination_grants_workspace_id_destination_id_fkey";
            columns: ["workspace_id", "destination_id"];
            isOneToOne: false;
            referencedRelation: "workspace_destinations";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "destination_grants_workspace_id_user_id_fkey";
            columns: ["workspace_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      erasure_ledger: {
        Row: {
          completed_at: string | null;
          id: string;
          reason_code: string;
          requested_at: string;
          source_id: string | null;
          state: string;
          subject_user_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          id?: string;
          reason_code: string;
          requested_at?: string;
          source_id?: string | null;
          state?: string;
          subject_user_id: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          reason_code?: string;
          requested_at?: string;
          source_id?: string | null;
          state?: string;
          subject_user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erasure_ledger_subject_user_id_fkey";
            columns: ["subject_user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erasure_ledger_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erasure_source_fk";
            columns: ["workspace_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      excerpt_grants: {
        Row: {
          excerpt_id: string;
          purpose: Database["private"]["Enums"]["source_purpose"];
          recipient_user_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          excerpt_id: string;
          purpose: Database["private"]["Enums"]["source_purpose"];
          recipient_user_id: string;
          workspace_id: string;
        };
        Update: {
          excerpt_id?: string;
          purpose?: Database["private"]["Enums"]["source_purpose"];
          recipient_user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "excerpt_grants_workspace_id_excerpt_id_fkey";
            columns: ["workspace_id", "excerpt_id"];
            isOneToOne: false;
            referencedRelation: "source_excerpts";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "excerpt_grants_workspace_id_recipient_user_id_fkey";
            columns: ["workspace_id", "recipient_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      identity_deletion_markers: {
        Row: {
          clerk_subject_hash: string;
          deleted_at: string;
        };
        ComputedFields: never;
        Insert: {
          clerk_subject_hash: string;
          deleted_at?: string;
        };
        Update: {
          clerk_subject_hash?: string;
          deleted_at?: string;
        };
        Relationships: [];
      };
      identity_webhook_receipts: {
        Row: {
          event_id: string;
          expires_at: string;
          received_at: string;
        };
        ComputedFields: never;
        Insert: {
          event_id: string;
          expires_at?: string;
          received_at?: string;
        };
        Update: {
          event_id?: string;
          expires_at?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      pilot_identities: {
        Row: {
          clerk_subject_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          clerk_subject_id: string;
          created_at?: string;
        };
        Update: {
          clerk_subject_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      plan_catalog_versions: {
        Row: {
          account_limit: number | null;
          included_seats: number | null;
          network_limit: number;
          per_network_limit: number | null;
          plan_key: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          account_limit?: number | null;
          included_seats?: number | null;
          network_limit: number;
          per_network_limit?: number | null;
          plan_key: string;
          version: number;
        };
        Update: {
          account_limit?: number | null;
          included_seats?: number | null;
          network_limit?: number;
          per_network_limit?: number | null;
          plan_key?: string;
          version?: number;
        };
        Relationships: [];
      };
      source_excerpts: {
        Row: {
          body: string | null;
          created_at: string;
          erased_at: string | null;
          id: string;
          reviewed_by_user_id: string;
          revoked_at: string | null;
          search_document: unknown;
          source_access_version: number;
          source_id: string;
          source_version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string | null;
          created_at?: string;
          erased_at?: string | null;
          id?: string;
          reviewed_by_user_id: string;
          revoked_at?: string | null;
          search_document?: never;
          source_access_version: number;
          source_id: string;
          source_version: number;
          workspace_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          erased_at?: string | null;
          id?: string;
          reviewed_by_user_id?: string;
          revoked_at?: string | null;
          search_document?: never;
          source_access_version?: number;
          source_id?: string;
          source_version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_excerpts_workspace_id_reviewed_by_user_id_fkey";
            columns: ["workspace_id", "reviewed_by_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "source_excerpts_workspace_id_source_id_source_version_fkey";
            columns: ["workspace_id", "source_id", "source_version"];
            isOneToOne: false;
            referencedRelation: "source_revisions";
            referencedColumns: ["workspace_id", "source_id", "version"];
          },
        ];
      };
      source_grants: {
        Row: {
          access_version: number;
          created_at: string;
          granted_by_user_id: string;
          id: string;
          purpose: Database["private"]["Enums"]["source_purpose"];
          recipient_user_id: string;
          revoked_at: string | null;
          source_id: string;
          source_version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          access_version?: number;
          created_at?: string;
          granted_by_user_id: string;
          id?: string;
          purpose: Database["private"]["Enums"]["source_purpose"];
          recipient_user_id: string;
          revoked_at?: string | null;
          source_id: string;
          source_version?: number;
          workspace_id: string;
        };
        Update: {
          access_version?: number;
          created_at?: string;
          granted_by_user_id?: string;
          id?: string;
          purpose?: Database["private"]["Enums"]["source_purpose"];
          recipient_user_id?: string;
          revoked_at?: string | null;
          source_id?: string;
          source_version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_grant_revision_fk";
            columns: ["workspace_id", "source_id", "source_version"];
            isOneToOne: false;
            referencedRelation: "source_revisions";
            referencedColumns: ["workspace_id", "source_id", "version"];
          },
          {
            foreignKeyName: "source_grants_workspace_id_granted_by_user_id_fkey";
            columns: ["workspace_id", "granted_by_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "source_grants_workspace_id_recipient_user_id_fkey";
            columns: ["workspace_id", "recipient_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "source_grants_workspace_id_source_id_fkey";
            columns: ["workspace_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      source_recoveries: {
        Row: {
          actor_user_id: string;
          created_at: string;
          custodian_user_id: string;
          expires_at: string;
          id: string;
          reason_code: string;
          source_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_user_id: string;
          created_at?: string;
          custodian_user_id: string;
          expires_at?: string;
          id?: string;
          reason_code: string;
          source_id: string;
          workspace_id: string;
        };
        Update: {
          actor_user_id?: string;
          created_at?: string;
          custodian_user_id?: string;
          expires_at?: string;
          id?: string;
          reason_code?: string;
          source_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_recoveries_workspace_id_actor_user_id_fkey";
            columns: ["workspace_id", "actor_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "source_recoveries_workspace_id_custodian_user_id_fkey";
            columns: ["workspace_id", "custodian_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "source_recoveries_workspace_id_source_id_fkey";
            columns: ["workspace_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      source_revisions: {
        Row: {
          authored_by_user_id: string;
          body: string | null;
          created_at: string;
          erased_at: string | null;
          search_document: unknown;
          source_id: string;
          title: string | null;
          version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          authored_by_user_id: string;
          body?: string | null;
          created_at?: string;
          erased_at?: string | null;
          search_document?: never;
          source_id: string;
          title?: string | null;
          version: number;
          workspace_id: string;
        };
        Update: {
          authored_by_user_id?: string;
          body?: string | null;
          created_at?: string;
          erased_at?: string | null;
          search_document?: never;
          source_id?: string;
          title?: string | null;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_revisions_workspace_id_authored_by_user_id_fkey";
            columns: ["workspace_id", "authored_by_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "source_revisions_workspace_id_source_id_fkey";
            columns: ["workspace_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      sources: {
        Row: {
          access_version: number;
          brand_id: string | null;
          category: Database["private"]["Enums"]["source_category"];
          client_authority_confirmed: boolean;
          content_version: number;
          created_at: string;
          creator_user_id: string;
          custodian_user_id: string | null;
          deleted_at: string | null;
          expires_at: string | null;
          id: string;
          permitted_purposes: Database["private"]["Enums"]["source_purpose"][];
          state: Database["private"]["Enums"]["source_state"];
          title: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          access_version?: number;
          brand_id?: string | null;
          category: Database["private"]["Enums"]["source_category"];
          client_authority_confirmed?: boolean;
          content_version?: number;
          created_at?: string;
          creator_user_id: string;
          custodian_user_id?: string | null;
          deleted_at?: string | null;
          expires_at?: string | null;
          id?: string;
          permitted_purposes: Database["private"]["Enums"]["source_purpose"][];
          state?: Database["private"]["Enums"]["source_state"];
          title: string;
          workspace_id: string;
        };
        Update: {
          access_version?: number;
          brand_id?: string | null;
          category?: Database["private"]["Enums"]["source_category"];
          client_authority_confirmed?: boolean;
          content_version?: number;
          created_at?: string;
          creator_user_id?: string;
          custodian_user_id?: string | null;
          deleted_at?: string | null;
          expires_at?: string | null;
          id?: string;
          permitted_purposes?: Database["private"]["Enums"]["source_purpose"][];
          state?: Database["private"]["Enums"]["source_state"];
          title?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_brand_fk";
            columns: ["workspace_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "sources_custodian_fk";
            columns: ["workspace_id", "custodian_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "sources_workspace_id_creator_user_id_fkey";
            columns: ["workspace_id", "creator_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      workspace_destinations: {
        Row: {
          created_at: string;
          enabled: boolean;
          external_identity: string;
          id: string;
          provider: string;
          version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          enabled?: boolean;
          external_identity: string;
          id?: string;
          provider: string;
          version?: number;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          external_identity?: string;
          id?: string;
          provider?: string;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_destinations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          invited_by_user_id: string;
          recipient_user_id: string;
          revoked_at: string | null;
          role: Database["private"]["Enums"]["workspace_role"];
          secret_hash: string;
          version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          invited_by_user_id: string;
          recipient_user_id: string;
          revoked_at?: string | null;
          role: Database["private"]["Enums"]["workspace_role"];
          secret_hash: string;
          version?: number;
          workspace_id: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          invited_by_user_id?: string;
          recipient_user_id?: string;
          revoked_at?: string | null;
          role?: Database["private"]["Enums"]["workspace_role"];
          secret_hash?: string;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_recipient_user_id_fkey";
            columns: ["recipient_user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_invited_by_user_id_fkey";
            columns: ["workspace_id", "invited_by_user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_memberships";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      workspace_memberships: {
        Row: {
          created_at: string;
          id: string;
          removed_at: string | null;
          role: Database["private"]["Enums"]["workspace_role"];
          user_id: string;
          version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          removed_at?: string | null;
          role: Database["private"]["Enums"]["workspace_role"];
          user_id: string;
          version?: number;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          removed_at?: string | null;
          role?: Database["private"]["Enums"]["workspace_role"];
          user_id?: string;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_plan_assignments: {
        Row: {
          additional_seats: number;
          catalog_version: number;
          effective_at: string;
          origin: string;
          plan_key: string;
          version: number;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          additional_seats?: number;
          catalog_version: number;
          effective_at?: string;
          origin: string;
          plan_key: string;
          version?: number;
          workspace_id: string;
        };
        Update: {
          additional_seats?: number;
          catalog_version?: number;
          effective_at?: string;
          origin?: string;
          plan_key?: string;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_plan_assignments_plan_key_catalog_version_fkey";
            columns: ["plan_key", "catalog_version"];
            isOneToOne: false;
            referencedRelation: "plan_catalog_versions";
            referencedColumns: ["plan_key", "version"];
          },
          {
            foreignKeyName: "workspace_plan_assignments_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_workspace_invitation: {
        Args: {
          p_invitation_id: string;
          p_request_id: string;
          p_secret_hash: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      activate_workspace_destination: {
        Args: {
          p_expected_version: number;
          p_external_identity: string;
          p_provider: string;
          p_request_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      apply_clerk_identity_event: {
        Args: {
          p_clerk_subject_id: string;
          p_email_verified: boolean;
          p_event_id: string;
          p_event_timestamp: number;
          p_event_type: string;
          p_signed_delivery_at: string;
          p_updated_at: number;
        };
        Returns: string;
      };
      assign_workspace_plan: {
        Args: {
          p_additional_seats: number;
          p_catalog_version: number;
          p_expected_version: number;
          p_plan_key: string;
          p_reason_code: string;
          p_request_id: string;
          p_retained_ids: string[];
          p_workspace_id: string;
        };
        Returns: Json;
      };
      begin_source_read: {
        Args: {
          p_purpose: Database["private"]["Enums"]["source_purpose"];
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      brand_visible: {
        Args: { p_brand_id: string; p_workspace_id: string };
        Returns: boolean;
      };
      change_workspace_member: {
        Args: {
          p_expected_version: number;
          p_new_role: Database["private"]["Enums"]["workspace_role"];
          p_request_id: string;
          p_user_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      check_destination_limits: {
        Args: {
          p_catalog_version: number;
          p_extra_provider: string;
          p_plan_key: string;
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      command_can_edit_sources: {
        Args: { p_workspace_id: string };
        Returns: boolean;
      };
      command_workspace_accessible: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      complete_access_command: {
        Args: {
          p_action: string;
          p_actor_id: string;
          p_input: Json;
          p_reason_code: string;
          p_request_id: string;
          p_resource_id: string;
          p_version: number;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      create_private_capture: {
        Args: {
          p_allowed_data_confirmed: boolean;
          p_body: string;
          p_brand_id: string;
          p_category: Database["private"]["Enums"]["source_category"];
          p_client_authority: boolean;
          p_expires_at: string;
          p_purposes: Database["private"]["Enums"]["source_purpose"][];
          p_request_id: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      current_access_purpose: {
        Args: Record<PropertyKey, never>;
        Returns: Database["private"]["Enums"]["source_purpose"];
      };
      current_actor_id: { Args: Record<PropertyKey, never>; Returns: string };
      current_clerk_subject: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_user_id: { Args: Record<PropertyKey, never>; Returns: string };
      destination_visible: {
        Args: { p_destination_id: string; p_workspace_id: string };
        Returns: boolean;
      };
      disable_workspace_destination: {
        Args: {
          p_destination_id: string;
          p_expected_version: number;
          p_request_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      erase_private_source: {
        Args: {
          p_expected_access_version: number;
          p_expected_content_version: number;
          p_request_id: string;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      excerpt_visible: {
        Args: {
          p_excerpt_id: string;
          p_purpose: Database["private"]["Enums"]["source_purpose"];
          p_workspace_id: string;
        };
        Returns: boolean;
      };
      invalidate_source_reuse: {
        Args: { p_source_id: string; p_workspace_id: string };
        Returns: undefined;
      };
      issue_workspace_invitation: {
        Args: {
          p_recipient_id: string;
          p_request_id: string;
          p_role: Database["private"]["Enums"]["workspace_role"];
          p_secret_hash: string;
          p_valid_hours: number;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      lock_workspace_actor: {
        Args: { p_workspace_id: string };
        Returns: string;
      };
      mfa_recent: { Args: Record<PropertyKey, never>; Returns: boolean };
      occupied_workspace_seats: {
        Args: { p_workspace_id: string };
        Returns: number;
      };
      pilot_identity_allowed: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      preview_workspace_plan: {
        Args: {
          p_additional_seats: number;
          p_catalog_version: number;
          p_plan_key: string;
          p_retained_ids: string[];
          p_workspace_id: string;
        };
        Returns: Json;
      };
      read_reviewed_excerpt: {
        Args: {
          p_excerpt_id: string;
          p_purpose: Database["private"]["Enums"]["source_purpose"];
          p_workspace_id: string;
        };
        Returns: Json;
      };
      read_source_revision: {
        Args: {
          p_purpose: Database["private"]["Enums"]["source_purpose"];
          p_source_id: string;
          p_version: number;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      read_workspace_access: {
        Args: {
          p_after_id: string;
          p_limit: number;
          p_resource: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      recover_orphaned_source: {
        Args: {
          p_custodian_id: string;
          p_expected_access_version: number;
          p_expected_content_version: number;
          p_reason_code: string;
          p_request_id: string;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      release_reviewed_excerpt: {
        Args: {
          p_body: string;
          p_expected_access_version: number;
          p_expected_content_version: number;
          p_purposes: Database["private"]["Enums"]["source_purpose"][];
          p_recipients: string[];
          p_request_id: string;
          p_review_confirmed: boolean;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      replay_access_command: {
        Args: {
          p_action: string;
          p_actor_id: string;
          p_input: Json;
          p_request_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      require_source_custodian: {
        Args: {
          p_access_version: number;
          p_allow_expired?: boolean;
          p_content_version: number;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: {
          access_version: number;
          brand_id: string | null;
          category: Database["private"]["Enums"]["source_category"];
          client_authority_confirmed: boolean;
          content_version: number;
          created_at: string;
          creator_user_id: string;
          custodian_user_id: string | null;
          deleted_at: string | null;
          expires_at: string | null;
          id: string;
          permitted_purposes: Database["private"]["Enums"]["source_purpose"][];
          state: Database["private"]["Enums"]["source_state"];
          title: string;
          workspace_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "sources";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      require_workspace_role: {
        Args: {
          p_roles: Database["private"]["Enums"]["workspace_role"][];
          p_workspace_id: string;
        };
        Returns: Database["private"]["Enums"]["workspace_role"];
      };
      resolve_command_actor: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      revise_private_capture: {
        Args: {
          p_allowed_data_confirmed: boolean;
          p_body: string;
          p_brand_id: string;
          p_category: Database["private"]["Enums"]["source_category"];
          p_client_authority: boolean;
          p_expected_access_version: number;
          p_expected_content_version: number;
          p_expires_at: string;
          p_purposes: Database["private"]["Enums"]["source_purpose"][];
          p_request_id: string;
          p_source_id: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      revoke_source_sharing: {
        Args: {
          p_expected_access_version: number;
          p_expected_content_version: number;
          p_request_id: string;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      revoke_workspace_invitation: {
        Args: {
          p_expected_version: number;
          p_invitation_id: string;
          p_request_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      search_private_library: {
        Args: {
          p_after_id: string;
          p_limit: number;
          p_purpose: Database["private"]["Enums"]["source_purpose"];
          p_query: string;
          p_resource: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      security_settings_access: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      set_brand_assignment: {
        Args: {
          p_allowed: boolean;
          p_brand_id: string;
          p_expected_access_version: number;
          p_request_id: string;
          p_user_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      set_destination_grant: {
        Args: {
          p_allowed: boolean;
          p_destination_id: string;
          p_expected_version: number;
          p_request_id: string;
          p_user_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      share_source_original: {
        Args: {
          p_expected_access_version: number;
          p_expected_content_version: number;
          p_purposes: Database["private"]["Enums"]["source_purpose"][];
          p_recipients: string[];
          p_request_id: string;
          p_share_confirmed: boolean;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      source_custodian: {
        Args: { p_source_id: string; p_workspace_id: string };
        Returns: boolean;
      };
      source_visible: {
        Args: {
          p_purpose: Database["private"]["Enums"]["source_purpose"];
          p_source_id: string;
          p_version: number;
          p_workspace_id: string;
        };
        Returns: boolean;
      };
      validate_capture_text: {
        Args: {
          p_allowed_data_confirmed: boolean;
          p_body: string;
          p_category: Database["private"]["Enums"]["source_category"];
          p_client_authority: boolean;
          p_expires_at: string;
          p_purposes: Database["private"]["Enums"]["source_purpose"][];
          p_title: string;
        };
        Returns: undefined;
      };
      validate_source_recipients: {
        Args: {
          p_purposes: Database["private"]["Enums"]["source_purpose"][];
          p_recipients: string[];
          p_source: Omit<
            Database["private"]["Tables"]["sources"]["Row"],
            Database["private"]["Tables"]["sources"]["ComputedFields"]
          >;
        };
        Returns: undefined;
      };
      workspace_accessible: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      workspace_seat_capacity: {
        Args: { p_workspace_id: string };
        Returns: number;
      };
      write_brand: {
        Args: {
          p_audience: string;
          p_brand_id: string;
          p_expected_version: number;
          p_guidance: string;
          p_name: string;
          p_request_id: string;
          p_voice: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      auth_mode: "closed_pilot" | "require_mfa";
      source_category: "personal_draft" | "client_confidential";
      source_purpose:
        "editorial_reuse" | "excerpt_release" | "analytics" | "ai_proposal";
      source_state:
        "private" | "shared" | "revoked" | "erasure_pending" | "deleted";
      workspace_role: "owner" | "admin" | "editor" | "publisher" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  auth_api: {
    Enums: {},
  },
  private: {
    Enums: {
      auth_mode: ["closed_pilot", "require_mfa"],
      source_category: ["personal_draft", "client_confidential"],
      source_purpose: [
        "editorial_reuse",
        "excerpt_release",
        "analytics",
        "ai_proposal",
      ],
      source_state: [
        "private",
        "shared",
        "revoked",
        "erasure_pending",
        "deleted",
      ],
      workspace_role: ["owner", "admin", "editor", "publisher", "viewer"],
    },
  },
} as const;
