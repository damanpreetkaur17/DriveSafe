"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import GoogleButton from "@/components/GoogleButton";

export default function LoginPage() {
  const router = useRouter();
  const { login, googleSignIn, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const profileCompleted = await login(form.email, form.password);
      router.push(profileCompleted ? "/dashboard" : "/dashboard/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin(credential: string) {
    setError("");
    setIsGoogleLoading(true);

    try {
      const profileCompleted = await googleSignIn("Google User", "", credential);
      router.push(profileCompleted ? "/dashboard" : "/dashboard/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-white/60">
        RETURNING USER
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#E8EDF2]">
        Sign in
      </h2>
      <p className="mt-2 text-sm text-[#8A94A6]">
        New to DriveSafe?{" "}
        <Link href="/register" className="font-medium text-white hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8">
        <GoogleButton label={isGoogleLoading ? "Connecting..." : "Continue with Google"} onSuccess={handleGoogleLogin} disabled={isGoogleLoading} />
      </div>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#1C232E]" />
        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-[#5B6472]">
          OR
        </span>
        <span className="h-px flex-1 bg-[#1C232E]" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-medium tracking-wide text-[#8A94A6]">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-sm text-[#E8EDF2] placeholder:text-[#4A5361] outline-none transition-colors focus:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-medium tracking-wide text-[#8A94A6]">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-white/70 hover:text-white hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 pr-12 text-sm text-[#E8EDF2] placeholder:text-[#4A5361] outline-none transition-colors focus:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium tracking-wide text-[#5B6472] hover:text-[#8A94A6]"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#05070A] transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}