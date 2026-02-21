import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { OSCopy } from "../design-system/sovereign/OSCopy";
import styles from "./SovereignBoundary.module.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SovereignBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Sovereign Boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <h1 className={styles.title}>
            {OSCopy.errors?.generic || "Serviço Indisponível"}
          </h1>
          <p className={styles.message}>
            {OSCopy.errors?.actionFailed ||
              "O sistema de pedidos está temporariamente fora do ar."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
