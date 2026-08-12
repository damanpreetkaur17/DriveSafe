import {
  Activity,
  Eye,
  BrainCircuit,
  BellRing,
  ArrowUpRight,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#05070B] px-6 py-28 sm:py-32 lg:px-8"
    >
      {/* ====================================================== */}
      {/* BACKGROUND                                             */}
      {/* ====================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="pointer-events-none absolute left-[-200px] top-[20%] h-[400px] w-[400px] rounded-full bg-white/[0.015] blur-3xl" />


      {/* ====================================================== */}
      {/* CONTENT                                                */}
      {/* ====================================================== */}

      <div className="relative mx-auto max-w-7xl">

        {/* ----------------------------------------------- */}
        {/* SECTION HEADER                                   */}
        {/* ----------------------------------------------- */}

        <div className="max-w-2xl">

          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.4em]
              text-white/35
              sm:text-[11px]
            "
          >
            Built for safer journeys
          </span>


          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              mt-5
              text-[38px]
              font-bold
              leading-[1]
              tracking-[-0.04em]
              text-white
              sm:text-[50px]
              lg:text-[58px]
            "
          >
            Intelligence
            <br />

            <span className="text-white/40">
              behind the wheel.
            </span>
          </h2>


          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            className="
              mt-6
              max-w-xl
              text-[15px]
              leading-7
              text-white/45
              sm:text-[16px]
            "
          >
            DriveSafe combines computer vision and AI-powered analysis
            to identify signs of driver fatigue before they become
            a serious risk.
          </p>

        </div>


        {/* ================================================== */}
        {/* FEATURE GRID                                       */}
        {/* ================================================== */}

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">


          {/* ================================================= */}
          {/* FEATURE 01 — REAL TIME                            */}
          {/* ================================================= */}

          <FeatureCard
            number="01"
            icon={<Activity size={22} strokeWidth={1.5} />}
            title="Real-Time Monitoring"
            description="Continuously monitor the driver through live camera input and detect changes in behavior as they happen."
            tag="LIVE DETECTION"
          />


          {/* ================================================= */}
          {/* FEATURE 02 — EYE TRACKING                         */}
          {/* ================================================= */}

          <FeatureCard
            number="02"
            icon={<Eye size={22} strokeWidth={1.5} />}
            title="Eye Tracking"
            description="Analyze eye movement and prolonged eye closure to identify early signs of drowsiness and reduced alertness."
            tag="EYE ANALYSIS"
          />


          {/* ================================================= */}
          {/* FEATURE 03 — FATIGUE ANALYSIS                     */}
          {/* ================================================= */}

          <FeatureCard
            number="03"
            icon={<BrainCircuit size={22} strokeWidth={1.5} />}
            title="Fatigue Analysis"
            description="Combine multiple visual signals to calculate a fatigue level and understand the driver's current state."
            tag="AI ANALYSIS"
          />


          {/* ================================================= */}
          {/* FEATURE 04 — ALERTS                               */}
          {/* ================================================= */}

          <FeatureCard
            number="04"
            icon={<BellRing size={22} strokeWidth={1.5} />}
            title="Instant Alerts"
            description="Trigger immediate warnings when fatigue reaches a critical level so the driver can take action."
            tag="SAFETY ALERT"

          />

        </div>

      </div>

    </section>
  );
}


/* ====================================================== */
/* FEATURE CARD                                            */
/* ====================================================== */

function FeatureCard({
  number,
  icon,
  title,
  description,
  tag,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div
      className="
        group
        relative
        min-h-[330px]
        overflow-hidden
        bg-[#07090E]
        p-7
        transition-all
        duration-500
        hover:bg-[#0a0d13]
        sm:p-9
      "
    >

      {/* ----------------------------------------------- */}
      {/* HOVER GLOW                                      */}
      {/* ----------------------------------------------- */}

      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-48
          w-48
          rounded-full
          bg-white/[0.025]
          blur-3xl
          transition-all
          duration-700
          group-hover:bg-white/[0.05]
        "
      />


      {/* ----------------------------------------------- */}
      {/* TOP ROW                                         */}
      {/* ----------------------------------------------- */}

      <div className="relative flex items-start justify-between">

        {/* Icon */}

        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            border
            border-white/10
            bg-white/[0.03]
            text-white/70
            transition-all
            duration-300
            group-hover:border-white/20
            group-hover:bg-white/[0.06]
            group-hover:text-white
          "
        >
          {icon}
        </div>


        {/* Number */}

        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
          }}
          className="
            text-[10px]
            font-semibold
            tracking-[0.2em]
            text-white/20
          "
        >
          {number}
        </span>

      </div>


      {/* ----------------------------------------------- */}
      {/* TAG                                             */}
      {/* ----------------------------------------------- */}

      <div className="relative mt-12">

        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
          }}
          className="
            text-[10px]
            font-bold
            tracking-[0.18em]
            text-white/30
          "
        >
          {tag}
        </span>

      </div>


      {/* ----------------------------------------------- */}
      {/* TITLE                                           */}
      {/* ----------------------------------------------- */}

      <h3
        style={{
          fontFamily: "'Orbitron', sans-serif",
        }}
        className="
          relative
          mt-3
          text-[20px]
          font-bold
          tracking-[-0.02em]
          text-white
          sm:text-[22px]
        "
      >
        {title}
      </h3>


      {/* ----------------------------------------------- */}
      {/* DESCRIPTION                                     */}
      {/* ----------------------------------------------- */}

      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
        }}
        className="
          relative
          mt-4
          max-w-md
          text-[14px]
          leading-6
          text-white/40
          sm:text-[15px]
        "
      >
        {description}
      </p>


      {/* ----------------------------------------------- */}
      {/* ARROW                                          */}
      {/* ----------------------------------------------- */}

      <div
        className="
          absolute
          bottom-8
          right-8
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          border
          border-white/10
          text-white/30
          transition-all
          duration-300
          group-hover:border-white/25
          group-hover:text-white
        "
      >
        <ArrowUpRight
          size={16}
          className="
            transition-transform
            duration-300
            group-hover:translate-x-0.5
            group-hover:-translate-y-0.5
          "
        />
      </div>

    </div>
  );
}