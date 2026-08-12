import {
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#05070B] px-6 pt-16 lg:px-8">

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
      {/* MAIN FOOTER                                            */}
      {/* ====================================================== */}

      <div className="mx-auto max-w-7xl">

        <div className="grid gap-12 pb-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

          {/* ================================================= */}
          {/* BRAND                                             */}
          {/* ================================================= */}

          <div>

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.04]
                "
              >
                <ShieldCheck
                  size={18}
                  strokeWidth={1.4}
                  className="text-white/70"
                />
              </div>


              <div>

                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                  }}
                  className="
                    block
                    text-[14px]
                    font-bold
                    tracking-[0.18em]
                    text-white
                  "
                >
                  DRIVESAFE
                </span>


                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                  className="
                    mt-0.5
                    block
                    text-[8px]
                    font-semibold
                    tracking-[0.2em]
                    text-white/25
                  "
                >
                  AI DRIVER MONITORING
                </span>

              </div>

            </div>


            {/* Description */}

            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              className="
                mt-6
                max-w-sm
                text-[13px]
                leading-6
                text-white/35
              "
            >
              AI-powered driver fatigue detection designed to
              make every journey safer.
            </p>


            {/* System Status */}

            <div className="mt-6 flex items-center gap-2">

              <span className="relative flex h-1.5 w-1.5">

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

                <span
                  className="
                    relative
                    h-1.5
                    w-1.5
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
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-white/25
                "
              >
                System Ready
              </span>

            </div>

          </div>


          {/* ================================================= */}
          {/* PRODUCT                                           */}
          {/* ================================================= */}

          <FooterColumn title="Product">

            <FooterLink href="#features">
              Features
            </FooterLink>

            <FooterLink href="#how-it-works">
              How It Works
            </FooterLink>

            <FooterLink href="#benefits">
              Who Benefits
            </FooterLink>

            <FooterLink href="#demo">
              Try Demo
            </FooterLink>

          </FooterColumn>


          {/* ================================================= */}
          {/* SYSTEM                                            */}
          {/* ================================================= */}

          <FooterColumn title="System">

            <FooterLink href="#features">
              Real-Time Detection
            </FooterLink>

            <FooterLink href="#features">
              Eye Tracking
            </FooterLink>

            <FooterLink href="#features">
              Fatigue Analysis
            </FooterLink>

            <FooterLink href="#features">
              Instant Alerts
            </FooterLink>

          </FooterColumn>


          {/* ================================================= */}
          {/* CONNECT                                           */}
          {/* ================================================= */}

          <FooterColumn title="Connect">

            <FooterExternalLink href="#">
              GitHub
            </FooterExternalLink>

            <FooterExternalLink href="#">
              LinkedIn
            </FooterExternalLink>

            <FooterExternalLink href="#">
              Contact
            </FooterExternalLink>

          </FooterColumn>

        </div>


        {/* ====================================================== */}
        {/* BOTTOM BAR                                             */}
        {/* ====================================================== */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-t
            border-white/10
            py-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
            }}
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-white/20
            "
          >
            © 2026 DriveSafe. AI-powered safety system.
          </span>


          <div className="flex items-center gap-6">

            <a
              href="#"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-white/20
                transition-colors
                hover:text-white/50
              "
            >
              Privacy
            </a>


            <a
              href="#"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-white/20
                transition-colors
                hover:text-white/50
              "
            >
              Terms
            </a>

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* LARGE BACKGROUND WORD                                  */}
      {/* ====================================================== */}

      <div
        style={{
          fontFamily: "'Orbitron', sans-serif",
        }}
        className="
          pointer-events-none
          mt-8
          select-none
          text-center
          text-[16vw]
          font-black
          leading-[0.7]
          tracking-[-0.08em]
          text-white/[0.018]
        "
      >
        DRIVESAFE
      </div>

    </footer>
  );
}


/* ====================================================== */
/* FOOTER COLUMN                                          */
/* ====================================================== */

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <h3
        style={{
          fontFamily: "'Rajdhani', sans-serif",
        }}
        className="
          mb-5
          text-[10px]
          font-bold
          uppercase
          tracking-[0.22em]
          text-white/25
        "
      >
        {title}
      </h3>


      <div className="flex flex-col gap-3">

        {children}

      </div>

    </div>
  );
}


/* ====================================================== */
/* FOOTER LINK                                            */
/* ====================================================== */

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        fontFamily: "'Rajdhani', sans-serif",
      }}
      className="
        w-fit
        text-[12px]
        font-semibold
        text-white/35
        transition-all
        duration-300
        hover:translate-x-1
        hover:text-white
      "
    >
      {children}
    </a>
  );
}


/* ====================================================== */
/* EXTERNAL FOOTER LINK                                   */
/* ====================================================== */

function FooterExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        fontFamily: "'Rajdhani', sans-serif",
      }}
      className="
        group
        flex
        w-fit
        items-center
        gap-2
        text-[12px]
        font-semibold
        text-white/35
        transition-colors
        duration-300
        hover:text-white
      "
    >

      {children}

      <ArrowUpRight
        size={12}
        className="
          opacity-0
          transition-all
          duration-300
          group-hover:-translate-y-0.5
          group-hover:translate-x-0.5
          group-hover:opacity-100
        "
      />

    </a>
  );
}