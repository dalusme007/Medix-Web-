"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import { updatePassword } from "@/lib/services/authService";

// Cette page est ouverte via le lien recu par email (session temporaire
// deja etablie par Supabase a partir du token present dans l'URL).
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      router.push("/dashboard");
    } catch (err) {
      setError("Le lien a peut-etre expire. Demandez-en un nouveau.");
    }
    setLoading(false);
  }

  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisissez un mot de passe securise">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nouveau mot de passe" type="password" value={password} onChange={setPassword} placeholder="8 caracteres minimum" required />
        <FormField label="Confirmer" type="password" value={confirm} onChange={setConfirm} required />
        {error && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
        </button>
      </form>
    </AuthCard>
  );
    }
    
