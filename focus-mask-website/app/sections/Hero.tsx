"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export default function Hero() {
  return (
    <section className="relative pt-24 md:pt-28 pb-16 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center gap-10">
          {/* Text Content */}
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-6"
            >
              <span className="text-blue-400">Focus</span>{" "}
              <span className="text-white">on what matters.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base md:text-lg text-text-muted max-w-xl mx-auto mb-8"
            >
              Eliminate digital noise. Blur unrelated content, darken
              distractions, and lock in deep focus instantly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="https://chromewebstore.google.com/detail/focus-mask/gebdfpdpijonpofhhoogpifeoklmmgoc"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-animated inline-flex"
              >
                <div className="btn-animated-content gap-2.5">
                  <span className="text-sm sm:text-base font-medium">
                    Get Extension
                  </span>
                  <Icon icon="material-symbols:extension" className="w-5 h-5" />
                </div>
              </motion.a>

              {/* Subtle Browser Logos */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              >
                <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-text-muted">
                  Works on:
                </span>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="devicon:chrome"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <Icon icon="logos:brave" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <Icon
                    icon="logos:microsoft-edge"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="relative w-full max-w-7xl"
          >
            <video
              src="/demo-hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              title="Focus Mask Demo Video"
              aria-label="Demonstration of Focus Mask extension features"
              className="w-full h-full object-contain"
            />

            {/* Ambient glow */}
            <div className="absolute inset-0 -z-10 bg-blue-500/20 blur-[120px] opacity-40 rounded-full" />
          </motion.div>
        </div>
      </div>
      {/* Bottom gradient blend */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1021] to-transparent pointer-events-none" />
    </section>
  );
}
