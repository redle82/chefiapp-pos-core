import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Import Global Styles from the Monolith
import "../../../merchant-portal/src/index.css";

// TPV Source Code (Now Repaired)
import TPV from "../../../merchant-portal/src/pages/TPV/TPV";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/tpv/:restaurantId?" element={<TPV />} />
        <Route path="/" element={<TPV />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
