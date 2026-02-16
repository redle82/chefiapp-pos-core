// types/session.types.ts

export type UserRole = "operator" | "manager" | "owner";

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

export interface SessionStoreState {
  loggedUser: UserSession | null;
  role: UserRole;
  permissions: string[];
}
