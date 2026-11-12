export const DEPARTMENTS = [
  "Public Works Department (PWD)",
  "Health & Family Welfare",
  "General Education",
  "Higher Education",
  "Local Self Government Department (LSGD)",
  "Revenue Department",
  "Kerala Police",
  "Water Resources",
  "Electricity",
  "Transport",
  "Agriculture",
  "Food and Civil Supplies",
  "Social Justice",
  "Women and Child Development",
] as const;

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
] as const;

export const GRIEVANCE_CATEGORIES = [
  "Roads and public works",
  "Health and family welfare",
  "School education",
  "Higher education",
  "Local self-government services",
  "Land and revenue",
  "Police and public safety",
  "Water supply",
  "Electricity",
  "Public transport",
  "Agriculture",
  "Food and civil supplies",
  "Social justice",
  "Women and child development",
  "Other",
] as const;

export const GRIEVANCE_PRIORITIES = ["Low", "Medium", "High"] as const;

export const GRIEVANCE_STATUSES = [
  "submitted",
  "under_review",
  "assigned",
  "in_progress",
  "action_report_submitted",
  "resolved",
  "rejected",
] as const;

export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

export type Grievance = {
  id: string;
  reference_id: string;
  citizen_id: string;
  topic: string;
  citizen_name: string;
  location: string;
  district: (typeof KERALA_DISTRICTS)[number] | null;
  citizen_category: (typeof GRIEVANCE_CATEGORIES)[number] | null;
  content: string;
  category: string | null;
  priority: (typeof GRIEVANCE_PRIORITIES)[number] | null;
  status: GrievanceStatus;
  assigned_department: (typeof DEPARTMENTS)[number] | null;
  assigned_officer_id: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
};

export function grievanceStatusLabel(status: GrievanceStatus) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
