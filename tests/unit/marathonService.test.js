import { describe, it, expect } from "vitest";
import { getCurrentWeekKey, attemptsRemaining } from "@/lib/services/marathonService";

describe("getCurrentWeekKey", () => {
  it("retourne une date au format YYYY-MM-DD", () => {
    const key = getCurrentWeekKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("retourne toujours un dimanche", () => {
    const key = getCurrentWeekKey();
    const date = new Date(key + "T00:00:00");
    expect(date.getDay()).toBe(0); // 0 = dimanche
  });
});

describe("attemptsRemaining", () => {
  it("retourne 2 si la semaine stockee est differente de la semaine actuelle", () => {
    const progress = { marathon_week_key: "2000-01-01", marathon_attempts_this_week: 5 };
    expect(attemptsRemaining(progress)).toBe(2);
  });

  it("retourne le nombre correct de tentatives restantes pour la semaine en cours", () => {
    const progress = { marathon_week_key: getCurrentWeekKey(), marathon_attempts_this_week: 1 };
    expect(attemptsRemaining(progress)).toBe(1);
  });

  it("ne retourne jamais un nombre negatif", () => {
    const progress = { marathon_week_key: getCurrentWeekKey(), marathon_attempts_this_week: 10 };
    expect(attemptsRemaining(progress)).toBe(0);
  });
});
                             
