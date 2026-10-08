"use client";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import { requestPasswordReset } from "@/lib/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError("Une erreur est survenue. Verifiez l'adresse saisie.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <AuthCard title="Email envoye" subtitle="Verifiez votre boite mail">
        <p className="text-xs text-center" style={{ color: "#B9C4E0" }}>
          Si un compte existe avec cette adresse, un lien de reinitialisation vient de vous etre envoye.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Mot de passe oublie" subtitle="Recevez un lien de reinitialisation par email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" required />
        {error && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>
      <div className="text-center text-xs" style={{ color: "#8393B5" }}>
        <a href="/login" className="underline" style={{ color: "#4FC3F7" }}>Retour a la connexion</a>
      </div>
    </AuthCard>
  );
    }
    
