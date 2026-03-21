/**
 * Smoke tests: rotas /br, /es, /gb, /us respondem e renderizam (gateway-first).
 * Ref: docs/commercial/GATEWAY_DEPLOYMENT_MATRIX.md
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { COUNTRY_ROUTES } from "./countries";
import { CountryLandingPage } from "./CountryLandingPage";

describe("Country landings smoke", () => {
  for (const country of COUNTRY_ROUTES) {
    it(`renders /${country} without crashing and shows ChefIApp brand`, () => {
      render(
        <MemoryRouter initialEntries={[`/${country}`]}>
          <CountryLandingPage />
        </MemoryRouter>,
      );
      expect(screen.getByText("ChefIApp")).toBeTruthy();
    });
  }
});
