"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import { signUp } from "@/lib/services/authService";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      await signUp({ email, password });
      setDone(true);
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <AuthCard title="Verifiez votre boite mail" subtitle="Un lien de confirmation vous a ete envoye.">
        <p className="text-xs text-center" style={{ color: "#B9C4E0" }}>
          Cliquez sur le lien recu par email pour activer votre compte, puis connectez-vous.
        </p>
        <button onClick={() => router.push("/login")} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D" }}>
          Aller a la connexion
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Creer votre compte" subtitle="Votre academie medicale virtuelle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" required />
        <FormField label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="8 caracteres minimum" required />
        <FormField label="Confirmer le mot de passe" type="password" value={confirm} onChange={setConfirm} required />
        {error && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Creation..." : "Creer mon compte"}
        </button>
      </form>
      <div className="text-center text-xs" style={{ color: "#8393B5" }}>
        Deja inscrit ? <a href="/login" className="underline" style={{ color: "#4FC3F7" }}>Se connecter</a>
      </div>
    </AuthCard>
  );
}
