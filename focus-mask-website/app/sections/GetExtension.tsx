"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Icon } from "@iconify/react";

export default function GetExtension() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [24, 0, 0, -24]);

  const browsers = [
    { name: "Chrome", icon: "devicon:chrome" },
    { name: "Brave", icon: "logos:brave" },
    { name: "Edge", icon: "logos:microsoft-edge" },
  ];

  return (
    <section
      id="get-extension"
      ref={containerRef}
      className="relative overflow-hidden
        py-16 md:py-32"
    >
      {/* Top gradient blend */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0B1021] to-transparent pointer-events-none" />
      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
        <div
          className="w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] md:w-[600px] md:h-[600px]
          bg-blue-600/10 blur-[100px] rounded-full"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          style={{ opacity, y }}
          className="relative max-w-xl sm:max-w-2xl md:max-w-4xl mx-auto"
        >
          {/* Glass Card */}
          <div
            className="
              relative overflow-hidden rounded-2xl sm:rounded-3xl
              border border-white/10
              bg-gradient-to-b from-white/[0.04] to-transparent
              shadow-2xl
              px-6 py-10
              sm:px-10 sm:py-14
              md:px-16 md:py-16
              text-center
            "
          >
            {/* Inner gradient mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

            <h2
              className="
                relative z-10
                text-2xl sm:text-3xl md:text-5xl
                font-semibold tracking-tight
                text-white
                mb-4 sm:mb-6
              "
            >
              Ready to reclaim your focus?
            </h2>

            <p
              className="
                relative z-10
                text-sm sm:text-base md:text-xl
                text-text-muted
                leading-relaxed
                max-w-md sm:max-w-xl mx-auto
                mb-8 sm:mb-12
              "
            >
              Experience a distraction-free browsing environment and boost your
              productivity. Works seamlessly on your favorite browsers.
            </p>

            {/* Browser Support UI */}
            <div className="relative z-10 flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-10 sm:mb-14">
              {browsers.map((browser, index) => (
                <motion.div
                  key={browser.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="relative p-2.5 sm:p-3 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.08] group-hover:border-blue-500/30 group-hover:scale-110 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-blue-500/10">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon
                      icon={browser.icon}
                      className="w-6 h-6 sm:w-8 sm:h-8 relative z-10"
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase text-text-muted group-hover:text-white transition-colors">
                    {browser.name}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 flex justify-center">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="https://chromewebstore.google.com/detail/focus-mask/gebdfpdpijonpofhhoogpifeoklmmgoc"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-animated w-full sm:w-auto"
              >
                <div className="btn-animated-content gap-2.5">
                  <span className="text-sm sm:text-base font-medium">
                    Get Extension
                  </span>
                  <Icon
                    icon="material-symbols:extension"
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                </div>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
