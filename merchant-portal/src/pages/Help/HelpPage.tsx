/**
 * HelpPage — Centro de ajuda mínimo.
 * Secções: Como começar, Primeiros 30 minutos, Criar ementa, Abrir turno, Receber pedidos, Imprimir recibo, FAQ.
 * Acessível em /app/help (Staff: More → Ajuda; Admin: Governar → Centro de Ajuda).
 */

import { Link } from "react-router-dom";
import { Card } from "../../ui/design-system";
import styles from "./HelpPage.module.css";

export function HelpPage() {
  return (
    <div className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>Centro de Ajuda</h1>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Como começar</h2>
        <p className={styles.paragraph}>
          Se acabou de criar o restaurante: vá ao <strong>app Staff</strong>{" "}
          (ecrã inicial da operação), abra um turno e use o <strong>TPV</strong>{" "}
          para registar vendas. O <strong>KDS</strong> mostra os pedidos na
          cozinha.
        </p>
        <p className={styles.paragraph}>
          <Link to="/app/staff/home" className={styles.link}>
            Ir ao app Staff →
          </Link>
        </p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Primeiros 30 minutos</h2>
        <p className={styles.paragraph}>
          Depois de criar o restaurante e concluir o onboarding:
        </p>
        <ul className={styles.list}>
          <li>
            Crie a ementa (produtos e categorias) no Config ou no Menu Builder.
          </li>
          <li>Abra um turno no app Staff (modo Operação ou Turno).</li>
          <li>
            Use o TPV para registar vendas e o KDS para a cozinha ver os
            pedidos.
          </li>
          <li>Imprima ou partilhe recibos a partir do TPV ou do pedido.</li>
        </ul>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Criar ementa</h2>
        <p className={styles.paragraph}>
          Aceda a <strong>Config → Ementa</strong> ou à aplicação{" "}
          <strong>Menu Builder</strong>. Crie categorias (ex.: Entradas, Pratos,
          Bebidas) e depois adicione produtos em cada categoria, com nome, preço
          e opcionalmente foto. Os produtos ficam disponíveis no TPV e no menu
          público assim que publicar.
        </p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Abrir turno</h2>
        <p className={styles.paragraph}>
          No app Staff, entre no modo <strong>Turno</strong> ou{" "}
          <strong>Operação</strong>. Abra a caixa (abertura de turno) indicando
          o valor inicial. Enquanto o turno estiver ativo, pode registar vendas
          no TPV. Ao terminar o dia, feche o turno no mesmo ecrã.
        </p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Receber pedidos</h2>
        <p className={styles.paragraph}>
          O <strong>TPV</strong> serve para criar pedidos (mesa ou balcão),
          adicionar itens e encerrar com pagamento. O <strong>KDS</strong> (ecrã
          de cozinha) mostra os pedidos em tempo real por estado (novo, em
          preparação, pronto). Pode usar vários dispositivos: um no balcão e
          outro na cozinha.
        </p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Imprimir recibo</h2>
        <p className={styles.paragraph}>
          A partir do TPV, após concluir o pedido, use a opção de imprimir ou
          partilhar recibo. O recibo inclui número sequencial, NIF, ATCUD e QR
          code para validação na AT (Portugal). Para exportar SAF-T (XML) por
          período, use <strong>Relatórios → Exportar SAF-T</strong>.
        </p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>

        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>
            Como adiciono o restaurante ao ecrã inicial?
          </p>
          <p className={styles.faqAnswer}>
            No browser, use a opção "Adicionar ao ecrã" ou "Instalar aplicação"
            no menu do browser. Assim o ChefIApp abre como app, sem barra de
            endereço.
          </p>
        </div>

        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>
            O que fazer se não tiver internet?
          </p>
          <p className={styles.faqAnswer}>
            O TPV e o KDS usam uma cópia do menu em cache. Pode continuar a
            registar vendas; os pedidos ficam em fila e são enviados quando a
            ligação voltar. Uma barra "Modo offline" indica esse estado.
          </p>
        </div>

        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Como altero o plano ou cancelo?</p>
          <p className={styles.faqAnswer}>
            Em <strong>Config → Faturação</strong> (ou <strong>Billing</strong>)
            pode gerir a subscrição e aceder ao portal do Stripe para alterar o
            plano ou cancelar.
          </p>
        </div>

        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>O trial terminou. O que fazer?</p>
          <p className={styles.faqAnswer}>
            Será mostrado um ecrã para escolher um plano e concluir o pagamento.
            Após ativar o plano, o acesso volta ao normal.
          </p>
        </div>
      </Card>
    </div>
  );
}
