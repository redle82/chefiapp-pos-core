/**
 * P4-7: Collaboration Features Service
 *
 * Serviço para recursos de colaboração em tempo real
 * (Complementa P5-7 com chat e comentários)
 */

// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { Logger } from "../logger";
import { supabase } from "../supabase";
import { realtimeCollaborationService } from "./RealtimeCollaborationService";

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  resourceId?: string; // e.g., order_id, task_id
  resourceType?: string; // e.g., 'order', 'task'
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: number;
}

class CollaborationFeaturesService {
  /**
   * Send chat message
   */
  async sendChatMessage(
    restaurantId: string,
    message: string,
    resourceId?: string,
    resourceType?: string
  ): Promise<ChatMessage | null> {
    try {
      const userId =
        realtimeCollaborationService.getActiveUsers()[0]?.userId || "unknown";
      const userName =
        realtimeCollaborationService.getActiveUsers()[0]?.userName || "User";

      const chatMessage: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userName,
        message,
        timestamp: Date.now(),
        resourceId,
        resourceType,
      };

      // Store in database
      const { error } = await supabase.from("chat_messages").insert({
        id: chatMessage.id,
        restaurant_id: restaurantId,
        user_id: userId,
        user_name: userName,
        message,
        resource_id: resourceId,
        resource_type: resourceType,
        created_at: new Date(chatMessage.timestamp).toISOString(),
      });

      if (error) throw error;

      // Broadcast via collaboration service
      await realtimeCollaborationService.broadcastEvent({
        userId,
        userName,
        action: "chat.message",
        resource: resourceId || "general",
        timestamp: Date.now(),
      });

      return chatMessage;
    } catch (err) {
      Logger.error("Failed to send chat message", err, {
        restaurantId,
        message,
      });
      return null;
    }
  }

  /**
   * Get chat messages
   */
  async getChatMessages(
    restaurantId: string,
    resourceId?: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from("chat_messages")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (resourceId) {
        query = query.eq("resource_id", resourceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || [])
        .map((msg) => ({
          id: msg.id,
          userId: msg.user_id,
          userName: msg.user_name,
          message: msg.message,
          timestamp: new Date(msg.created_at).getTime(),
          resourceId: msg.resource_id,
          resourceType: msg.resource_type,
        }))
        .reverse(); // Reverse to show oldest first
    } catch (err) {
      Logger.error("Failed to get chat messages", err, { restaurantId });
      return [];
    }
  }

  /**
   * Add comment to task
   */
  async addTaskComment(
    taskId: string,
    comment: string
  ): Promise<TaskComment | null> {
    try {
      const userId =
        realtimeCollaborationService.getActiveUsers()[0]?.userId || "unknown";
      const userName =
        realtimeCollaborationService.getActiveUsers()[0]?.userName || "User";

      const taskComment: TaskComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId,
        userId,
        userName,
        comment,
        timestamp: Date.now(),
      };

      // Store in database
      const { error } = await supabase.from("task_comments").insert({
        id: taskComment.id,
        task_id: taskId,
        user_id: userId,
        user_name: userName,
        comment,
        created_at: new Date(taskComment.timestamp).toISOString(),
      });

      if (error) throw error;

      return taskComment;
    } catch (err) {
      Logger.error("Failed to add task comment", err, { taskId, comment });
      return null;
    }
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((comment) => ({
        id: comment.id,
        taskId: comment.task_id,
        userId: comment.user_id,
        userName: comment.user_name,
        comment: comment.comment,
        timestamp: new Date(comment.created_at).getTime(),
      }));
    } catch (err) {
      Logger.error("Failed to get task comments", err, { taskId });
      return [];
    }
  }
}

export const collaborationFeaturesService = new CollaborationFeaturesService();
