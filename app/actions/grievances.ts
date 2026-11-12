"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEPARTMENTS, GRIEVANCE_CATEGORIES, KERALA_DISTRICTS } from "@/lib/grievances";
import { getSignedInProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type GrievanceActionState = {
  message: string;
  success: boolean;
  referenceId?: string;
};

const grievanceSchema = z.object({
  topic: z.string().trim().min(3, "Enter a topic with at least 3 characters.").max(120),
  citizenName: z.string().trim().min(2, "Enter your name.").max(150),
  location: z.string().trim().min(2, "Enter the location.").max(300),
  district: z.enum(KERALA_DISTRICTS),
  category: z.enum(GRIEVANCE_CATEGORIES),
  content: z.string().trim().min(20, "Describe the issue in at least 20 characters.").max(5000),
});

const workflowSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["route", "progress", "report", "forward", "review", "remark", "escalate"]),
  note: z.string().trim().max(3000).optional(),
  department: z.union([z.enum(DEPARTMENTS), z.literal("")]).optional(),
  decision: z.enum(["resolved", "in_progress"]).optional(),
  officerId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const GRIEVANCE_BUCKET = "grievance-documents";
const WORKFLOW_ACTIONS = [
  "/citizen/dashboard",
  "/cmo/dashboard",
  "/department/dashboard",
  "/cmo/ai-analysis",
];

function isAllowedDocument(file: File) {
  if (file.type === "application/pdf") {
    return file.name.toLowerCase().endsWith(".pdf");
  }
  if (file.type === "image/jpeg") {
    return /\.(jpe?g)$/i.test(file.name);
  }
  return false;
}

export async function submitGrievance(
  _previousState: GrievanceActionState,
  formData: FormData,
): Promise<GrievanceActionState> {
  const profile = await getSignedInProfile();
  if (profile.role !== "citizen") {
    return { success: false, message: "Only Citizen accounts can submit a grievance." };
  }

  const parsed = grievanceSchema.safeParse({
    topic: formData.get("topic"),
    citizenName: formData.get("citizenName"),
    location: formData.get("location"),
    district: formData.get("district"),
    category: formData.get("category"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Check the grievance details and try again.",
    };
  }

  const fileValue = formData.get("document");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  if (file && (!isAllowedDocument(file) || file.size > MAX_FILE_SIZE)) {
    return {
      success: false,
      message: "Attach a JPG or PDF document no larger than 10 MB.",
    };
  }

  const supabase = await createClient();
  const grievanceId = crypto.randomUUID();
  let attachmentPath: string | null = null;
  let attachmentName: string | null = null;
  let attachmentMimeType: string | null = null;

  if (file) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const isPdf = file.type === "application/pdf" && bytes.subarray(0, 5).toString() === "%PDF-";
    const isJpeg = file.type === "image/jpeg"
      && bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff;

    if (!isPdf && !isJpeg) {
      return {
        success: false,
        message: "The selected file does not appear to be a valid JPG or PDF document.",
      };
    }

    const extension = isPdf ? "pdf" : "jpg";
    const safeName = file.name
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100) || `document.${extension}`;
    attachmentPath = `${profile.id}/${grievanceId}/${crypto.randomUUID()}.${extension}`;
    attachmentName = safeName;
    attachmentMimeType = isPdf ? "application/pdf" : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from(GRIEVANCE_BUCKET)
      .upload(attachmentPath, file, {
        contentType: attachmentMimeType,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: `The document could not be uploaded: ${uploadError.message}`,
      };
    }
  }

  const { data: grievance, error: insertError } = await supabase
    .from("grievances")
    .insert({
      id: grievanceId,
      citizen_id: profile.id,
      topic: parsed.data.topic,
      citizen_name: parsed.data.citizenName,
      location: parsed.data.location,
      district: parsed.data.district,
      citizen_category: parsed.data.category,
      content: parsed.data.content,
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_mime_type: attachmentMimeType,
    })
    .select("reference_id")
    .single();

  if (insertError) {
    if (attachmentPath) {
      const { error: cleanupError } = await supabase.storage
        .from(GRIEVANCE_BUCKET)
        .remove([attachmentPath]);
      if (cleanupError) {
        return {
          success: false,
          message: `The grievance could not be saved (${insertError.message}); the uploaded file also needs cleanup (${cleanupError.message}).`,
        };
      }
    }
    return {
      success: false,
      message: `The grievance could not be saved: ${insertError.message}`,
    };
  }

  revalidatePath("/citizen/dashboard");
  revalidatePath("/cmo/dashboard");
  revalidatePath("/department/dashboard");

  return {
    success: true,
    referenceId: grievance.reference_id,
    message: "Your grievance has been submitted successfully.",
  };
}

export async function processGrievanceWorkflowAction(
  _previousState: GrievanceActionState,
  formData: FormData,
): Promise<GrievanceActionState> {
  const profile = await getSignedInProfile();
  if (profile.role !== "cmo_admin" && profile.role !== "department_officer") {
    return { success: false, message: "You are not allowed to update grievances." };
  }

  const parsed = workflowSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    note: formData.get("note") ?? undefined,
    department: formData.get("department") ?? undefined,
    decision: formData.get("decision") ?? undefined,
    officerId: formData.get("officerId") ?? undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Check the workflow update and try again.",
    };
  }

  const { id, action, note, department, decision, officerId } = parsed.data;
  const isCmoAction = action === "route" || action === "review" || action === "remark" || action === "escalate";
  if ((isCmoAction && profile.role !== "cmo_admin")
    || (!isCmoAction && profile.role !== "department_officer")) {
    return { success: false, message: "Your account cannot perform this workflow action." };
  }

  const fileValue = formData.get("document");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  if (file && action !== "progress") {
    return { success: false, message: "A PDF attachment is only accepted with an investigation progress update." };
  }
  if (file && (
    file.type !== "application/pdf"
    || !file.name.toLowerCase().endsWith(".pdf")
    || file.size > MAX_FILE_SIZE
  )) {
    return { success: false, message: "Attach a PDF no larger than 10 MB." };
  }

  const supabase = await createClient();
  let attachmentPath: string | null = null;
  let attachmentName: string | null = null;

  if (file) {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString() !== "%PDF-") {
      return { success: false, message: "The selected file does not appear to be a valid PDF." };
    }

    attachmentPath = `${profile.id}/${id}/${crypto.randomUUID()}.pdf`;
    attachmentName = file.name
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100) || "investigation.pdf";

    const { error: uploadError } = await supabase.storage
      .from(GRIEVANCE_BUCKET)
      .upload(attachmentPath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: `The investigation PDF could not be uploaded: ${uploadError.message}`,
      };
    }
  }

  const { data: referenceId, error } = action === "route"
    ? await supabase.rpc("route_grievance_to_department", {
      p_grievance_id: id,
      p_department: department || null,
      p_officer_id: officerId || null,
      p_note: note || null,
    })
    : await supabase.rpc("apply_grievance_workflow_action", {
      p_grievance_id: id,
      p_action: action,
      p_note: note || null,
      p_department: department || null,
      p_decision: decision || null,
      p_attachment_path: attachmentPath,
      p_attachment_name: attachmentName,
    });

  if (error) {
    if (attachmentPath) {
      const { error: cleanupError } = await supabase.storage
        .from(GRIEVANCE_BUCKET)
        .remove([attachmentPath]);
      if (cleanupError) {
        return {
          success: false,
          message: `The workflow update failed (${error.message}); the uploaded PDF also needs cleanup (${cleanupError.message}).`,
        };
      }
    }
    return { success: false, message: `Could not save the workflow update: ${error.message}` };
  }

  for (const path of WORKFLOW_ACTIONS) {
    revalidatePath(path);
  }

  return {
    success: true,
    referenceId,
    message: `Grievance ${referenceId} workflow updated.`,
  };
}

export async function submitCitizenFeedback(
  _previousState: GrievanceActionState,
  formData: FormData,
): Promise<GrievanceActionState> {
  const profile = await getSignedInProfile();
  if (profile.role !== "citizen") {
    return { success: false, message: "Only Citizens can submit grievance feedback." };
  }

  const parsed = z.object({
    grievanceId: z.string().uuid(),
    feedback: z.string().trim().min(3, "Enter feedback with at least 3 characters.").max(2000),
  }).safeParse({
    grievanceId: formData.get("grievanceId"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Check your feedback and try again.",
    };
  }

  const supabase = await createClient();
  const { data: grievance, error: grievanceError } = await supabase
    .from("grievances")
    .select("reference_id")
    .eq("id", parsed.data.grievanceId)
    .eq("citizen_id", profile.id)
    .eq("status", "resolved")
    .maybeSingle();

  if (grievanceError) {
    return { success: false, message: `Could not verify resolved grievance: ${grievanceError.message}` };
  }
  if (!grievance) {
    return { success: false, message: "Feedback is available only for your resolved grievances." };
  }

  const { error: insertError } = await supabase
    .from("citizen_grievance_feedback")
    .insert({
      grievance_id: parsed.data.grievanceId,
      citizen_id: profile.id,
      feedback: parsed.data.feedback,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, message: "Feedback has already been submitted for this grievance." };
    }
    return { success: false, message: `Could not save your feedback: ${insertError.message}` };
  }

  revalidatePath("/citizen/dashboard");
  return {
    success: true,
    referenceId: grievance.reference_id,
    message: "Thank you. Your feedback has been recorded.",
  };
}
