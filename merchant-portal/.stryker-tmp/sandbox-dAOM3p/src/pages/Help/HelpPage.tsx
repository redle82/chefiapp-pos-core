/**
 * HelpPage — Centro de ajuda mínimo.
 * Secções: Como começar, Primeiros 30 minutos, Criar ementa, Abrir turno, Receber pedidos, Imprimir recibo, FAQ.
 * Acessível em /app/help (Staff: More → Ajuda; Admin: Governar → Centro de Ajuda).
 */
// @ts-nocheck


import React from "react";
import { Link } from "react-router-dom";
import { colors } from "../../ui/design-system/tokens/colors";

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: colors.text.primary,
  marginBottom: 8,
};

const paraStyle: React.CSSProperties = {
  fontSize: 14,
  color: colors.text.secondary,
  lineHeight: 1.5,
  marginBottom: 8,
};

const listStyle: React.CSSProperties = {
  marginLeft: 16,
  marginBottom: 8,
  fontSize: 14,
  color: colors.text.secondary,
  lineHeight: 1.5,
};

const faqItemStyle: React.CSSProperties = {
  marginBottom: 12,
  paddingBottom: 12,
  borderBottom: `1px solid ${colors.border.subtle}`,
};

const faqQStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: 4,
};

const faqAStyle: React.CSSProperties = {
  fontSize: 13,
  color: colors.text.secondary,
  lineHeight: 1.5,
};

export function HelpPage() {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: 24,
        paddingBottom: 48,
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: 24,
        }}
      >
        Centro de Ajuda
      </h1>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Como começar</h2>
        <p style={paraStyle}>
          Se acabou de criar o restaurante: vá ao <strong>app Staff</strong> (ecrã inicial da operação),
          abra um turno e use o <strong>TPV</strong> para registar vendas. O <strong>KDS</strong> mostra os pedidos na cozinha.
        </p>
        <p style={paraStyle}>
          <Link
            to="/app/staff/home"
            style={{ color: colors.action.base, fontWeight: 600, textDecoration: "none" }}
          >
            Ir ao app Staff →
          </Link>
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Primeiros 30 minutos</h2>
        <p style={paraStyle}>
          Depois de criar o restaurante e concluir o onboarding:
        </p>
        <ul style={listStyle}>
          <li>Crie a ementa (produtos e categorias) no Config ou no Menu Builder.</li>
          <li>Abra um turno no app Staff (modo Operação ou Turno).</li>
          <li>Use o TPV para registar vendas e o KDS para a cozinha ver os pedidos.</li>
          <li>Imprima ou partilhe recibos a partir do TPV ou do pedido.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Criar ementa</h2>
        <p style={paraStyle}>
          Aceda a <strong>Config → Ementa</strong> ou à aplicação <strong>Menu Builder</strong>.
          Crie categorias (ex.: Entradas, Pratos, Bebidas) e depois adicione produtos em cada categoria,
          com nome, preço e opcionalmente foto. Os produtos ficam disponíveis no TPV e no menu público
          assim que publicar.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Abrir turno</h2>
        <p style={paraStyle}>
          No app Staff, entre no modo <strong>Turno</strong> ou <strong>Operação</strong>.
          Abra a caixa (abertura de turno) indicando o valor inicial. Enquanto o turno estiver ativo,
          pode registar vendas no TPV. Ao terminar o dia, feche o turno no mesmo ecrã.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Receber pedidos</h2>
        <p style={paraStyle}>
          O <strong>TPV</strong> serve para criar pedidos (mesa ou balcão), adicionar itens e encerrar
          com pagamento. O <strong>KDS</strong> (ecrã de cozinha) mostra os pedidos em tempo real por
          estado (novo, em preparação, pronto). Pode usar vários dispositivos: um no balcão e outro na cozinha.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Imprimir recibo</h2>
        <p style={paraStyle}>
          A partir do TPV, após concluir o pedido, use a opção de imprimir ou partilhar recibo.
          O recibo inclui número sequencial, NIF, ATCUD e QR code para validação na AT (Portugal).
          Para exportar SAF-T (XML) por período, use <strong>Relatórios → Exportar SAF-T</strong>.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>Perguntas frequentes</h2>

        <div style={faqItemStyle}>
          <p style={faqQStyle}>Como adiciono o restaurante ao ecrã inicial?</p>
          <p style={faqAStyle}>
            No browser, use a opção "Adicionar ao ecrã" ou "Instalar aplicação" no menu do browser.
            Assim o ChefIApp abre como app, sem barra de endereço.
          </p>
        </div>

        <div style={faqItemStyle}>
          <p style={faqQStyle}>O que fazer se não tiver internet?</p>
          <p style={faqAStyle}>
            O TPV e o KDS usam uma cópia do menu em cache. Pode continuar a registar vendas; os pedidos
            ficam em fila e são enviados quando a ligação voltar. Uma barra "Modo offline" indica esse estado.
          </p>
        </div>

        <div style={faqItemStyle}>
          <p style={faqQStyle}>Como altero o plano ou cancelo?</p>
          <p style={faqAStyle}>
            Em <strong>Config → Faturação</strong> (ou <strong>Billing</strong>) pode gerir a subscrição
            e aceder ao portal do Stripe para alterar o plano ou cancelar.
          </p>
        </div>

        <div style={faqItemStyle}>
          <p style={faqQStyle}>O trial terminou. O que fazer?</p>
          <p style={faqAStyle}>
            Será mostrado um ecrã para escolher um plano e concluir o pagamento. Após ativar o plano,
            o acesso volta ao normal.
          </p>
        </div>
      </section>
    </div>
  );
}
