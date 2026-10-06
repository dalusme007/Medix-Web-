import { describe, it, expect } from "vitest";
import { getGradeForXp, GRADES } from "@/lib/services/progressService";

describe("getGradeForXp", () => {
  it("retourne le grade le plus bas pour 0 XP", () => {
    const result = getGradeForXp(0);
    expect(result.grade.name).toBe("Externe I");
    expect(result.index).toBe(0);
  });

  it("retourne le bon grade pour un XP intermediaire", () => {
    const result = getGradeForXp(1500);
    // 1300 = Interne I, 2200 = Interne II -> doit rester Interne I
    expect(result.grade.name).toBe("Interne I");
  });

  it("retourne le grade maximal pour un XP tres eleve", () => {
    const result = getGradeForXp(9999999);
    expect(result.grade.name).toBe(GRADES[GRADES.length - 1].name);
    expect(result.next).toBeNull();
    expect(result.progressPct).toBe(100);
  });

  it("calcule correctement l'XP restant avant le grade suivant", () => {
    const result = getGradeForXp(300); // exactement Externe II
    expect(result.grade.name).toBe("Externe II");
    expect(result.next.name).toBe("Externe III");
    expect(result.xpToNext).toBe(700 - 300);
  });

  it("le pourcentage de progression est toujours entre 0 et 100", () => {
    for (const xp of [0, 500, 5000, 50000, 500000, 5000000]) {
      const result = getGradeForXp(xp);
      expect(result.progressPct).toBeGreaterThanOrEqual(0);
      expect(result.progressPct).toBeLessThanOrEqual(100);
    }
  });
});
     
