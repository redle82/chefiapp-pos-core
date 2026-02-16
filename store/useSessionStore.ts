// store/useSessionStore.ts
import create from "zustand";
import { SessionStoreState, UserSession } from "../types/session.types";

const initialUser: UserSession = {
  id: "u1",
  name: "John Doe",
  role: "operator",
  permissions: ["view_orders", "send_to_kitchen"],
};

export const useSessionStore = create<SessionStoreState>(() => ({
  loggedUser: initialUser,
  role: initialUser.role,
  permissions: initialUser.permissions,
}));
