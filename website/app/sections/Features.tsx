"use client";

import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      title: "Precision Focus",
      description:
        "Draw exact areas you want to see. Everything else fades away into the background.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            strokeDasharray="4 4"
          />
          <path d="M9 12h6m-3-3v6" />
        </svg>
      ),
    },
    {
      title: "Deep Concentration",
      description:
        "Adjust blur and darkness levels to eliminate visual noise from your peripheral vision.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path
            d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4"
            strokeOpacity="0.5"
          />
        </svg>
      ),
    },
    {
      title: "Zero Distractions",
      description:
        "Block interactions outside the focus area. No accidental clicks or wandering mouse.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    },
    {
      title: "Always Accessible",
      description:
        "A floating toolbar keeps your focus controls within reach at all times.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="6" width="20" height="12" rx="6" />
          <circle cx="6" cy="12" r="2" fill="currentColor" opacity="0.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="18" cy="12" r="2" fill="currentColor" opacity="0.5" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden
        py-8 md:py-20
        bg-[#0B1021]"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 ">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="
              text-2xl sm:text-3xl md:text-5xl
              font-semibold tracking-tight
              text-text-main
              mb-3 sm:mb-5
            "
          >
            Designed for Flow State
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="
              text-sm sm:text-base md:text-lg
              text-text-muted
              max-w-xl mx-auto
              leading-relaxed
            "
          >
            Focus Mask gives you powerful attention control without clutter or
            complexity.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            show: {
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="
            grid grid-cols-1 md:grid-cols-1 
            gap-4 sm:gap-6
          "
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="
                group relative
                rounded-2xl
                border border-white/10
                bg-white/[0.03]
                backdrop-blur-xl
                px-4 py-6 sm:px-6 sm:py-6
                flex gap-4
                transition-all duration-300
                hover:bg-white/[0.05]
                hover:border-blue-500/30
                w-full
                max-w-2xl mx-auto
              "
            >
              {/* Icon */}
              <div
                className="
                  flex-shrink-0
                  w-10 h-10 sm:w-11 sm:h-11
                  rounded-xl
                  flex items-center justify-center
                  text-blue-400
                  bg-blue-500/10
                  border border-blue-500/20
                  shadow-[0_0_18px_rgba(59,130,246,0.12)]
                  transition-transform duration-300
                  group-hover:scale-110
                "
              >
                {feature.icon}
              </div>

              {/* Content */}
              <div className="min-w-0">
                <h3
                  className="
                    text-base sm:text-lg
                    font-semibold
                    text-blue-100
                    group-hover:text-white
                    transition-colors
                    mb-1
                  "
                >
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Soft hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-blue-500/10 to-transparent" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
