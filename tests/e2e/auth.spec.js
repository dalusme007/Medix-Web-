import { test, expect } from "@playwright/test";

// Tests de fumee sur le parcours d'authentification. Necessitent un
// vrai projet Supabase configure (.env.local) pour s'executer - voir
// README des tests pour les instructions completes.

test("la page de connexion affiche le formulaire", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("MEDIX")).toBeVisible();
  await expect(page.getByPlaceholder("vous@exemple.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
});

test("la page d'inscription affiche le formulaire complet", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByPlaceholder("vous@exemple.com")).toBeVisible();
  await expect(page.getByPlaceholder("8 caractères minimum")).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer mon compte" })).toBeVisible();
});

test("un utilisateur non connecte est redirige depuis le tableau de bord", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("les liens de navigation entre pages d'authentification fonctionnent", async ({ page }) => {
  await page.goto("/login");
  await page.getByText("S'inscrire").click();
  await expect(page).toHaveURL(/\/signup/);
});
