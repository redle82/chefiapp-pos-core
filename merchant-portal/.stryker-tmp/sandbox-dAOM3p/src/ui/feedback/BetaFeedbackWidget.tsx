// @ts-nocheck
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { useAuth } from "../../core/auth/useAuth";
import { useTenant } from "../../core/tenant/TenantContext";
import "./BetaFeedbackWidget.css";

// Reuse design system if possible, or stick to raw for isolation
// Using raw CSS for the widget to ensure it floats above everything else without layout interference

type FeedbackType = "bug" | "feature" | "other";
type FeedbackSeverity = "low" | "medium" | "high" | "critical";

export const BetaFeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [severity, setSeverity] = useState<FeedbackSeverity>("low");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const { user } = useAuth();
  const { tenantId } = useTenant(); // Use the hook directly

  // Only show for authenticated users (rough check, can be refined)
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const metadata = {
        url: window.location.href,
        path: location.pathname,
        userAgent: navigator.userAgent,
        screen: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };

      const { error: dbError } = await dockerCoreClient
        .from("beta_feedback")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          type,
          severity: type === "bug" ? severity : "low", // severity mainly relevant for bugs
          message,
          metadata,
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setMessage("");
        setType("bug");
        setSeverity("low");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      setError(err.message || "Erro ao enviar feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="beta-feedback-trigger"
        onClick={() => setIsOpen(true)}
        title="Enviar Feedback Beta"
      >
        <div className="beta-feedback-icon-pulse"></div>
        <MessageSquare size={24} />
        <span className="beta-feedback-label">Beta Feedback</span>
      </button>
    );
  }

  return (
    <div className="beta-feedback-overlay">
      <div className="beta-feedback-modal">
        <div className="beta-feedback-header">
          <h3>Feedback Beta</h3>
          <button onClick={() => setIsOpen(false)} className="beta-close-btn">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="beta-feedback-success">
            <CheckCircle size={48} className="text-green-500 mb-2" />
            <p>Feedback enviado com sucesso!</p>
            <p className="text-sm text-gray-500">
              Obrigado por nos ajudar a melhorar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="beta-feedback-form">
            <div className="beta-form-group">
              <label>Tipo</label>
              <div className="beta-type-selector">
                <button
                  type="button"
                  className={type === "bug" ? "active bug" : ""}
                  onClick={() => setType("bug")}
                >
                  <AlertTriangle size={16} /> Bug
                </button>
                <button
                  type="button"
                  className={type === "feature" ? "active feature" : ""}
                  onClick={() => setType("feature")}
                >
                  <Lightbulb size={16} /> Ideia
                </button>
                <button
                  type="button"
                  className={type === "other" ? "active other" : ""}
                  onClick={() => setType("other")}
                >
                  <MessageSquare size={16} /> Outro
                </button>
              </div>
            </div>

            {type === "bug" && (
              <div className="beta-form-group">
                <label>Gravidade</label>
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as FeedbackSeverity)
                  }
                  className="beta-select"
                >
                  <option value="low">Baixa (Visual/Texto)</option>
                  <option value="medium">Média (Funcionalidade parcial)</option>
                  <option value="high">Alta (Funcionalidade quebrada)</option>
                  <option value="critical">Crítica (App parou)</option>
                </select>
              </div>
            )}

            <div className="beta-form-group">
              <label>Descrição</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "O que você estava fazendo e o que aconteceu?"
                    : "Qual sua ideia ou sugestão?"
                }
                rows={4}
                required
                className="beta-textarea"
              />
            </div>

            {error && <div className="beta-error-msg">{error}</div>}

            <button
              type="submit"
              className="beta-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send size={16} /> Enviar Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
