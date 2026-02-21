// @ts-nocheck
type EnvLike = {
  DEV?: boolean;
  VITE_ALLOW_MOCK_AUTH?: string | boolean;
};

const isTruthyFlag = (value: EnvLike["VITE_ALLOW_MOCK_AUTH"]): boolean =>
  value === true || value === "true" || value === "1";

export const isMockAuthEnabled = (env: EnvLike): boolean =>
  env.DEV === true && isTruthyFlag(env.VITE_ALLOW_MOCK_AUTH);
