import { describe, it, expect } from "vitest";
import { FORMULAS, searchFormulas } from "@/lib/data/formulas";

function getFormula(id) {
  const f = FORMULAS.find(f => f.id === id);
  if (!f) throw new Error(`Formule ${id} introuvable`);
  return f;
}

describe("IMC", () => {
  it("calcule correctement un IMC connu (70kg, 175cm -> ~22.86)", () => {
    const result = getFormula("imc").compute({ poids: 70, taille: 175 });
    expect(result.value).toBeCloseTo(22.857, 2);
    expect(result.interpretation).toBe("Corpulence normale");
  });

  it("classe correctement une obesite", () => {
    const result = getFormula("imc").compute({ poids: 110, taille: 170 });
    expect(result.interpretation).toBe("Obésité");
  });
});

describe("Cockcroft-Gault", () => {
  it("applique le coefficient 0.85 pour les femmes", () => {
    const base = { age: 60, poids: 70, creat: 88.4 }; // 88.4 umol/L = 1 mg/dL pile
    const homme = getFormula("cockcroft").compute({ ...base, sexe: "H" });
    const femme = getFormula("cockcroft").compute({ ...base, sexe: "F" });
    expect(femme.value).toBeCloseTo(homme.value * 0.85, 5);
  });

  it("retourne une clairance normale pour un patient jeune sans insuffisance renale", () => {
    const result = getFormula("cockcroft").compute({ age: 30, poids: 70, creat: 70.7, sexe: "H" });
    expect(result.value).toBeGreaterThan(89);
    expect(result.interpretation).toBe("Fonction rénale normale");
  });
});

describe("Trou anionique", () => {
  it("calcule correctement Na - (Cl + HCO3)", () => {
    const result = getFormula("trou_anionique").compute({ na: 140, cl: 104, hco3: 24 });
    expect(result.value).toBe(12);
    expect(result.interpretation).toBe("Trou anionique normal");
  });

  it("detecte un trou anionique augmente", () => {
    const result = getFormula("trou_anionique").compute({ na: 140, cl: 95, hco3: 15 });
    expect(result.value).toBe(30);
    expect(result.interpretation).toContain("augmenté");
  });
});

describe("Score de Glasgow", () => {
  it("le score maximal est 15 (conscience normale)", () => {
    const result = getFormula("glasgow").compute({ yeux: 4, verbal: 5, motrice: 6 });
    expect(result.value).toBe(15);
    expect(result.interpretation).toContain("normale");
  });

  it("le score minimal est 3 (coma severe)", () => {
    const result = getFormula("glasgow").compute({ yeux: 1, verbal: 1, motrice: 1 });
    expect(result.value).toBe(3);
    expect(result.interpretation).toBe("Coma sévère");
  });
});

describe("Score d'Apgar", () => {
  it("le score maximal est 10", () => {
    const result = getFormula("apgar").compute({ fc: 2, respiration: 2, tonus: 2, reactivite: 2, coloration: 2 });
    expect(result.value).toBe(10);
    expect(result.interpretation).toBe("Normal");
  });
});

describe("QTc (Bazett)", () => {
  it("calcule correctement le QTc pour une FC de 60 (RR=1s, donc QTc=QT)", () => {
    const result = getFormula("qtc").compute({ qt: 400, fc: 60 });
    expect(result.value).toBeCloseTo(400, 1);
  });
});

describe("searchFormulas", () => {
  it("retourne toutes les formules sans filtre", () => {
    expect(searchFormulas("", "Toutes").length).toBe(FORMULAS.length);
  });

  it("filtre correctement par categorie", () => {
    const results = searchFormulas("", "Rénal");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(f => f.category === "Rénal")).toBe(true);
  });

  it("la recherche textuelle est insensible a la casse", () => {
    const results = searchFormulas("IMC", "Toutes");
    expect(results.some(f => f.id === "imc")).toBe(true);
  });
});

describe("Integrite des donnees", () => {
  it("chaque formule a un id unique", () => {
    const ids = FORMULAS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque input de type select a au moins une option", () => {
    FORMULAS.forEach(f => {
      f.inputs.filter(i => i.type === "select").forEach(i => {
        expect(i.options.length).toBeGreaterThan(0);
      });
    });
  });
});
    
