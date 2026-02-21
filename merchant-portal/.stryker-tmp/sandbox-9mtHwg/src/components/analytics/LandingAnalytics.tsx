/**
 * Analytics para a landing (GA4 / PostHog).
 * Só carrega quando as variáveis de ambiente estão definidas.
 * Ver docs/strategy/LANDING_CANON.md — a landing é LandingV2 no merchant-portal.
 */
import { useEffect } from "react";

const ga4Id = import.meta.env.VITE_GA4_ID as string | undefined;
const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const posthogHost =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://us.i.posthog.com";

function injectScript(
  id: string,
  src?: string,
  inline?: string,
): void {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  if (src) {
    script.src = src;
    script.async = true;
  }
  if (inline) script.textContent = inline;
  document.body.appendChild(script);
}

export function LandingAnalytics() {
  useEffect(() => {
    if (ga4Id) {
      injectScript(
        "ga4-js",
        `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`,
      );
      injectScript(
        "ga4-config",
        undefined,
        `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga4Id}');
        `,
      );
    }
    if (posthogKey) {
      injectScript(
        "posthog-snippet",
        undefined,
        `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${posthogKey}',{api_host:'${posthogHost}'});`,
      );
    }
  }, []);

  return null;
}
