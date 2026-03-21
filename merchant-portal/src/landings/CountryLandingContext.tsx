/**
 * CountryLandingContext — Fornece country + segment para componentes da landing por país.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getCountryConfig, isValidCountryCode, type CountryConfig, type CountryCode } from "./countries";
import { getSegmentCopy, type Segment } from "./countryCopy";

type CountryLandingValue = {
  country: CountryConfig;
  countryCode: CountryCode;
  segment: Segment;
  setSegment: (s: Segment) => void;
  segmentCopy: ReturnType<typeof getSegmentCopy>;
};

const CountryLandingContext = createContext<CountryLandingValue | null>(null);

const DEFAULT_COUNTRY: CountryCode = "gb";
const VALID_SEGMENTS = ["small", "multi", "enterprise"] as const;

function parseSegment(s: string | null): Segment {
  if (s && VALID_SEGMENTS.includes(s as Segment)) return s as Segment;
  return "small";
}

export function CountryLandingProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const countryCode: CountryCode = useMemo(() => {
    const seg = pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (isValidCountryCode(seg)) return seg as CountryCode;
    return DEFAULT_COUNTRY;
  }, [pathname]);

  const country = useMemo(
    () => getCountryConfig(countryCode) ?? getCountryConfig(DEFAULT_COUNTRY)!,
    [countryCode]
  );

  const segment = useMemo(
    () => parseSegment(searchParams.get("segment")),
    [searchParams]
  );

  const setSegment = useCallback(
    (s: Segment) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("segment", s);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const segmentCopy = useMemo(
    () => getSegmentCopy(segment, country.locale),
    [segment, country.locale]
  );

  const value = useMemo<CountryLandingValue>(
    () => ({
      country,
      countryCode,
      segment,
      setSegment,
      segmentCopy,
    }),
    [country, countryCode, segment, setSegment, segmentCopy]
  );

  return (
    <CountryLandingContext.Provider value={value}>
      {children}
    </CountryLandingContext.Provider>
  );
}

export function useCountryLanding(): CountryLandingValue {
  const ctx = useContext(CountryLandingContext);
  if (!ctx) throw new Error("useCountryLanding must be used inside CountryLandingProvider");
  return ctx;
}
