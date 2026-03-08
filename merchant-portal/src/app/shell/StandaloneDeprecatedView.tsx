import standaloneStyles from "../../AppStandaloneDeprecated.module.css";

function getCurrentWindowUrl() {
  if (typeof window === "undefined") return "";

  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function StandaloneDeprecatedView() {
  const currentUrl = getCurrentWindowUrl();

  return (
    <div className={standaloneStyles.page}>
      <div className={standaloneStyles.card}>
        <h1 className={standaloneStyles.title}>Modo app desativado</h1>
        <p className={standaloneStyles.description}>
          O AppStaff PWA foi descontinuado. Use o navegador normal para o portal
          web e o app nativo Expo para iOS/Android.
        </p>
        <div className={standaloneStyles.actions}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open(currentUrl, "_blank", "noopener,noreferrer");
              }
            }}
            className={standaloneStyles.primaryButton}
          >
            Abrir no navegador
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.close();
              }
            }}
            className={standaloneStyles.secondaryButton}
          >
            Fechar janela
          </button>
        </div>
        <p className={standaloneStyles.footerText}>
          Remova também o atalho instalado no Chrome para não voltar a abrir
          este modo standalone.
        </p>
      </div>
    </div>
  );
}
