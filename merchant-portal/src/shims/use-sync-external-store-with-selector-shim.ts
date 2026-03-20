/**
 * Shim for use-sync-external-store/with-selector using React 19's native API.
 */
import { useSyncExternalStore } from "react";
import { useRef, useCallback } from "react";

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: (() => Snapshot) | undefined,
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  const prevRef = useRef<Selection | undefined>(undefined);
  const hasValue = useRef(false);

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const getSelection = useCallback(() => {
    const nextSnapshot = getSnapshot();
    const nextSelection = selectorRef.current(nextSnapshot);

    if (hasValue.current && isEqualRef.current) {
      if (isEqualRef.current(prevRef.current as Selection, nextSelection)) {
        return prevRef.current as Selection;
      }
    }

    hasValue.current = true;
    prevRef.current = nextSelection;
    return nextSelection;
  }, [getSnapshot]);

  return useSyncExternalStore(subscribe, getSelection, getServerSnapshot ? () => {
    const snapshot = getServerSnapshot();
    return selectorRef.current(snapshot);
  } : undefined);
}
