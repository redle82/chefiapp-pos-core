import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Import Global Styles from the Monolith
import "../../../merchant-portal/src/index.css";

// Import the KDS Logic directly
import KDSStandalone from "../../../merchant-portal/src/pages/TPV/KDS/KDSStandalone";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/kds/:restaurantId" element={<KDSStandalone />} />
        {/* Fallback for convenience/testing without ID in URL (though KDSStandalone demands it) */}
        <Route
          path="/"
          element={
            <div className="p-10 text-xl font-bold text-red-500">
              KDS Waiting for Signal... (Use /kds/[ID])
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
