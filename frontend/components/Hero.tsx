import {
  ArrowRight,
  CircleCheck,
} from "lucide-react";

export default function Hero() {
  return (
    <section
      id="demo"
      className="relative min-h-screen overflow-hidden bg-[#05070B]"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >

      {/* ====================================================== */}
      {/* FUTURISTIC FONTS                                       */}
      {/* ====================================================== */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>


      {/* ====================================================== */}
      {/* BACKGROUND VIDEO                                       */}
      {/* ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <video
          autoPlay
          loop
          muted
          playsInline
          className="
            absolute
            left-[25%]
            top-[-5%]
            h-[110%]
            w-[85%]
            max-w-none
            object-cover
            opacity-[0.48]
          "
        >
          <source
            src="/videos/hero-bg.mp4"
            type="video/mp4"
          />
        </video>


        {/* Overall dark overlay */}

        <div className="absolute inset-0 bg-[#05070B]/35" />


        {/* Keep left side clean for text */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-[#05070B]
            via-[#05070B]/75
            to-transparent
          "
        />


        {/* Bottom fade */}

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-48
            bg-gradient-to-t
            from-[#05070B]
            to-transparent
          "
        />

      </div>


      {/* ====================================================== */}
      {/* FUTURISTIC BACKGROUND RINGS                            */}
      {/* ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-[-120px]
          top-[16%]
          h-[650px]
          w-[650px]
          animate-[spin_35s_linear_infinite]
          rounded-full
          border
          border-white/[0.025]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-[-20px]
          top-[27%]
          h-[470px]
          w-[470px]
          animate-[spin_25s_linear_infinite_reverse]
          rounded-full
          border
          border-white/[0.035]
        "
      />


      {/* ====================================================== */}
      {/* SMALL TECHNICAL GRID                                   */}
      {/* ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-[5%]
          top-[20%]
          h-[500px]
          w-[500px]
          opacity-[0.12]
          [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]
          [background-size:45px_45px]
          [mask-image:radial-gradient(circle,black_0%,transparent_70%)]
        "
      />


      {/* ====================================================== */}
      {/* HERO CONTENT                                           */}
      {/* ====================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-screen
          max-w-7xl
          items-center
          px-6
          pb-20
          pt-32
          lg:px-8
        "
      >

        {/* ================================================== */}
        {/* LEFT CONTENT                                       */}
        {/* ================================================== */}

        <div className="w-full max-w-2xl">

          {/* ----------------------------------------------- */}
          {/* EYEBROW                                          */}
          {/* ----------------------------------------------- */}

          <div className="mb-7">

            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
              }}
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.4em]
                text-white/45
                sm:text-[11px]
              "
            >
              AI-POWERED DRIVER MONITORING
            </span>

          </div>


          {/* ----------------------------------------------- */}
          {/* MAIN HEADING                                     */}
          {/* ----------------------------------------------- */}

          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              max-w-[780px]
              text-[50px]
              font-black
              leading-[0.94]
              tracking-[-0.055em]
              text-white
              sm:text-[66px]
              md:text-[74px]
              lg:text-[82px]
              xl:text-[90px]
            "
          >

            Stay Alert.

            <br />

            <span
              className="
                bg-gradient-to-r
                from-white
                via-white
                to-white/55
                bg-clip-text
                text-transparent
              "
            >
              Drive Safer.
            </span>

          </h1>


          {/* ----------------------------------------------- */}
          {/* DESCRIPTION                                      */}
          {/* ----------------------------------------------- */}

          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            className="
              mt-8
              max-w-[560px]
              text-[16px]
              font-normal
              leading-[1.8]
              tracking-[-0.01em]
              text-white/55
              sm:text-[17px]
              lg:text-[18px]
            "
          >
            AI-powered driver fatigue detection for safer journeys.
            Monitor signs of drowsiness in real time and respond
            before fatigue becomes a risk.
          </p>


          {/* ----------------------------------------------- */}
          {/* BUTTONS                                          */}
          {/* ----------------------------------------------- */}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">

            {/* TRY DEMO */}

            <a
              href="#demo"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                group
                flex
                w-fit
                items-center
                justify-center
                gap-3
                rounded-full
                bg-white
                px-7
                py-4
                text-[15px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-[#05070B]
                transition-all
                duration-300
                hover:scale-[1.02]
                hover:bg-white/90
              "
            >
              Try Demo

              <ArrowRight
                size={17}
                className="
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              />

            </a>


            {/* HOW IT WORKS */}

            <a
              href="#how-it-works"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                flex
                w-fit
                items-center
                justify-center
                rounded-full
                border
                border-white/15
                bg-white/[0.02]
                px-7
                py-4
                text-[15px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-white/75
                transition-all
                duration-300
                hover:border-white/30
                hover:bg-white/[0.05]
                hover:text-white
              "
            >
              How It Works
            </a>

          </div>


          {/* ----------------------------------------------- */}
          {/* TRUST INDICATORS                                 */}
          {/* ----------------------------------------------- */}

          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3">

            <TechPoint>
              Real-time detection
            </TechPoint>

            <TechPoint>
              AI-powered
            </TechPoint>

            <TechPoint>
              Instant alerts
            </TechPoint>

          </div>

        </div>

      </div>

    </section>
  );
}


/* ====================================================== */
/* TECH POINT                                            */
/* ====================================================== */

function TechPoint({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: "'Rajdhani', sans-serif",
      }}
      className="
        flex
        items-center
        gap-2
        text-[14px]
        font-semibold
        tracking-[0.04em]
        text-white/40
      "
    >

      <CircleCheck
        size={14}
        strokeWidth={1.5}
        className="text-white/35"
      />

      {children}

    </div>
  );
}