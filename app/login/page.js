"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import { signIn } from "@/lib/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    }
    setLoading(false);
  }

  return (
    <AuthCard title="Connexion" subtitle="Reprenez votre parcours vers l'excellence">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" required />
        <FormField label="Mot de passe" type="password" value={password} onChange={setPassword} required />
        {error && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="text-center text-xs space-y-2" style={{ color: "#8393B5" }}>
        <div><a href="/forgot-password" className="underline" style={{ color: "#4FC3F7" }}>Mot de passe oublie ?</a></div>
        <div>Pas encore de compte ? <a href="/signup" className="underline" style={{ color: "#4FC3F7" }}>S'inscrire</a></div>
      </div>
    </AuthCard>
  );
    }
    
