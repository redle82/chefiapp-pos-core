// Core connection (PostgREST via fetch). No Supabase BaaS.
import { getDockerCoreFetchClient } from "../../core/infra/dockerCoreFetchClient";

/** Cliente canónico para o Docker Core (PostgREST fetch). */
export const dockerCoreClient = getDockerCoreFetchClient();

/**
 * Verifica se o Core está acessível.
 */
export async function checkDockerCoreHealth(): Promise<boolean> {
  try {
    const client = getDockerCoreFetchClient();
    const res = await client.from("gm_restaurants").select("id").limit(1);
    return !res.error;
  } catch {
    return false;
  }
}
