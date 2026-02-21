/**
 * RunbookCorePage — Instruções para subir e verificar o Core local (Docker).
 * Ligado ao estado CORE_OFFLINE no TPV e no Dashboard (cartão Operação).
 */
// @ts-nocheck


import { Link } from "react-router-dom";
import styles from "./RunbookCorePage.module.css";

export function RunbookCorePage() {
  return (
    <div className={styles.pageRoot}>
      <h1 className={styles.heading}>Runbook — Core local (Docker)</h1>
      <p className={styles.subtitle}>
        Como subir o Docker Core, verificar saúde e confirmar restaurante e
        menu.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Subir o Docker Core</h2>
        <pre className={styles.codeBlock}>
          {`cd docker-core
docker compose -f docker-compose.core.yml up -d`}
        </pre>
        <p className={styles.hint}>
          Serviços: Postgres (54320), PostgREST (3001), Realtime (4000).
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Verificar saúde (PostgREST)</h2>
        <pre className={styles.codeBlock}>
          {`curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
# Esperado: 200 ou 404`}
        </pre>
        <p className={styles.hint}>
          Ou abrir no browser: <code>http://localhost:3001/</code> — deve
          responder (não 502 / connection refused).
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Confirmar restaurante e menu</h2>
        <p className={styles.hint}>
          O menu está publicado quando o restaurante está <em>active</em> e tem
          produtos em <code>gm_products</code>. O caixa deve estar aberto para
          operar no TPV (botão &quot;Abrir Turno&quot; no TPV).
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          4. Reset completo (volume limpo)
        </h2>
        <pre className={styles.codeBlock}>
          {`cd docker-core
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d`}
        </pre>
        <p className={styles.hint}>
          Os scripts de init só correm na primeira criação do volume.
        </p>
      </section>

      <p className={styles.footer}>
        Documento completo: <code>docs/ops/RUNBOOK_CORE_LOCAL.md</code>. Setup
        ENTERPRISE: <code>docs/strategy/ENTERPRISE_LOCAL_SETUP.md</code>.
      </p>

      <div className={styles.navLinks}>
        <Link to="/op/tpv" className={styles.link}>
          Voltar ao TPV
        </Link>
        {" · "}
        <Link to="/dashboard" className={styles.link}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
