"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-5 pt-5 sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Main Navbar */}
        <div className="relative flex items-center justify-between rounded-full border border-white/10 bg-[#05070B]/70 px-5 py-3.5 backdrop-blur-xl sm:px-7">

          {/* Subtle inner highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.03]" />

          {/* Logo */}
          <a
            href="/"
            className="group relative z-10 flex items-center gap-3"
          >
            {/* Logo Mark */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/10">
              <div className="h-2 w-2 rounded-full bg-white transition-transform duration-300 group-hover:scale-125" />
            </div>

            {/* Logo Text */}
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-[0.18em] text-white">
                DRIVESAFE
              </span>

              <span className="mt-1 hidden text-[8px] tracking-[0.2em] text-white/35 sm:block">
                AI DRIVER MONITORING
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="relative z-10 hidden items-center gap-8 lg:flex">

            <NavLink href="#features">
              Features
            </NavLink>

            <NavLink href="#how-it-works">
              How It Works
            </NavLink>

            <NavLink href="#benefits">
              Benefits
            </NavLink>

          </div>

          {/* Desktop CTA */}
          <div className="relative z-10 hidden lg:block">
            <a
              href="#demo"
              className="group flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#05070B] transition-all duration-300 hover:bg-white/90"
            >
              Login

              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#05070B]/10 transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mt-2 rounded-3xl border border-white/10 bg-[#080a0f]/95 p-5 backdrop-blur-xl lg:hidden">

            <div className="flex flex-col">

              <MobileNavLink
                href="#features"
                onClick={() => setMenuOpen(false)}
              >
                Features
              </MobileNavLink>

              <MobileNavLink
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
              >
                How It Works
              </MobileNavLink>

              <MobileNavLink
                href="#benefits"
                onClick={() => setMenuOpen(false)}
              >
                Benefits
              </MobileNavLink>

              <a
                href="#demo"
                onClick={() => setMenuOpen(false)}
                className="mt-4 rounded-full bg-white px-5 py-3 text-center text-sm font-medium text-[#05070B]"
              >
                Try Demo
              </a>

            </div>
          </div>
        )}

      </div>
    </nav>
  );
}


/* -------------------------------- */
/* Desktop Navigation Link           */
/* -------------------------------- */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="relative py-2 text-sm text-white/55 transition-colors duration-300 hover:text-white"
    >
      {children}

      {/* Hover underline */}
      <span className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-white transition-all duration-300 group-hover:w-full" />
    </a>
  );
}


/* -------------------------------- */
/* Mobile Navigation Link            */
/* -------------------------------- */

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="border-b border-white/5 py-4 text-sm text-white/65 transition hover:text-white"
    >
      {children}
    </a>
  );
}