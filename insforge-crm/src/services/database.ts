import { insforge } from "../config/insforge";

export interface Contact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  tags: string[];
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  title: string;
  company_id?: string;
  amount?: number;
  stage: "lead" | "prospect" | "proposal" | "negotiation" | "won" | "lost";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  deal_id?: string;
  contact_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  old_stage?: string;
  new_stage: string;
  timestamp: string;
}

// ==================== CONTACTS ====================

export async function fetchContacts(userId: string, search?: string) {
  let query = insforge.database
    .from("contacts")
    .select("*")
    .eq("user_id", userId);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  return query;
}

export async function createContact(
  userId: string,
  contact: Omit<Contact, "id" | "user_id" | "created_at" | "updated_at">,
) {
  return insforge.database
    .from("contacts")
    .insert([{ ...contact, user_id: userId }])
    .select();
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  return insforge.database
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select();
}

export async function deleteContact(id: string) {
  return insforge.database.from("contacts").delete().eq("id", id);
}

// ==================== COMPANIES ====================

export async function fetchCompanies(userId: string) {
  return insforge.database.from("companies").select("*").eq("user_id", userId);
}

export async function createCompany(
  userId: string,
  company: Omit<Company, "id" | "user_id" | "created_at" | "updated_at">,
) {
  return insforge.database
    .from("companies")
    .insert([{ ...company, user_id: userId }])
    .select();
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  return insforge.database
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select();
}

// ==================== DEALS ====================

export async function fetchDeals(userId: string) {
  return insforge.database
    .from("deals")
    .select("*,companies(*),deal_activities(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function fetchDealsByStage(userId: string, stage: string) {
  return insforge.database
    .from("deals")
    .select("*,companies(*)")
    .eq("user_id", userId)
    .eq("stage", stage);
}

export async function createDeal(
  userId: string,
  deal: Omit<Deal, "id" | "user_id" | "created_at" | "updated_at">,
) {
  return insforge.database
    .from("deals")
    .insert([{ ...deal, user_id: userId, stage: "lead" }])
    .select();
}

export async function updateDealStage(dealId: string, newStage: string) {
  return insforge.database
    .from("deals")
    .update({ stage: newStage })
    .eq("id", dealId)
    .select();
}

export async function logDealActivity(
  dealId: string,
  oldStage: string | null,
  newStage: string,
) {
  return insforge.database
    .from("deal_activities")
    .insert([{ deal_id: dealId, old_stage: oldStage, new_stage: newStage }])
    .select();
}

// ==================== TASKS ====================

export async function fetchTasks(
  userId: string,
  filters?: { deal_id?: string; completed?: boolean },
) {
  let query = insforge.database.from("tasks").select("*").eq("user_id", userId);

  if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);
  if (filters?.completed !== undefined)
    query = query.eq("completed", filters.completed);

  return query.order("due_date", { ascending: true });
}

export async function createTask(
  userId: string,
  task: Omit<Task, "id" | "user_id" | "created_at">,
) {
  return insforge.database
    .from("tasks")
    .insert([{ ...task, user_id: userId }])
    .select();
}

export async function updateTask(id: string, updates: Partial<Task>) {
  return insforge.database.from("tasks").update(updates).eq("id", id).select();
}

export async function deleteTask(id: string) {
  return insforge.database.from("tasks").delete().eq("id", id);
}

// ==================== ATTACHMENTS ====================

export async function fetchAttachments(dealId?: string, contactId?: string) {
  let query = insforge.database.from("attachments").select("*");

  if (dealId) query = query.eq("deal_id", dealId);
  if (contactId) query = query.eq("contact_id", contactId);

  return query;
}

export async function createAttachment(attachment: {
  deal_id?: string;
  contact_id?: string;
  file_url: string;
  file_key: string;
  file_name: string;
}) {
  return insforge.database.from("attachments").insert([attachment]).select();
}

export async function deleteAttachment(id: string) {
  return insforge.database.from("attachments").delete().eq("id", id);
}
