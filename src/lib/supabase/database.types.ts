
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor": string | null,"created_at": string,"diff": Json | null,"entity": string,"entity_id": string | null,"id": string,"org_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor"?: string | null,"created_at"?: string,"diff"?: Json | null,"entity": string,"entity_id"?: string | null,"id"?: string,"org_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor"?: string | null,"created_at"?: string,"diff"?: Json | null,"entity"?: string,"entity_id"?: string | null,"id"?: string,"org_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"invitations": {
                  Row: {
                    "created_at": string,"created_by": string,"expires_at": string | null,"id": string,"org_id": string,"patient_id": string | null,"redeemed_at": string | null,"redeemed_by": string | null,"role": string,"short_code": string | null,"token_digest": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"expires_at"?: string | null,"id"?: string,"org_id": string,"patient_id"?: string | null,"redeemed_at"?: string | null,"redeemed_by"?: string | null,"role": string,"short_code"?: string | null,"token_digest": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"expires_at"?: string | null,"id"?: string,"org_id"?: string,"patient_id"?: string | null,"redeemed_at"?: string | null,"redeemed_by"?: string | null,"role"?: string,"short_code"?: string | null,"token_digest"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"id": string,"org_id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"org_id": string,"role": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"org_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"patients": {
                  Row: {
                    "created_at": string,"dob": string,"first_name": string,"id": string,"last_activity_at": string,"last_name": string,"mrn": string,"mrn_seq": number,"org_id": string,"phone": string,"search_text": string | null,"sex": string,"status": string,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dob": string,"first_name": string,"id"?: string,"last_activity_at"?: string,"last_name": string,"mrn"?: never,"mrn_seq"?: number,"org_id": string,"phone": string,"search_text"?: never,"sex": string,"status"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"dob"?: string,"first_name"?: string,"id"?: string,"last_activity_at"?: string,"last_name"?: string,"mrn"?: never,"mrn_seq"?: number,"org_id"?: string,"phone"?: string,"search_text"?: never,"sex"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "patients_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"visits": {
                  Row: {
                    "created_at": string,"created_by": string | null,"documentation": string | null,"follow_up": string | null,"follow_up_at": string | null,"id": string,"location": string | null,"org_id": string,"patient_id": string,"reason": string | null,"scheduled_at": string,"source": string,"stage": string,"updated_at": string,"updated_by": string | null,"visit_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"documentation"?: string | null,"follow_up"?: string | null,"follow_up_at"?: string | null,"id"?: string,"location"?: string | null,"org_id": string,"patient_id": string,"reason"?: string | null,"scheduled_at": string,"source"?: string,"stage"?: string,"updated_at"?: string,"updated_by"?: string | null,"visit_type"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"documentation"?: string | null,"follow_up"?: string | null,"follow_up_at"?: string | null,"id"?: string,"location"?: string | null,"org_id"?: string,"patient_id"?: string,"reason"?: string | null,"scheduled_at"?: string,"source"?: string,"stage"?: string,"updated_at"?: string,"updated_by"?: string | null,"visit_type"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "visits_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visits_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"medications": {
                  Row: {
                    "created_at": string,"created_by": string | null,"dose_amount": number | null,"dose_unit": string | null,"frequency": string | null,"id": string,"name": string,"org_id": string,"patient_id": string,"paused_at": string | null,"route": string | null,"rxnorm_code": string | null,"source": string,"started_at": string,"status": string,"stopped_at": string | null,"updated_at": string,"updated_by": string | null,"verification": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"dose_amount"?: number | null,"dose_unit"?: string | null,"frequency"?: string | null,"id"?: string,"name": string,"org_id": string,"patient_id": string,"paused_at"?: string | null,"route"?: string | null,"rxnorm_code"?: string | null,"source"?: string,"started_at"?: string,"status"?: string,"stopped_at"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"dose_amount"?: number | null,"dose_unit"?: string | null,"frequency"?: string | null,"id"?: string,"name"?: string,"org_id"?: string,"patient_id"?: string,"paused_at"?: string | null,"route"?: string | null,"rxnorm_code"?: string | null,"source"?: string,"started_at"?: string,"status"?: string,"stopped_at"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medications_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "medications_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"medication_events": {
                  Row: {
                    "actor": string | null,"at": string,"created_at": string,"detail": Json | null,"id": string,"kind": string,"medication_id": string,"org_id": string,"patient_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor"?: string | null,"at"?: string,"created_at"?: string,"detail"?: Json | null,"id"?: string,"kind": string,"medication_id": string,"org_id": string,"patient_id": string
                  }
                  Update: {
                    "actor"?: string | null,"at"?: string,"created_at"?: string,"detail"?: Json | null,"id"?: string,"kind"?: string,"medication_id"?: string,"org_id"?: string,"patient_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medication_events_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "medication_events_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "medication_events_medication_id_fkey"
      columns: ["medication_id"]
isOneToOne: false
      referencedRelation: "medications"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "created_at": string,"created_by": string | null,"filename": string,"id": string,"kind": string,"mime_type": string | null,"org_id": string,"patient_id": string,"size_bytes": number | null,"source": string,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"filename": string,"id"?: string,"kind": string,"mime_type"?: string | null,"org_id": string,"patient_id": string,"size_bytes"?: number | null,"source"?: string,"storage_path": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"filename"?: string,"id"?: string,"kind"?: string,"mime_type"?: string | null,"org_id"?: string,"patient_id"?: string,"size_bytes"?: number | null,"source"?: string,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"lab_orders": {
                  Row: {
                    "created_at": string,"created_by": string | null,"document_id": string | null,"id": string,"name": string,"notes": string | null,"ordered_at": string,"org_id": string,"patient_id": string,"source": string,"status": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"ordered_at"?: string,"org_id": string,"patient_id": string,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"ordered_at"?: string,"org_id"?: string,"patient_id"?: string,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lab_orders_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"lab_results": {
                  Row: {
                    "analyte": string,"created_at": string,"created_by": string | null,"document_id": string | null,"flag": string | null,"id": string,"order_id": string,"org_id": string,"patient_id": string,"reference_range": string | null,"resulted_at": string,"source": string,"unit": string | null,"value": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "analyte": string,"created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"flag"?: string | null,"id"?: string,"order_id": string,"org_id": string,"patient_id": string,"reference_range"?: string | null,"resulted_at"?: string,"source"?: string,"unit"?: string | null,"value"?: number | null
                  }
                  Update: {
                    "analyte"?: string,"created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"flag"?: string | null,"id"?: string,"order_id"?: string,"org_id"?: string,"patient_id"?: string,"reference_range"?: string | null,"resulted_at"?: string,"source"?: string,"unit"?: string | null,"value"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lab_results_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "lab_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lab_results_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    }
                  ]
                },"imaging_orders": {
                  Row: {
                    "body_site": string | null,"created_at": string,"created_by": string | null,"id": string,"modality": string,"notes": string | null,"ordered_at": string,"org_id": string,"patient_id": string,"source": string,"status": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_site"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"modality": string,"notes"?: string | null,"ordered_at"?: string,"org_id": string,"patient_id": string,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "body_site"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"modality"?: string,"notes"?: string | null,"ordered_at"?: string,"org_id"?: string,"patient_id"?: string,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "imaging_orders_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"imaging_results": {
                  Row: {
                    "created_at": string,"created_by": string | null,"document_id": string | null,"id": string,"impression": string,"order_id": string,"org_id": string,"patient_id": string,"resulted_at": string,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"id"?: string,"impression": string,"order_id": string,"org_id": string,"patient_id": string,"resulted_at"?: string,"source"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"id"?: string,"impression"?: string,"order_id"?: string,"org_id"?: string,"patient_id"?: string,"resulted_at"?: string,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "imaging_results_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "imaging_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "imaging_results_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    }
                  ]
                },"allergies": {
                  Row: {
                    "allergen": string,"created_at": string,"created_by": string | null,"id": string,"notes": string | null,"noted_at": string,"org_id": string,"patient_id": string,"reaction": string | null,"severity": string | null,"source": string,"status": string,"updated_at": string,"updated_by": string | null,"verification": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allergen": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"notes"?: string | null,"noted_at"?: string,"org_id": string,"patient_id": string,"reaction"?: string | null,"severity"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string
                  }
                  Update: {
                    "allergen"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"notes"?: string | null,"noted_at"?: string,"org_id"?: string,"patient_id"?: string,"reaction"?: string | null,"severity"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "allergies_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"genetics": {
                  Row: {
                    "created_at": string,"created_by": string | null,"document_id": string | null,"gene": string | null,"id": string,"interpretation": string | null,"kind": string,"org_id": string,"patient_id": string,"reported_at": string,"significance": string | null,"source": string,"updated_at": string,"updated_by": string | null,"variant": string | null,"verification": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"gene"?: string | null,"id"?: string,"interpretation"?: string | null,"kind": string,"org_id": string,"patient_id": string,"reported_at"?: string,"significance"?: string | null,"source"?: string,"updated_at"?: string,"updated_by"?: string | null,"variant"?: string | null,"verification"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string | null,"gene"?: string | null,"id"?: string,"interpretation"?: string | null,"kind"?: string,"org_id"?: string,"patient_id"?: string,"reported_at"?: string,"significance"?: string | null,"source"?: string,"updated_at"?: string,"updated_by"?: string | null,"variant"?: string | null,"verification"?: string
                  }
                   Relationships: [
                     {
      foreignKeyName: "genetics_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "genetics_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    }
                   ]
                 },"ai_insights": {
                   Row: {
                     "body": string,"created_at": string,"created_by": string | null,"evidence": Json,"id": string,"kind": string,"org_id": string,"patient_id": string,"provenance": string,"review_state": string,"reviewed_at": string | null,"reviewed_by": string | null,"title": string,"updated_at": string,"updated_by": string | null,"verification": string,"window": Json | null
                   }
                   ComputedFields: never
                   Insert: {
                     "body": string,"created_at"?: string,"created_by"?: string | null,"evidence": Json,"id"?: string,"kind": string,"org_id": string,"patient_id": string,"provenance"?: string,"review_state"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string,"window"?: Json | null
                   }
                   Update: {
                     "body"?: string,"created_at"?: string,"created_by"?: string | null,"evidence"?: Json,"id"?: string,"kind"?: string,"org_id"?: string,"patient_id"?: string,"provenance"?: string,"review_state"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string,"window"?: Json | null
                   }
                   Relationships: [
                     {
      foreignKeyName: "ai_insights_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                   ]
                 },"ocr_extractions": {
                   Row: {
                     "created_at": string,"created_by": string | null,"document_id": string,"id": string,"org_id": string,"patient_id": string,"payload": Json | null,"provider": string | null,"rejection_reason": string | null,"source": string,"status": string,"updated_at": string,"updated_by": string | null,"verification": string,"verified_at": string | null,"verified_by": string | null
                   }
                   ComputedFields: never
                   Insert: {
                     "created_at"?: string,"created_by"?: string | null,"document_id": string,"id"?: string,"org_id": string,"patient_id": string,"payload"?: Json | null,"provider"?: string | null,"rejection_reason"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string,"verified_at"?: string | null,"verified_by"?: string | null
                   }
                   Update: {
                     "created_at"?: string,"created_by"?: string | null,"document_id"?: string,"id"?: string,"org_id"?: string,"patient_id"?: string,"payload"?: Json | null,"provider"?: string | null,"rejection_reason"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null,"verification"?: string,"verified_at"?: string | null,"verified_by"?: string | null
                   }
                   Relationships: [
                     {
      foreignKeyName: "ocr_extractions_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ocr_extractions_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    }
                   ]
                 },"patient_observations": {
                   Row: {
                     "created_at": string,"created_by": string | null,"id": string,"kind": string,"note": string | null,"observed_at": string,"org_id": string,"patient_id": string,"source": string,"unit": string | null,"user_id": string,"value_numeric": number | null,"value_secondary": number | null
                   }
                   ComputedFields: never
                   Insert: {
                     "created_at"?: string,"created_by"?: string | null,"id"?: string,"kind": string,"note"?: string | null,"observed_at"?: string,"org_id": string,"patient_id": string,"source"?: string,"unit"?: string | null,"user_id"?: string,"value_numeric"?: number | null,"value_secondary"?: number | null
                   }
                   Update: {
                     "created_at"?: string,"created_by"?: string | null,"id"?: string,"kind"?: string,"note"?: string | null,"observed_at"?: string,"org_id"?: string,"patient_id"?: string,"source"?: string,"unit"?: string | null,"user_id"?: string,"value_numeric"?: number | null,"value_secondary"?: number | null
                   }
                   Relationships: [
                     {
      foreignKeyName: "patient_observations_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                   ]
                 },"care_tasks": {
                   Row: {
                     "created_at": string,"created_by": string | null,"detail": string | null,"due_at": string | null,"id": string,"kind": string,"org_id": string,"patient_id": string,"source": string,"status": string,"title": string,"updated_at": string,"updated_by": string | null
                   }
                   ComputedFields: never
                   Insert: {
                     "created_at"?: string,"created_by"?: string | null,"detail"?: string | null,"due_at"?: string | null,"id"?: string,"kind"?: string,"org_id": string,"patient_id": string,"source"?: string,"status"?: string,"title": string,"updated_at"?: string,"updated_by"?: string | null
                   }
                   Update: {
                     "created_at"?: string,"created_by"?: string | null,"detail"?: string | null,"due_at"?: string | null,"id"?: string,"kind"?: string,"org_id"?: string,"patient_id"?: string,"source"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                   }
                   Relationships: [
                     {
      foreignKeyName: "care_tasks_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                   ]
                 },"care_task_completions": {
                   Row: {
                     "completed_at": string,"created_at": string,"created_by": string | null,"id": string,"note": string | null,"org_id": string,"patient_id": string,"source": string,"task_id": string,"user_id": string
                   }
                   ComputedFields: never
                   Insert: {
                     "completed_at"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"note"?: string | null,"org_id": string,"patient_id": string,"source"?: string,"task_id": string,"user_id"?: string
                   }
                   Update: {
                     "completed_at"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"note"?: string | null,"org_id"?: string,"patient_id"?: string,"source"?: string,"task_id"?: string,"user_id"?: string
                   }
                   Relationships: [
                     {
      foreignKeyName: "care_task_completions_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "care_task_completions_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "care_tasks"
      referencedColumns: ["id"]
    }
                   ]
                 }
           }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "list_org_members":
{ Args: { "p_org_id": string }; Returns: Json
                           },
"preview_invite":
{ Args: { "p_raw_token": string }; Returns: Json
                           },
"redeem_invite":
{ Args: { "p_raw_token": string }; Returns: Json
                           },
"remove_membership":
{ Args: { "p_membership_id": string }; Returns: undefined
                           },
            "show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                            },
"record_extracted_medication":
{ Args: { "p_dose_amount": number | null, "p_dose_unit": string | null, "p_frequency": string | null, "p_name": string, "p_org_id": string, "p_patient_id": string, "p_route": string | null, "p_started_at": string | null }; Returns: string
                            },
"supersede_pending_ai_insights":
{ Args: { "p_patient_id": string }; Returns: undefined
                            },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
