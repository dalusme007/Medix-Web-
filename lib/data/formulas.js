function interpretRange(value, ranges) {
  for (const r of ranges) { if (r.max === undefined || value <= r.max) return r; }
  return ranges[ranges.length - 1];
}

export const FORMULAS = [
  { id: "imc", name: "IMC (indice de masse corporelle)", category: "Général", description: "Estimation de la corpulence.", reference: "OMS",
    inputs: [{ key: "poids", label: "Poids", unit: "kg", type: "number" }, { key: "taille", label: "Taille", unit: "cm", type: "number" }],
    compute: v => { const t = v.taille / 100; const imc = v.poids / (t * t);
      const r = interpretRange(imc, [{ max: 18.5, label: "Maigreur", color: "#4FC3F7" }, { max: 24.9, label: "Corpulence normale", color: "#4FA876" }, { max: 29.9, label: "Surpoids", color: "#E8C34F" }, { label: "Obésité", color: "#E8664F" }]);
      return { value: imc, unit: "kg/m²", interpretation: r.label, color: r.color }; } },
  { id: "bsa", name: "Surface corporelle (Mosteller)", category: "Général", description: "Surface corporelle pour ajustement posologique.", reference: "Mosteller RD, 1987",
    inputs: [{ key: "poids", label: "Poids", unit: "kg", type: "number" }, { key: "taille", label: "Taille", unit: "cm", type: "number" }],
    compute: v => ({ value: Math.sqrt((v.taille * v.poids) / 3600), unit: "m²", interpretation: "Adulte moyen : environ 1,7 m²", color: "#4FC3F7" }) },
  { id: "poids_ideal", name: "Poids idéal (formule de Devine)", category: "Général", description: "Estimation du poids idéal théorique.", reference: "Devine BJ, 1974",
    inputs: [{ key: "taille", label: "Taille", unit: "cm", type: "number" }, { key: "sexe", label: "Sexe", type: "select", options: [{ label: "Homme", value: "H" }, { label: "Femme", value: "F" }] }],
    compute: v => { const base = v.sexe === "F" ? 45.5 : 50; return { value: base + 0.9 * (v.taille - 152), unit: "kg", interpretation: "Estimation valable pour taille > 150 cm", color: "#4FC3F7" }; } },
  { id: "cockcroft", name: "Clairance de la créatinine (Cockcroft-Gault)", category: "Rénal", description: "Estimation de la fonction rénale.", reference: "Cockcroft & Gault, 1976",
    inputs: [{ key: "age", label: "Âge", unit: "ans", type: "number" }, { key: "poids", label: "Poids", unit: "kg", type: "number" }, { key: "creat", label: "Créatininémie", unit: "µmol/L", type: "number" }, { key: "sexe", label: "Sexe", type: "select", options: [{ label: "Homme", value: "H" }, { label: "Femme", value: "F" }] }],
    compute: v => { const creatMgDl = v.creat / 88.4; let clcr = ((140 - v.age) * v.poids) / (72 * creatMgDl); if (v.sexe === "F") clcr *= 0.85;
      const r = interpretRange(clcr, [{ max: 15, label: "Insuffisance rénale terminale", color: "#E8664F" }, { max: 29, label: "Insuffisance rénale sévère", color: "#E8664F" }, { max: 59, label: "Insuffisance rénale modérée", color: "#E8C34F" }, { max: 89, label: "Insuffisance rénale légère", color: "#E8C34F" }, { label: "Fonction rénale normale", color: "#4FA876" }]);
      return { value: clcr, unit: "mL/min", interpretation: r.label, color: r.color }; } },
  { id: "ckdepi", name: "DFG estimé (CKD-EPI 2021)", category: "Rénal", description: "Estimation du débit de filtration glomérulaire.", reference: "CKD-EPI 2021",
    inputs: [{ key: "age", label: "Âge", unit: "ans", type: "number" }, { key: "creat", label: "Créatininémie", unit: "µmol/L", type: "number" }, { key: "sexe", label: "Sexe", type: "select", options: [{ label: "Homme", value: "H" }, { label: "Femme", value: "F" }] }],
    compute: v => { const scr = v.creat / 88.4; let dfg;
      if (v.sexe === "F") { const k = 0.7, a = scr <= k ? -0.241 : -1.2; dfg = 142 * Math.pow(scr / k, a) * Math.pow(0.9938, v.age) * 1.012; }
      else { const k = 0.9, a = scr <= k ? -0.302 : -1.2; dfg = 142 * Math.pow(scr / k, a) * Math.pow(0.9938, v.age); }
      const r = interpretRange(dfg, [{ max: 15, label: "Stade 5", color: "#E8664F" }, { max: 29, label: "Stade 4", color: "#E8664F" }, { max: 59, label: "Stade 3", color: "#E8C34F" }, { max: 89, label: "Stade 2", color: "#E8C34F" }, { label: "Stade 1 — normal", color: "#4FA876" }]);
      return { value: dfg, unit: "mL/min/1,73m²", interpretation: r.label, color: r.color }; } },
  { id: "fena", name: "Fraction excrétée du sodium (FeNa)", category: "Rénal", description: "Distingue IRA fonctionnelle et nécrose tubulaire.", reference: "Espinel CH, 1976",
    inputs: [{ key: "naU", label: "Sodium urinaire", unit: "mmol/L", type: "number" }, { key: "creatP", label: "Créatinine plasmatique", unit: "µmol/L", type: "number" }, { key: "naP", label: "Sodium plasmatique", unit: "mmol/L", type: "number" }, { key: "creatU", label: "Créatinine urinaire", unit: "µmol/L", type: "number" }],
    compute: v => { const fena = ((v.naU * v.creatP) / (v.naP * v.creatU)) * 100;
      const r = interpretRange(fena, [{ max: 1, label: "Cause fonctionnelle (pré-rénale)", color: "#4FC3F7" }, { label: "Nécrose tubulaire aiguë", color: "#E8664F" }]);
      return { value: fena, unit: "%", interpretation: r.label, color: r.color }; } },
  { id: "na_corrige", name: "Sodium corrigé (hyperglycémie)", category: "Métabolique", description: "Corrige la natrémie pour l'effet dilutionnel.", reference: "Katz MA, 1973",
    inputs: [{ key: "na", label: "Sodium mesuré", unit: "mmol/L", type: "number" }, { key: "glycemie", label: "Glycémie", unit: "g/L", type: "number" }],
    compute: v => { const glc = v.glycemie * 100; return { value: v.na + 1.6 * ((glc - 100) / 100), unit: "mmol/L", interpretation: "Comparer à la natrémie mesurée", color: "#4FC3F7" }; } },
  { id: "trou_anionique", name: "Trou anionique", category: "Métabolique", description: "Oriente le diagnostic d'acidose métabolique.", reference: "Emmett & Narins, 1977",
    inputs: [{ key: "na", label: "Sodium", unit: "mmol/L", type: "number" }, { key: "cl", label: "Chlore", unit: "mmol/L", type: "number" }, { key: "hco3", label: "Bicarbonates", unit: "mmol/L", type: "number" }],
    compute: v => { const ta = v.na - (v.cl + v.hco3);
      const r = interpretRange(ta, [{ max: 7, label: "Trou anionique bas", color: "#4FC3F7" }, { max: 16, label: "Trou anionique normal", color: "#4FA876" }, { label: "Trou anionique augmenté", color: "#E8664F" }]);
      return { value: ta, unit: "mmol/L", interpretation: r.label, color: r.color }; } },
  { id: "calcemie_corrigee", name: "Calcémie corrigée", category: "Métabolique", description: "Corrige la calcémie pour l'albuminémie.", reference: "Payne RB, 1973",
    inputs: [{ key: "ca", label: "Calcémie mesurée", unit: "mmol/L", type: "number" }, { key: "albumine", label: "Albuminémie", unit: "g/L", type: "number" }],
    compute: v => { const caCorr = v.ca + 0.025 * (40 - v.albumine);
      const r = interpretRange(caCorr, [{ max: 2.19, label: "Hypocalcémie", color: "#E8664F" }, { max: 2.59, label: "Calcémie normale", color: "#4FA876" }, { label: "Hypercalcémie", color: "#E8664F" }]);
      return { value: caCorr, unit: "mmol/L", interpretation: r.label, color: r.color }; } },
  { id: "osmolarite", name: "Osmolarité plasmatique calculée", category: "Métabolique", description: "Estime l'osmolarité plasmatique.", reference: "CEN néphrologie",
    inputs: [{ key: "na", label: "Sodium", unit: "mmol/L", type: "number" }, { key: "glycemie", label: "Glycémie", unit: "mmol/L", type: "number" }, { key: "uree", label: "Urée", unit: "mmol/L", type: "number" }],
    compute: v => { const posm = 2 * v.na + v.glycemie + v.uree;
      const r = interpretRange(posm, [{ max: 274, label: "Hypo-osmolarité", color: "#4FC3F7" }, { max: 295, label: "Normale", color: "#4FA876" }, { label: "Hyperosmolarité", color: "#E8664F" }]);
      return { value: posm, unit: "mOsm/kg", interpretation: r.label, color: r.color }; } },
  { id: "qtc", name: "QT corrigé (Bazett)", category: "Cardiovasculaire", description: "Corrige l'intervalle QT pour la FC.", reference: "Bazett HC, 1920",
    inputs: [{ key: "qt", label: "QT mesuré", unit: "ms", type: "number" }, { key: "fc", label: "Fréquence cardiaque", unit: "bpm", type: "number" }],
    compute: v => { const rr = 60 / v.fc; const qtc = v.qt / Math.sqrt(rr);
      const r = interpretRange(qtc, [{ max: 440, label: "QTc normal", color: "#4FA876" }, { max: 460, label: "Limite supérieure", color: "#E8C34F" }, { label: "QTc allongé", color: "#E8664F" }]);
      return { value: qtc, unit: "ms", interpretation: r.label, color: r.color }; } },
  { id: "pam", name: "Pression artérielle moyenne", category: "Cardiovasculaire", description: "Pression de perfusion moyenne des organes.", reference: "CEN cardiologie",
    inputs: [{ key: "pas", label: "PAS", unit: "mmHg", type: "number" }, { key: "pad", label: "PAD", unit: "mmHg", type: "number" }],
    compute: v => { const pam = v.pad + (v.pas - v.pad) / 3;
      const r = interpretRange(pam, [{ max: 64, label: "PAM basse", color: "#E8664F" }, { max: 100, label: "PAM normale", color: "#4FA876" }, { label: "PAM élevée", color: "#E8C34F" }]);
      return { value: pam, unit: "mmHg", interpretation: r.label, color: r.color }; } },
  { id: "choc_index", name: "Index de choc", category: "Cardiovasculaire", description: "Repère précoce d'instabilité hémodynamique.", reference: "Allgöwer & Burri, 1967",
    inputs: [{ key: "fc", label: "Fréquence cardiaque", unit: "bpm", type: "number" }, { key: "pas", label: "PAS", unit: "mmHg", type: "number" }],
    compute: v => { const idx = v.fc / v.pas;
      const r = interpretRange(idx, [{ max: 0.7, label: "Index normal", color: "#4FA876" }, { max: 0.9, label: "Surveillance recommandée", color: "#E8C34F" }, { label: "Évocateur de choc débutant", color: "#E8664F" }]);
      return { value: idx, unit: "", interpretation: r.label, color: r.color }; } },
  { id: "pao2_fio2", name: "Rapport PaO2/FiO2 (Kirby)", category: "Respiratoire", description: "Sévérité d'une hypoxémie (SDRA).", reference: "Berlin Definition, 2012",
    inputs: [{ key: "pao2", label: "PaO2", unit: "mmHg", type: "number" }, { key: "fio2", label: "FiO2", unit: "%", type: "number" }],
    compute: v => { const ratio = v.pao2 / (v.fio2 / 100);
      const r = interpretRange(ratio, [{ max: 100, label: "SDRA sévère", color: "#E8664F" }, { max: 200, label: "SDRA modéré", color: "#E8664F" }, { max: 300, label: "SDRA léger", color: "#E8C34F" }, { label: "Normal", color: "#4FA876" }]);
      return { value: ratio, unit: "", interpretation: r.label, color: r.color }; } },
  { id: "wells_ep", name: "Score de Wells (embolie pulmonaire)", category: "Respiratoire", description: "Probabilité clinique d'EP.", reference: "Wells PS, 2000",
    inputs: [
      { key: "signes_tvp", label: "Signes cliniques de TVP", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+3)", value: 3 }] },
      { key: "diag_alternatif", label: "EP plus probable qu'un diagnostic alternatif", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+3)", value: 3 }] },
      { key: "fc_elevee", label: "FC > 100/min", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1,5)", value: 1.5 }] },
      { key: "immobilisation", label: "Immobilisation/chirurgie récente", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1,5)", value: 1.5 }] },
      { key: "antecedent", label: "Antécédent TVP/EP", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1,5)", value: 1.5 }] },
      { key: "hemoptysie", label: "Hémoptysie", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
      { key: "cancer", label: "Cancer actif", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
    ],
    compute: v => { const total = Object.values(v).reduce((a, b) => a + Number(b), 0);
      const r = interpretRange(total, [{ max: 1, label: "Probabilité faible", color: "#4FA876" }, { max: 6, label: "Probabilité intermédiaire", color: "#E8C34F" }, { label: "Probabilité élevée", color: "#E8664F" }]);
      return { value: total, unit: "points", interpretation: r.label, color: r.color }; } },
  { id: "cha2ds2vasc", name: "Score CHA2DS2-VASc", category: "Cardiovasculaire", description: "Risque thromboembolique en FA.", reference: "Lip GYH, 2010",
    inputs: [
      { key: "ic", label: "Insuffisance cardiaque", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
      { key: "hta", label: "HTA", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
      { key: "age", label: "Âge", type: "select", options: [{ label: "< 65 ans", value: 0 }, { label: "65-74 ans (+1)", value: 1 }, { label: "≥ 75 ans (+2)", value: 2 }] },
      { key: "diabete", label: "Diabète", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
      { key: "avc", label: "AVC/AIT antérieur", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+2)", value: 2 }] },
      { key: "vasculaire", label: "Maladie vasculaire", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
      { key: "sexe", label: "Sexe féminin", type: "select", options: [{ label: "Non", value: 0 }, { label: "Oui (+1)", value: 1 }] },
    ],
    compute: v => { const total = Object.values(v).reduce((a, b) => a + Number(b), 0);
      const r = interpretRange(total, [{ max: 0, label: "Risque faible", color: "#4FA876" }, { max: 1, label: "Risque faible à modéré", color: "#E8C34F" }, { label: "Risque élevé", color: "#E8664F" }]);
      return { value: total, unit: "points", interpretation: r.label, color: r.color }; } },
  { id: "apgar", name: "Score d'Apgar", category: "Pédiatrie / Néonatologie", description: "État clinique du nouveau-né.", reference: "Apgar V, 1953",
    inputs: [
      { key: "fc", label: "Fréquence cardiaque", type: "select", options: [{ label: "Absente (0)", value: 0 }, { label: "< 100/min (1)", value: 1 }, { label: "≥ 100/min (2)", value: 2 }] },
      { key: "respiration", label: "Respiration", type: "select", options: [{ label: "Absente (0)", value: 0 }, { label: "Lente (1)", value: 1 }, { label: "Vigoureuse (2)", value: 2 }] },
      { key: "tonus", label: "Tonus", type: "select", options: [{ label: "Flasque (0)", value: 0 }, { label: "Flexion (1)", value: 1 }, { label: "Actif (2)", value: 2 }] },
      { key: "reactivite", label: "Réactivité", type: "select", options: [{ label: "Nulle (0)", value: 0 }, { label: "Grimace (1)", value: 1 }, { label: "Cri (2)", value: 2 }] },
      { key: "coloration", label: "Coloration", type: "select", options: [{ label: "Cyanose globale (0)", value: 0 }, { label: "Cyanose extrémités (1)", value: 1 }, { label: "Rose (2)", value: 2 }] },
    ],
    compute: v => { const total = Object.values(v).reduce((a, b) => a + Number(b), 0);
      const r = interpretRange(total, [{ max: 3, label: "Sévèrement bas", color: "#E8664F" }, { max: 6, label: "Modérément bas", color: "#E8C34F" }, { label: "Normal", color: "#4FA876" }]);
      return { value: total, unit: "/10", interpretation: r.label, color: r.color }; } },
  { id: "glasgow", name: "Score de Glasgow (GCS)", category: "Neurologie", description: "Niveau de conscience.", reference: "Teasdale & Jennett, 1974",
    inputs: [
      { key: "yeux", label: "Ouverture des yeux", type: "select", options: [{ label: "Absente (1)", value: 1 }, { label: "Douleur (2)", value: 2 }, { label: "Demande (3)", value: 3 }, { label: "Spontanée (4)", value: 4 }] },
      { key: "verbal", label: "Réponse verbale", type: "select", options: [{ label: "Absente (1)", value: 1 }, { label: "Incompréhensible (2)", value: 2 }, { label: "Inappropriée (3)", value: 3 }, { label: "Confuse (4)", value: 4 }, { label: "Normale (5)", value: 5 }] },
      { key: "motrice", label: "Réponse motrice", type: "select", options: [{ label: "Absente (1)", value: 1 }, { label: "Extension (2)", value: 2 }, { label: "Flexion anormale (3)", value: 3 }, { label: "Évitement (4)", value: 4 }, { label: "Orientée (5)", value: 5 }, { label: "Sur ordre (6)", value: 6 }] },
    ],
    compute: v => { const total = Object.values(v).reduce((a, b) => a + Number(b), 0);
      const r = interpretRange(total, [{ max: 8, label: "Coma sévère", color: "#E8664F" }, { max: 12, label: "Atteinte modérée", color: "#E8C34F" }, { label: "Légère/normale", color: "#4FA876" }]);
      return { value: total, unit: "/15", interpretation: r.label, color: r.color }; } },
  { id: "dose_pediatrique", name: "Dose pédiatrique (règle de Clark)", category: "Pédiatrie / Néonatologie", description: "Estimation rapide de dose pédiatrique.", reference: "Règle de Clark (approximation)",
    inputs: [{ key: "dose_adulte", label: "Dose adulte", unit: "mg", type: "number" }, { key: "poids_enfant", label: "Poids de l'enfant", unit: "kg", type: "number" }],
    compute: v => ({ value: (v.poids_enfant / 70) * v.dose_adulte, unit: "mg", interpretation: "Estimation grossière — vérifier avec les référentiels pédiatriques", color: "#E8C34F" }) },
  { id: "debit_perfusion", name: "Débit de perfusion", category: "Pratique / Réanimation", description: "Débit en gouttes/min.", reference: "Pratique infirmière standard",
    inputs: [{ key: "volume", label: "Volume à perfuser", unit: "mL", type: "number" }, { key: "duree", label: "Durée", unit: "heures", type: "number" }, { key: "facteur", label: "Facteur de gouttes", type: "select", options: [{ label: "Macrogouttes (20/mL)", value: 20 }, { label: "Microgouttes (60/mL)", value: 60 }] }],
    compute: v => ({ value: (v.volume * v.facteur) / (v.duree * 60), unit: "gouttes/min", interpretation: "Arrondir au chiffre entier le plus proche", color: "#4FC3F7" }) },
];

export const CALC_CATEGORIES = ["Toutes", ...Array.from(new Set(FORMULAS.map(f => f.category)))];

export function searchFormulas(query, category) {
  let list = FORMULAS;
  if (category && category !== "Toutes") list = list.filter(f => f.category === category);
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(f => (f.name + " " + f.description + " " + f.category).toLowerCase().includes(q));
}
