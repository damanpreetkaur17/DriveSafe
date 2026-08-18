import Link from "next/link";
import { ReactNode } from "react";
import { spaceGrotesk, inter, jetbrainsMono } from "@/lib/fonts";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} flex min-h-screen w-full items-center justify-center bg-[#05070A] px-6 py-12 font-[family-name:var(--font-body)] text-[#E8EDF2]`}
    >
      <div className="w-full max-w-md">
        {/* brand mark */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.4)]" />
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.2em] text-[#E8EDF2]">
            DRIVESAFE
          </span>
        </Link>

        {/* card */}
        <div className="rounded-2xl border border-[#1C232E] bg-[#0D1117] px-8 py-10 shadow-[0_0_60px_-15px_rgba(255,255,255,0.05)]">
          {children}
        </div>
      </div>
    </div>
  );
}