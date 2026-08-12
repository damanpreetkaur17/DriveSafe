"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";

export default function CTA() {
  return (
    <section
      id="cta"
      className="
        relative
        overflow-hidden
        bg-[#05070B]
        px-6
        py-24
        lg:px-8
      "
    >
      {/* Top divider */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-px
          w-[70%]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-white/10
          to-transparent
        "
      />

      {/* Background glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[500px]
          w-[800px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-white/[0.025]
          blur-[120px]
        "
      />

      {/* Subtle grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.025]
          [background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_1px)]
          [background-size:70px_70px]
          [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]
        "
      />

      <div className="relative mx-auto max-w-5xl text-center">

        {/* Small label */}
        <div className="mb-7 flex justify-center">

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={15}
              strokeWidth={1.5}
              className="text-white/40"
            />

            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.25em]
                text-white/35
              "
            >
              Drive smarter. Stay safer.
            </span>

          </div>

        </div>


        {/* Main heading */}
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
          }}
          className="
            mx-auto
            max-w-4xl
            text-[42px]
            font-bold
            leading-[0.98]
            tracking-[-0.05em]
            text-white
            sm:text-[58px]
            lg:text-[72px]
          "
        >
          Your safety starts with

          <br />

          <span className="text-white/35">
            staying alert.
          </span>
        </h2>


        {/* Short description */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
          }}
          className="
            mx-auto
            mt-7
            max-w-lg
            text-[14px]
            leading-6
            text-white/40
            sm:text-[15px]
          "
        >
          See how AI-powered fatigue detection can make every
          journey safer.
        </p>


        {/* CTA */}
        <div className="mt-9 flex justify-center">

          <a
            href="#demo"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
            }}
            className="
              group
              flex
              items-center
              gap-3
              rounded-full
              bg-white
              px-7
              py-4
              text-[14px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-[#05070B]
              transition-all
              duration-300
              hover:scale-[1.03]
              hover:bg-white/90
            "
          >
            Try Demo

            <span
              className="
                flex
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                bg-[#05070B]/10
              "
            >
              <ArrowUpRight
                size={14}
                className="
                  transition-transform
                  duration-300
                  group-hover:translate-x-0.5
                  group-hover:-translate-y-0.5
                "
              />
            </span>

          </a>

        </div>


        {/* Bottom technical label */}
        <div className="mt-12">

          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              text-[8px]
              font-semibold
              tracking-[0.3em]
              text-white/15
            "
          >
            DRIVESAFE / AI DRIVER MONITORING SYSTEM
          </span>

        </div>

      </div>

    </section>
  );
}