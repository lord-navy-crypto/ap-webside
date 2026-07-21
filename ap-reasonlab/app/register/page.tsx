"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Register failed");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-slate-600">
          Enter your name and a password to start using Results. Changing site content still
          requires admin or partner rights.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-3">
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <input
          type="password"
          className="input"
          placeholder="Password (min 4 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={4}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      <p className="text-sm text-slate-500">
        Already have an account? Use{" "}
        <Link href="/admin" className="text-brand-600 hover:underline">
          Manager login
        </Link>
        .
      </p>
    </div>
  );
}
