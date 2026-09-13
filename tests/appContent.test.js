import { it, expect } from "vitest";
import { pageContent } from "../src/appContent.js";
it("invites children to explore careers", () => {
  expect(pageContent.title).toBe("Berufe entdecken");
  expect(pageContent.description).toContain("60 Berufe");
  expect(pageContent.primaryAction).toBe("Eher diesen Beruf wählen");
});
