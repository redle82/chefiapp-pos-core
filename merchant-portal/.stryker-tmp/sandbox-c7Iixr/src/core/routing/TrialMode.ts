export function isTrialModeParam(searchParams: URLSearchParams): boolean {
  return searchParams.get("mode") === "trial";
}
