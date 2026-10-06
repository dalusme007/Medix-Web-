import { test, expect } from "@playwright/test";

// Ce parcours necessite un compte de test deja cree et connecte.
// A adapter avec un vrai flux de connexion (voir README des tests)
// une fois Supabase configure ; ici, structure du test documentee.

test.skip("calcul de l'IMC produit un resultat coherent", async ({ page }) => {
  // 1. Se connecter avec un compte de test
  // 2. Naviguer vers /dashboard/calculators
  // 3. Cliquer sur "IMC (indice de masse corporelle)"
  // 4. Remplir poids=70, taille=175
  // 5. Verifier que le resultat affiche ~22.86 kg/m2 et "Corpulence normale"
  await page.goto("/dashboard/calculators");
  await page.getByText("IMC (indice de masse corporelle)").click();
  await page.getByPlaceholder("0").first().fill("70");
  await page.getByPlaceholder("0").nth(1).fill("175");
  await expect(page.getByText("Corpulence normale")).toBeVisible();
});
