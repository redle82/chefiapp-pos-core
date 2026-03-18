/**
 * ContactPage — Página de contacto do ChefIApp.
 *
 * Formulário simples + WhatsApp + email.
 * Dark theme consistente com o resto do marketing.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Contacto — ChefIApp OS";
const META_DESCRIPTION =
  "Entre em contacto com a equipa ChefIApp. Suporte, vendas, parcerias ou questões técnicas.";

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta("og:title", META_TITLE);
    setMeta("og:description", META_DESCRIPTION);
    setMeta("og:type", "website");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, open mailto with form data
    const subject = encodeURIComponent(form.subject || "Contacto via site");
    const body = encodeURIComponent(
      `Nome: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );
    window.open(`mailto:hello@chefiapp.com?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "#171717",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fafafa",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #262626",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#fafafa",
            textDecoration: "none",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          ChefIApp
        </Link>
        <Link
          to="/auth/phone"
          style={{
            background: "#f59e0b",
            color: "#000",
            padding: "8px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Testar grátis
        </Link>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              color: "#f59e0b",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            Contacto
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            Fale connosco
          </h1>
          <p style={{ color: "#a3a3a3", fontSize: 17, maxWidth: 500, margin: "0 auto" }}>
            Tem dúvidas sobre o ChefIApp? Quer uma demonstração? Estamos aqui para ajudar.
          </p>
        </div>

        {/* Quick contact options */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <a
            href="https://wa.me/34692054892"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: 24,
              background: "#171717",
              border: "1px solid #262626",
              borderRadius: 12,
              textDecoration: "none",
              color: "#fafafa",
              transition: "border-color 0.2s",
            }}
          >
            <span style={{ fontSize: 28 }}>💬</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>WhatsApp</span>
            <span style={{ color: "#a3a3a3", fontSize: 13 }}>Resposta em minutos</span>
          </a>

          <a
            href="mailto:hello@chefiapp.com"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: 24,
              background: "#171717",
              border: "1px solid #262626",
              borderRadius: 12,
              textDecoration: "none",
              color: "#fafafa",
            }}
          >
            <span style={{ fontSize: 28 }}>✉️</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Email</span>
            <span style={{ color: "#a3a3a3", fontSize: 13 }}>hello@chefiapp.com</span>
          </a>

          <Link
            to="/auth/phone"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: 24,
              background: "#171717",
              border: "1px solid #f59e0b33",
              borderRadius: 12,
              textDecoration: "none",
              color: "#fafafa",
            }}
          >
            <span style={{ fontSize: 28 }}>🚀</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Trial Grátis</span>
            <span style={{ color: "#a3a3a3", fontSize: 13 }}>14 dias, sem cartão</span>
          </Link>
        </div>

        {/* Contact Form */}
        {sent ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              background: "#171717",
              borderRadius: 12,
              border: "1px solid #262626",
            }}
          >
            <p style={{ fontSize: 28, marginBottom: 12 }}>✓</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Mensagem preparada
            </h2>
            <p style={{ color: "#a3a3a3" }}>
              O seu cliente de email foi aberto com a mensagem. Envie para completar o contacto.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              style={{
                marginTop: 16,
                padding: "10px 24px",
                background: "#262626",
                border: "none",
                borderRadius: 8,
                color: "#fafafa",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Enviar outra mensagem
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 32,
              background: "#171717",
              borderRadius: 12,
              border: "1px solid #262626",
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Envie-nos uma mensagem
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "#a3a3a3", marginBottom: 6 }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="O seu nome"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "#a3a3a3", marginBottom: 6 }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label
                style={{ display: "block", fontSize: 13, color: "#a3a3a3", marginBottom: 6 }}
              >
                Assunto
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Selecione um assunto</option>
                <option value="Demonstração">Quero uma demonstração</option>
                <option value="Suporte técnico">Suporte técnico</option>
                <option value="Vendas">Informações sobre preços</option>
                <option value="Parceria">Proposta de parceria</option>
                <option value="Outro">Outro assunto</option>
              </select>
            </div>

            <div>
              <label
                style={{ display: "block", fontSize: 13, color: "#a3a3a3", marginBottom: 6 }}
              >
                Mensagem
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Como podemos ajudar?"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "14px 32px",
                background: "#f59e0b",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Enviar mensagem
            </button>
          </form>
        )}
      </div>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
