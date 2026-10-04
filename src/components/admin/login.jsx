"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api-client";

export function AdminLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", data });
      router.refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="admin-card admin-login" onSubmit={submit}>
      <label htmlFor="admin-username">
        Identifiant
        <input
          id="admin-username"
          name="username"
          autoComplete="username"
          required
          maxLength={60}
        />
      </label>
      <label htmlFor="admin-password">
        Mot de passe
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <button className="button" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
