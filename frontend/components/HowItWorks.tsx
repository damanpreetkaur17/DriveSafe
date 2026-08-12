import {
  Camera,
  ScanFace,
  BrainCircuit,
  BellRing,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#05070B] px-6 py-28 sm:py-32 lg:px-8"
    >
      {/* ====================================================== */}
      {/* TOP DIVIDER                                            */}
      {/* ====================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ====================================================== */}
      {/* BACKGROUND GLOW                                        */}
      {/* ====================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.012] blur-3xl" />


      {/* ====================================================== */}
      {/* MAIN CONTENT                                           */}
      {/* ====================================================== */}

      <div className="relative mx-auto max-w-7xl">

        {/* ================================================== */}
        {/* CENTERED SECTION TITLE                              */}
        {/* ================================================== */}

        <div className="mb-20 text-center">

          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              text-[11px]
              font-bold
              uppercase
              tracking-[0.45em]
              text-white/45
              sm:text-[12px]
            "
          >
            How It Works
          </span>

        </div>


        {/* ================================================== */}
        {/* FLOW                                                */}
        {/* ================================================== */}

        <div className="relative">

          {/* ================================================= */}
          {/* MAIN CONNECTING LINE                               */}
          {/* ================================================= */}

          <div
            className="
              pointer-events-none
              absolute
              left-[12.5%]
              right-[12.5%]
              top-[56px]
              hidden
              h-px
              bg-white/10
              lg:block
            "
          >

            {/* Moving Energy Pulse */}

            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[18%]
                bg-gradient-to-r
                from-transparent
                via-white
                to-transparent
                opacity-90
                blur-[1px]
                animate-[flow_2.8s_linear_infinite]
              "
            />

          </div>


          {/* ================================================= */}
          {/* FOUR EQUAL FLOW COLUMNS                            */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 gap-14 lg:grid-cols-4 lg:gap-0">

            {/* ============================================== */}
            {/* CAPTURE                                         */}
            {/* ============================================== */}

            <FlowStep
              number="01"
              icon={<Camera size={24} strokeWidth={1.5} />}
              title="Capture"
              description="Camera"
            />


            {/* ============================================== */}
            {/* ANALYZE                                         */}
            {/* ============================================== */}

            <FlowStep
              number="02"
              icon={<ScanFace size={24} strokeWidth={1.5} />}
              title="Analyze"
              description="Computer Vision"
            />


            {/* ============================================== */}
            {/* DETECT                                          */}
            {/* ============================================== */}

            <FlowStep
              number="03"
              icon={<BrainCircuit size={24} strokeWidth={1.5} />}
              title="Detect"
              description="AI Model"
            />


            {/* ============================================== */}
            {/* ALERT                                           */}
            {/* ============================================== */}

            <FlowStep
              number="04"
              icon={<BellRing size={24} strokeWidth={1.5} />}
              title="Alert"
              description="Safety Response"
            />

          </div>

        </div>


        {/* ================================================== */}
        {/* BOTTOM STATUS                                       */}
        {/* ================================================== */}

        <div className="mt-20 flex justify-center">

          <div
            className="
              flex
              items-center
              gap-3
              rounded-full
              border
              border-white/10
              bg-white/[0.02]
              px-5
              py-3
            "
          >

            {/* Status Indicator */}

            <span className="relative flex h-2 w-2">

              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-green-400
                  opacity-50
                "
              />

              <span
                className="
                  relative
                  h-2
                  w-2
                  rounded-full
                  bg-green-400
                "
              />

            </span>


            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-white/40
              "
            >
              AI Monitoring Active
            </span>

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* FLOW ANIMATION                                         */}
      {/* ====================================================== */}

      <style>{`
        @keyframes flow {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(680%);
          }
        }
      `}</style>

    </section>
  );
}


/* ====================================================== */
/* FLOW STEP                                              */
/* ====================================================== */

function FlowStep({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        group
        relative
        flex
        flex-col
        items-center
        lg:items-center
      "
    >

      {/* ================================================= */}
      {/* ICON NODE                                          */}
      {/* ================================================= */}

      <div className="relative z-10 flex justify-center">

        {/* Outer Hover Ring */}

        <div
          className="
            absolute
            h-[112px]
            w-[112px]
            rounded-full
            border
            border-white/[0.025]
            opacity-0
            transition-all
            duration-500
            group-hover:scale-125
            group-hover:opacity-100
          "
        />


        {/* Main Circle */}

        <div
          className="
            relative
            flex
            h-[112px]
            w-[112px]
            items-center
            justify-center
            rounded-full
            border
            border-white/10
            bg-[#07090E]
            text-white/50
            transition-all
            duration-500
            group-hover:border-white/30
            group-hover:bg-[#0b0e14]
            group-hover:text-white
          "
        >

          {/* Number */}

          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
            }}
            className="
              absolute
              right-2
              top-2
              text-[8px]
              font-bold
              tracking-[0.15em]
              text-white/20
            "
          >
            {number}
          </span>


          {/* Icon */}

          {icon}

        </div>

      </div>


      {/* ================================================= */}
      {/* TEXT                                               */}
      {/* ================================================= */}

      <div className="mt-6 text-center">

        <h3
          style={{
            fontFamily: "'Orbitron', sans-serif",
          }}
          className="
            text-[17px]
            font-bold
            uppercase
            tracking-[-0.02em]
            text-white
            sm:text-[19px]
          "
        >
          {title}
        </h3>


        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
          }}
          className="
            mt-2
            text-[12px]
            font-semibold
            uppercase
            tracking-[0.15em]
            text-white/25
          "
        >
          {description}
        </p>

      </div>

    </div>
  );
}