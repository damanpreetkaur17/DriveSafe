"use client";

import {
  UserRound,
  Truck,
  BusFront,
  Luggage,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { useState } from "react";

const benefits = [
  {
    number: "01",
    title: "Drivers",
    category: "PERSONAL SAFETY",
    description:
      "Real-time fatigue detection helps drivers recognize drowsiness before it becomes a safety risk.",
    icon: UserRound,
    metric: "REAL-TIME",
  },
  {
    number: "02",
    title: "Fleet Operators",
    category: "FLEET SAFETY",
    description:
      "Give fleet managers better visibility into driver alertness and fatigue-related risks.",
    icon: Truck,
    metric: "MONITORING",
  },
  {
    number: "03",
    title: "Transport",
    category: "SAFER OPERATIONS",
    description:
      "Support safer commercial and public transportation with continuous AI-powered monitoring.",
    icon: BusFront,
    metric: "AI-POWERED",
  },
  {
    number: "04",
    title: "Travelers",
    category: "LONG JOURNEYS",
    description:
      "Reduce fatigue-related risks during long-distance journeys with intelligent alerts.",
    icon: Luggage,
    metric: "PROTECTION",
  },
];

export default function WhoBenefits() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="benefits"
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#05070B]
        px-6
        py-24
        lg:px-8
      "
    >
      {/* ====================================================== */}
      {/* TOP DIVIDER                                            */}
      {/* ====================================================== */}

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


      {/* ====================================================== */}
      {/* SUBTLE BACKGROUND                                      */}
      {/* ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-[-200px]
          top-[-200px]
          h-[500px]
          w-[500px]
          rounded-full
          bg-white/[0.015]
          blur-[120px]
        "
      />


      {/* ====================================================== */}
      {/* MAIN                                                   */}
      {/* ====================================================== */}

      <div className="relative mx-auto max-w-7xl">

        {/* ================================================== */}
        {/* HEADER                                             */}
        {/* ================================================== */}

        <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

          <div>

            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
              }}
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.45em]
                text-white/40
              "
            >
              Who Benefits
            </span>


            <h2
              style={{
                fontFamily: "'Orbitron', sans-serif",
              }}
              className="
                mt-4
                text-[38px]
                font-bold
                leading-none
                tracking-[-0.045em]
                text-white
                sm:text-[48px]
                lg:text-[54px]
              "
            >
              Built for
              <span className="text-white/35"> every journey.</span>
            </h2>

          </div>


          {/* Right header info */}

          <div className="flex items-center gap-3 sm:pb-1">

            <div className="relative flex h-2 w-2">

              <span
                className="
                  absolute
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-green-400
                  opacity-50
                "
              />

              <span className="relative h-2 w-2 rounded-full bg-green-400" />

            </div>

            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-white/30
              "
            >
              One system · multiple use cases
            </span>

          </div>

        </div>


        {/* ================================================== */}
        {/* AUDIENCE LIST                                      */}
        {/* ================================================== */}

        <div className="border-t border-white/10">

          {benefits.map((benefit, index) => {

            const Icon = benefit.icon;

            const isActive = active === index;

            return (
              <div
                key={benefit.number}
                onMouseEnter={() => setActive(index)}
                className={`
                  group
                  relative
                  border-b
                  border-white/10
                  transition-all
                  duration-500
                  ${
                    isActive
                      ? "bg-white/[0.035]"
                      : "bg-transparent"
                  }
                `}
              >

                {/* Active vertical indicator */}

                <div
                  className={`
                    absolute
                    left-0
                    top-0
                    h-full
                    w-px
                    transition-all
                    duration-500
                    ${
                      isActive
                        ? "bg-white/70"
                        : "bg-transparent"
                    }
                  `}
                />


                {/* Main row */}

                <div
                  className="
                    grid
                    min-h-[115px]
                    grid-cols-[55px_1fr]
                    items-center
                    gap-4
                    px-4
                    py-6
                    sm:grid-cols-[70px_230px_1fr_150px_45px]
                    sm:px-6
                    lg:min-h-[125px]
                    lg:px-8
                  "
                >

                  {/* ------------------------------------ */}
                  {/* NUMBER                                */}
                  {/* ------------------------------------ */}

                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                    }}
                    className={`
                      text-[10px]
                      font-bold
                      tracking-[0.15em]
                      transition-colors
                      duration-300
                      ${
                        isActive
                          ? "text-white/60"
                          : "text-white/20"
                      }
                    `}
                  >
                    {benefit.number}
                  </span>


                  {/* ------------------------------------ */}
                  {/* TITLE + ICON                          */}
                  {/* ------------------------------------ */}

                  <div className="flex items-center gap-4">

                    <div
                      className={`
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        transition-all
                        duration-500
                        ${
                          isActive
                            ? "border-white/20 bg-white/[0.07] text-white"
                            : "border-white/10 bg-white/[0.02] text-white/35"
                        }
                      `}
                    >
                      <Icon size={19} strokeWidth={1.4} />
                    </div>


                    <div>

                      <h3
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                        }}
                        className={`
                          text-[16px]
                          font-bold
                          tracking-[-0.025em]
                          transition-colors
                          duration-300
                          sm:text-[18px]
                          ${
                            isActive
                              ? "text-white"
                              : "text-white/65"
                          }
                        `}
                      >
                        {benefit.title}
                      </h3>


                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                        }}
                        className="
                          mt-1
                          block
                          text-[9px]
                          font-bold
                          uppercase
                          tracking-[0.18em]
                          text-white/25
                        "
                      >
                        {benefit.category}
                      </span>

                    </div>

                  </div>


                  {/* ------------------------------------ */}
                  {/* DESCRIPTION                            */}
                  {/* ------------------------------------ */}

                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                    className={`
                      col-span-2
                      max-w-xl
                      text-[13px]
                      leading-6
                      transition-colors
                      duration-300
                      sm:col-span-1
                      ${
                        isActive
                          ? "text-white/50"
                          : "text-white/25"
                      }
                    `}
                  >
                    {benefit.description}
                  </p>


                  {/* ------------------------------------ */}
                  {/* METRIC                                */}
                  {/* ------------------------------------ */}

                  <div
                    className="
                      hidden
                      items-center
                      gap-2
                      sm:flex
                    "
                  >

                    <Activity
                      size={14}
                      className={`
                        transition-colors
                        duration-300
                        ${
                          isActive
                            ? "text-white/50"
                            : "text-white/20"
                        }
                      `}
                    />

                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                      className={`
                        text-[10px]
                        font-bold
                        tracking-[0.15em]
                        ${
                          isActive
                            ? "text-white/50"
                            : "text-white/20"
                        }
                      `}
                    >
                      {benefit.metric}
                    </span>

                  </div>


                  {/* ------------------------------------ */}
                  {/* ARROW                                 */}
                  {/* ------------------------------------ */}

                  <div
                    className={`
                      hidden
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      border
                      transition-all
                      duration-300
                      sm:flex
                      ${
                        isActive
                          ? "border-white/20 bg-white/[0.05] text-white"
                          : "border-white/10 text-white/20"
                      }
                    `}
                  >

                    <ArrowUpRight
                      size={15}
                      className={`
                        transition-transform
                        duration-300
                        ${
                          isActive
                            ? "translate-x-0.5 -translate-y-0.5"
                            : ""
                        }
                      `}
                    />

                  </div>

                </div>


                {/* ------------------------------------ */}
                {/* ACTIVE PROGRESS LINE                 */}
                {/* ------------------------------------ */}

                <div
                  className={`
                    absolute
                    bottom-0
                    left-0
                    h-px
                    transition-all
                    duration-700
                    ${
                      isActive
                        ? "w-full bg-white/20"
                        : "w-0"
                    }
                  `}
                />

              </div>
            );
          })}

        </div>


        {/* ================================================== */}
        {/* BOTTOM NOTE                                        */}
        {/* ================================================== */}

        <div className="mt-8 flex items-center justify-between">

          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
            }}
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-white/20
            "
          >
            Driver fatigue detection · Computer vision · AI
          </span>


          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              hidden
              text-[9px]
              font-bold
              tracking-[0.2em]
              text-white/20
              sm:block
            "
          >
            DRIVESAFE / 04
          </span>

        </div>

      </div>

    </section>
  );
}