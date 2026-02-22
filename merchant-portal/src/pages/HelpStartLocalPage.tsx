/**
 * Página "Como iniciar o servidor local?" — acessível quando Core está em baixo.
 * Mostra um único comando para dev/piloto; reduz medo e frustração do banner "Core indisponível".
 */

import { useNavigate } from "react-router-dom";
import { Button, Card } from "../ui/design-system";
import styles from "./HelpStartLocalPage.module.css";

export function HelpStartLocalPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.pageWrapper}>
      <Card className={styles.card} elevated>
        <h1 className={styles.title}>Como iniciar o servidor local?</h1>
        <p className={styles.text}>
          O backend (Docker Core) não está em execução. Para ter o sistema a
          funcionar em local:
        </p>
        <ol className={styles.list}>
          <li>
            Garante que o <strong>Docker</strong> está em execução (ex.: Docker
            Desktop aberto).
          </li>
          <li>
            Na <strong>raiz do repositório</strong>, corre:
          </li>
        </ol>
        <pre className={styles.codeBlock}>
          <code>./start-local.sh</code>
        </pre>
        <p className={styles.separator}>ou</p>
        <pre className={styles.codeBlock}>
          <code>npm run start:local</code>
        </pre>
        <p className={styles.text}>
          O script sobe o Docker Core e o Merchant-portal e abre o browser.
          Quando o servidor estiver pronto, volta a esta app e clica em
          &quot;Tentar novamente&quot; no banner.
        </p>
        <p className={styles.text}>
          Documentação completa:
          <span className={styles.docPath}>
            docs/implementation/FASE_5_COMO_INICIAR_1_MINUTO.md
          </span>
          .
        </p>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/")}
          >
            Voltar à landing
          </Button>
        </div>
      </Card>
    </div>
  );
}
