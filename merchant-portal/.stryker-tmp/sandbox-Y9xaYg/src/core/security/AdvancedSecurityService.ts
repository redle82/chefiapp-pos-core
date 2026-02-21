/**
 * P5-9: Advanced Security Service
 *
 * Serviço para recursos avançados de segurança
 */

// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { Logger } from "../logger";
import { supabase } from "../supabase";

export interface SecurityEvent {
  userId: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TwoFactorAuthConfig {
  enabled: boolean;
  method: "totp" | "sms" | "email";
  secret?: string;
}

class AdvancedSecurityService {
  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in audit log table
      const { error } = await supabase.from("security_audit_log").insert({
        user_id: event.userId,
        action: event.action,
        resource: event.resource,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        metadata: event.metadata,
        created_at: new Date(event.timestamp).toISOString(),
      });

      if (error) throw error;
    } catch (err) {
      Logger.error("Failed to log security event", err, { event });
    }
  }

  /**
   * Detect anomalies (simple pattern detection)
   */
  async detectAnomalies(
    userId: string,
    action: string,
  ): Promise<{
    isAnomalous: boolean;
    reason?: string;
    severity: "low" | "medium" | "high";
  }> {
    try {
      // Get recent events for this user
      const { data: recentEvents } = await supabase
        .from("security_audit_log")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order("created_at", { ascending: false })
        .limit(100);

      if (!recentEvents || recentEvents.length === 0) {
        return { isAnomalous: false, severity: "low" };
      }

      // Check for rapid repeated actions (potential abuse)
      const sameActionCount = recentEvents.filter(
        (e: Record<string, any>) => e.action === action,
      ).length;
      if (sameActionCount > 50) {
        return {
          isAnomalous: true,
          reason: "Rapid repeated actions detected",
          severity: "high",
        };
      }

      // Check for unusual time patterns (outside business hours)
      const now = new Date();
      const hour = now.getHours();
      if (hour < 6 || hour > 23) {
        return {
          isAnomalous: true,
          reason: "Activity outside business hours",
          severity: "medium",
        };
      }

      return { isAnomalous: false, severity: "low" };
    } catch (err) {
      Logger.error("Failed to detect anomalies", err, { userId, action });
      return { isAnomalous: false, severity: "low" };
    }
  }

  /**
   * Generate TOTP secret for 2FA
   */
  generateTOTPSecret(): string {
    // Simple implementation - in production, use a proper TOTP library
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Verify TOTP code
   */
  verifyTOTP(secret: string, code: string): boolean {
    // Simple implementation - in production, use a proper TOTP library
    // This is a placeholder
    return code.length === 6 && /^\d+$/.test(code);
  }
}

export const advancedSecurityService = new AdvancedSecurityService();
