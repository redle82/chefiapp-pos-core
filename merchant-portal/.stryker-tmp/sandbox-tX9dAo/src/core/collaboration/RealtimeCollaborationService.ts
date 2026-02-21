/**
 * P5-7: Real-time Collaboration Service
 *
 * Serviço para colaboração em tempo real
 */

// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { Logger } from "../logger";
import { isDevStableMode } from "../runtime/devStableMode";
import { supabase } from "../supabase";

export interface PresenceUser {
  userId: string;
  userName: string;
  role: string;
  currentPage: string;
  lastSeen: number;
  isActive: boolean;
}

export interface CollaborationEvent {
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: number;
}

class RealtimeCollaborationService {
  private presenceChannel: any = null;
  private presenceUsers: Map<string, PresenceUser> = new Map();
  private eventListeners: Array<(event: CollaborationEvent) => void> = [];

  /**
   * Initialize presence tracking
   */
  async initializePresence(
    restaurantId: string,
    userId: string,
    userName: string,
    role: string
  ): Promise<void> {
    // STEP 6: DEV_STABLE_MODE - no realtime subscriptions
    if (isDevStableMode()) return;

    try {
      // Subscribe to presence channel
      this.presenceChannel = supabase
        .channel(`presence:${restaurantId}`)
        .on("presence", { event: "sync" }, () => {
          const state = this.presenceChannel.presenceState();
          this.updatePresenceUsers(state);
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log(
            "[RealtimeCollaboration] User joined:",
            key,
            newPresences
          );
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("[RealtimeCollaboration] User left:", key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await this.presenceChannel.track({
              userId,
              userName,
              role,
              currentPage: window.location.pathname,
              lastSeen: Date.now(),
              isActive: true,
            });
          }
        });
    } catch (err) {
      Logger.error("Failed to initialize presence", err, {
        restaurantId,
        userId,
      });
    }
  }

  /**
   * Update presence users from state
   */
  private updatePresenceUsers(state: any): void {
    this.presenceUsers.clear();
    for (const [key, presences] of Object.entries(state)) {
      for (const presence of presences as any[]) {
        this.presenceUsers.set(presence.userId, {
          userId: presence.userId,
          userName: presence.userName,
          role: presence.role,
          currentPage: presence.currentPage,
          lastSeen: presence.lastSeen,
          isActive: Date.now() - presence.lastSeen < 30000, // Active if seen in last 30s
        });
      }
    }
  }

  /**
   * Get active users
   */
  getActiveUsers(): PresenceUser[] {
    return Array.from(this.presenceUsers.values()).filter((u) => u.isActive);
  }

  /**
   * Broadcast collaboration event
   */
  async broadcastEvent(event: CollaborationEvent): Promise<void> {
    try {
      // Send to collaboration channel
      await supabase.channel(`collaboration:${event.resource}`).send({
        type: "broadcast",
        event: "action",
        payload: event,
      });

      // Notify local listeners
      this.eventListeners.forEach((listener) => listener(event));
    } catch (err) {
      Logger.error("Failed to broadcast event", err, { event });
    }
  }

  /**
   * Subscribe to collaboration events
   */
  subscribeToEvents(listener: (event: CollaborationEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.presenceChannel) {
      this.presenceChannel.unsubscribe();
      this.presenceChannel = null;
    }
    this.presenceUsers.clear();
    this.eventListeners = [];
  }
}

export const realtimeCollaborationService = new RealtimeCollaborationService();
