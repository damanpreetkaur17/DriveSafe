"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import GoogleButton from "@/components/GoogleButton";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // no backend yet — hand this off to your teammate
    console.log("register:", form);
  }

  return (
    <AuthLayout>
      <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-white/60">
        NEW USER
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#E8EDF2]">
        Create your account
      </h2>
      <p className="mt-2 text-sm text-[#8A94A6]">
        Already monitoring with us?{" "}
        <Link href="/login" className="font-medium text-white hover:underline">
          Sign in
        </Link>
      </p>

      <div className="mt-8">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#1C232E]" />
        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-[#5B6472]">
          OR
        </span>
        <span className="h-px flex-1 bg-[#1C232E]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-medium tracking-wide text-[#8A94A6]">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your full name"
            className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-sm text-[#E8EDF2] placeholder:text-[#4A5361] outline-none transition-colors focus:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          />
        </div>

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
          <label htmlFor="password" className="mb-2 block text-xs font-medium tracking-wide text-[#8A94A6]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password"
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
          <p className="mt-2 text-xs text-[#5B6472]">Use at least 8 characters.</p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#05070A] transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Create account
        </button>
      </form>

      <p className="mt-8 text-center text-xs leading-relaxed text-[#5B6472]">
        By creating an account, you agree to DriveSafe&apos;s{" "}
        <Link href="/terms" className="text-[#8A94A6] hover:text-[#E8EDF2]">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[#8A94A6] hover:text-[#E8EDF2]">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}