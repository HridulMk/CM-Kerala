import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Grievance } from "@/lib/grievances";

export type GrievanceWithDocument = Grievance & {
  documentUrl: string | null;
  documentError: string | null;
  workflowEvents: GrievanceWorkflowEvent[];
  citizenFeedback: { feedback: string; created_at: string } | null;
};

export type GrievanceWorkflowEvent = {
  id: string;
  grievance_id: string;
  event_type:
    | "cmo_routed"
    | "officer_progress"
    | "department_report"
    | "department_forwarded"
    | "cmo_reviewed"
    | "cmo_remark"
    | "cmo_escalated"
    | "cmo_assigned_officer";
  note: string | null;
  from_department: string | null;
  to_department: string | null;
  to_officer_id: string | null;
  status_after: Grievance["status"];
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  documentUrl: string | null;
  documentError: string | null;
};

export type GrievanceForAiAnalysis = Pick<
  Grievance,
  | "id"
  | "reference_id"
  | "topic"
  | "location"
  | "content"
  | "status"
  | "assigned_department"
  | "created_at"
>;

export type DepartmentOfficerOption = {
  id: string;
  full_name: string;
  department: string;
};

export type CmoDashboardFilters = {
  district?: string;
  category?: string;
  priority?: string;
  status?: string;
  overdue?: boolean;
  page: number;
};

export type CmoDashboardMetrics = {
  summary: Record<string, number>;
  districts: Array<{ name: string; total: number }>;
  departments: Array<{ name: string; total: number }>;
  categories: Array<{ name: string; total: number }>;
  priorities: Array<{ name: string; total: number }>;
};

const aiAnalysisColumns =
  "id, reference_id, topic, location, content, status, assigned_department, created_at";

const grievanceColumns =
  "id, reference_id, citizen_id, topic, citizen_name, location, district, citizen_category, content, category, priority, status, assigned_department, assigned_officer_id, attachment_path, attachment_name, created_at";

async function attachWorkflowEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  grievances: Grievance[],
  includeWorkflowAttachments = true,
): Promise<GrievanceWithDocument[]> {
  let workflowEvents: Omit<GrievanceWorkflowEvent, "documentUrl" | "documentError">[] = [];
  if (grievances.length > 0) {
    const { data: eventData, error: eventError } = await supabase
      .from("grievance_workflow_events")
      .select(
        "id, grievance_id, event_type, note, from_department, to_department, to_officer_id, status_after, attachment_path, attachment_name, created_at",
      )
      .in("grievance_id", grievances.map((grievance) => grievance.id))
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000);

    if (eventError) {
      if (eventError.code === "PGRST205") {
        throw new Error("The grievance workflow database setup is missing. Run supabase/grievance-workflow.sql in the Supabase SQL Editor.");
      }
      throw new Error(`Could not load grievance workflow history: ${eventError.message}`);
    }
    workflowEvents = (eventData ?? []) as typeof workflowEvents;
  }

  const eventsByGrievance = new Map<string, typeof workflowEvents>();
  for (const event of workflowEvents) {
    const caseEvents = eventsByGrievance.get(event.grievance_id) ?? [];
    caseEvents.push(event);
    eventsByGrievance.set(event.grievance_id, caseEvents);
  }

  const feedbackByGrievance = new Map<string, { feedback: string; created_at: string }>();
  if (grievances.length > 0) {
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("citizen_grievance_feedback")
      .select("grievance_id, feedback, created_at")
      .in("grievance_id", grievances.map((grievance) => grievance.id));
    if (feedbackError) {
      if (feedbackError.code === "PGRST205") {
        throw new Error("Citizen feedback database setup is missing. Run supabase/citizen-portal.sql in the Supabase SQL Editor.");
      }
      throw new Error(`Could not load citizen feedback: ${feedbackError.message}`);
    }
    for (const feedback of feedbackData ?? []) {
      feedbackByGrievance.set(feedback.grievance_id, {
        feedback: feedback.feedback,
        created_at: feedback.created_at,
      });
    }
  }

  return Promise.all(grievances.map(async (grievance) => {
    const documentResult = grievance.attachment_path
      ? await supabase.storage.from("grievance-documents")
        .createSignedUrl(grievance.attachment_path, 300)
      : { data: null, error: null };
    const caseEvents = eventsByGrievance.get(grievance.id) ?? [];
    const signedEvents = await Promise.all(caseEvents.map(async (event) => {
      if (!includeWorkflowAttachments || !event.attachment_path) {
        return { ...event, documentUrl: null, documentError: null };
      }
      const { data: signedDocument, error: documentError } = await supabase.storage
        .from("grievance-documents")
        .createSignedUrl(event.attachment_path, 300);
      return {
        ...event,
        documentUrl: signedDocument?.signedUrl ?? null,
        documentError: documentError?.message ?? null,
      };
    }));

    return {
      ...grievance,
      documentUrl: documentResult.data?.signedUrl ?? null,
      documentError: documentResult.error?.message ?? null,
      workflowEvents: signedEvents,
      citizenFeedback: feedbackByGrievance.get(grievance.id) ?? null,
    };
  }));
}

export async function getDepartmentOfficerOptions(): Promise<DepartmentOfficerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, department")
    .eq("role", "department_officer")
    .not("department", "is", null)
    .order("department")
    .order("full_name")
    .limit(500);

  if (error) {
    throw new Error(`Could not load Department Officer options: ${error.message}`);
  }
  return (data ?? []) as DepartmentOfficerOption[];
}

export async function getCmoDashboardMetrics(): Promise<CmoDashboardMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_cmo_grievance_dashboard_metrics");
  if (error) {
    throw new Error(`Could not load CMO dashboard statistics: ${error.message}`);
  }

  const metrics: CmoDashboardMetrics = {
    summary: {},
    districts: [],
    departments: [],
    categories: [],
    priorities: [],
  };
  for (const row of (data ?? []) as Array<{ metric_group: string; metric_name: string; total: number }>) {
    if (row.metric_group === "summary") {
      metrics.summary[row.metric_name] = Number(row.total);
      continue;
    }
    const item = { name: row.metric_name, total: Number(row.total) };
    if (row.metric_group === "district") metrics.districts.push(item);
    if (row.metric_group === "department") metrics.departments.push(item);
    if (row.metric_group === "category") metrics.categories.push(item);
    if (row.metric_group === "priority") metrics.priorities.push(item);
  }
  return metrics;
}

export async function getCmoCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grievances")
    .select("category")
    .not("category", "is", null)
    .order("category")
    .limit(1000);
  if (error) {
    throw new Error(`Could not load grievance categories: ${error.message}`);
  }
  return [...new Set((data ?? [])
    .map((row) => row.category)
    .filter((category): category is string => typeof category === "string"))];
}

export async function getCmoDashboardGrievances(
  filters: CmoDashboardFilters,
): Promise<{ grievances: GrievanceWithDocument[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("grievances")
    .select(grievanceColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (filters.district === "unspecified") query = query.is("district", null);
  else if (filters.district) query = query.eq("district", filters.district);
  if (filters.category === "unclassified") query = query.is("category", null);
  else if (filters.category) query = query.eq("category", filters.category);
  if (filters.priority === "unclassified") query = query.is("priority", null);
  else if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.overdue) {
    const deadline = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query
      .lt("created_at", deadline)
      .not("status", "in", '("resolved","rejected")');
  }

  const pageSize = 50;
  const { data, error, count } = await query
    .range((filters.page - 1) * pageSize, filters.page * pageSize - 1);
  if (error) {
    if (error.code === "PGRST205") {
      redirect("/setup-required?issue=grievances-table");
    }
    throw new Error(`Could not load filtered grievances: ${error.message}`);
  }
  const attached = await attachWorkflowEvents(supabase, (data ?? []) as Grievance[]);
  return { grievances: attached, total: count ?? 0 };
}

export async function getGrievancesForAiAnalysis(): Promise<GrievanceForAiAnalysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grievances")
    .select(aiAnalysisColumns)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === "PGRST205") {
      redirect("/setup-required?issue=grievances-table");
    }
    throw new Error(`Could not load grievances for AI analysis: ${error.message}`);
  }

  return data as GrievanceForAiAnalysis[];
}

export async function getGrievanceForAiAnalysis(
  grievanceId: string,
): Promise<GrievanceForAiAnalysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grievances")
    .select(aiAnalysisColumns)
    .eq("id", grievanceId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205") {
      redirect("/setup-required?issue=grievances-table");
    }
    throw new Error(`Could not load grievance for AI analysis: ${error.message}`);
  }

  return data as GrievanceForAiAnalysis | null;
}

export async function getGrievancesForCurrentUser(
  referenceId?: string,
  includeWorkflowAttachments = true,
): Promise<GrievanceWithDocument[]> {
  const supabase = await createClient();
  let grievanceQuery = supabase
    .from("grievances")
    .select(grievanceColumns)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (referenceId !== undefined) {
    grievanceQuery = grievanceQuery.eq("reference_id", referenceId);
  }

  const { data, error } = await grievanceQuery;
  if (error) {
    if (error.code === "PGRST205") {
      redirect("/setup-required?issue=grievances-table");
    }
    throw new Error(`Could not load grievances: ${error.message}`);
  }

  return attachWorkflowEvents(supabase, data as Grievance[], includeWorkflowAttachments);
}

export async function getCitizenGrievanceCounts(): Promise<{
  total: number;
  pending: number;
  resolved: number;
}> {
  const supabase = await createClient();
  const [totalResult, pendingResult, resolvedResult] = await Promise.all([
    supabase.from("grievances").select("id", { count: "exact", head: true }),
    supabase.from("grievances").select("id", { count: "exact", head: true })
      .not("status", "in", '("resolved","rejected")'),
    supabase.from("grievances").select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
  ]);
  if (pendingResult.error) {
    throw new Error(`Could not load pending grievance count: ${pendingResult.error.message}`);
  }
  if (totalResult.error) {
    throw new Error(`Could not load total grievance count: ${totalResult.error.message}`);
  }
  if (resolvedResult.error) {
    throw new Error(`Could not load resolved grievance count: ${resolvedResult.error.message}`);
  }

  return {
    total: totalResult.count ?? 0,
    pending: pendingResult.count ?? 0,
    resolved: resolvedResult.count ?? 0,
  };
}
