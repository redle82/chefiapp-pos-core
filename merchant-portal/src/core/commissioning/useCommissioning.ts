import { useState, useCallback, useRef } from "react";
import { CommissioningEngine } from "./CommissioningEngine";
import type { CommissioningResult, CommissioningTestId } from "./commissioningTypes";

export function useCommissioning() {
  const engineRef = useRef<CommissioningEngine | null>(null);
  const [result, setResult] = useState<CommissioningResult | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new CommissioningEngine((r) => setResult({ ...r }));
    }
    return engineRef.current;
  }, []);

  const registerRunner = useCallback(
    (testId: CommissioningTestId, runner: () => Promise<{ passed: boolean; error?: string }>) => {
      getEngine().registerRunner(testId, runner);
    },
    [getEngine]
  );

  const runAll = useCallback(async () => {
    const engine = getEngine();
    const finalResult = await engine.runAll();
    setResult({ ...finalResult });
    return finalResult;
  }, [getEngine]);

  const runSingle = useCallback(
    async (testId: CommissioningTestId) => {
      const engine = getEngine();
      const test = await engine.runSingle(testId);
      setResult({ ...engine.getResult() });
      return test;
    },
    [getEngine]
  );

  const reset = useCallback(() => {
    getEngine().reset();
  }, [getEngine]);

  return {
    result,
    registerRunner,
    runAll,
    runSingle,
    reset,
    isPassing: result?.overallStatus === "passed",
    isRunning: result?.overallStatus === "running",
  };
}
