"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

const TrueFocus = ({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "#82befa",
  glowColor = "rgba(0, 255, 0, 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
}: TrueFocusProps) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(
        () => {
          setCurrentIndex((prev) => (prev + 1) % words.length);
        },
        (animationDuration + pauseBetweenAnimations) * 1000,
      );

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  // Update corner position based on active word
  const updateFocusRect = () => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  };

  useEffect(() => {
    updateFocusRect();
  }, [currentIndex, words.length]);

  // Add resize listener to update corners on viewport changes
  useEffect(() => {
    const handleResize = () => {
      updateFocusRect();
    };

    window.addEventListener("resize", handleResize);
    // Also update on orientation change for mobile
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 md:gap-4 outline-none select-none"
    >
      {/* First word (Focus) */}
      <span
        ref={(el) => {
          wordRefs.current[0] = el;
        }}
        className={`
          relative
          text-2xl sm:text-3xl md:text-4xl lg:text-5xl
          font-black
          outline-none select-none
          transition-all duration-300 ease-in-out 
          ${currentIndex === 0 ? "text-[var(--active-color)] text-4xl mr-2" : ""}
        `}
        style={
          {
            filter: currentIndex === 0 ? `blur(0px)` : `blur(${blurAmount}px)`,
            transform: currentIndex === 0 ? "scale(1.05)" : "scale(1)",
            "--active-color": borderColor,
            transitionDuration: `${animationDuration}s`,
            transitionProperty: "filter, transform",
          } as React.CSSProperties
        }
      >
        {words[0]}
      </span>

      {/* Line break for mobile */}
      <div className="basis-full h-0 sm:hidden" />

      {/* Remaining words */}
      {words.slice(1).map((word, index) => {
        const actualIndex = index + 1;
        const isActive = actualIndex === currentIndex;
        return (
          <span
            key={actualIndex}
            ref={(el) => {
              wordRefs.current[actualIndex] = el;
            }}
            className={`
              relative
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl
              font-black
              outline-none select-none
              transition-all duration-300 ease-in-out
              ${isActive ? "text-[var(--active-color)]" : ""}
            `}
            style={
              {
                filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
                transform: isActive ? "scale(1.05)" : "scale(1)",
                "--active-color": borderColor,
                transitionDuration: `${animationDuration}s`,
                transitionProperty: "filter, transform",
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="absolute top-0 left-0 pointer-events-none"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
        }}
      >
        {/* Top Left Corner */}
        <span
          className="
            absolute -top-2 -left-2
            w-4 h-4
            border-l-[3px] border-t-[3px]
            rounded-tl-sm
          "
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0px 0px 4px ${borderColor})`,
          }}
        />

        {/* Top Right Corner */}
        <span
          className="
            absolute -top-2 -right-2
            w-4 h-4
            border-r-[3px] border-t-[3px]
            rounded-tr-sm
          "
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0px 0px 4px ${borderColor})`,
          }}
        />

        {/* Bottom Left Corner */}
        <span
          className="
            absolute -bottom-2 -left-2
            w-4 h-4
            border-l-[3px] border-b-[3px]
            rounded-bl-sm
          "
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0px 0px 4px ${borderColor})`,
          }}
        />

        {/* Bottom Right Corner */}
        <span
          className="
            absolute -bottom-2 -right-2
            w-4 h-4
            border-r-[3px] border-b-[3px]
            rounded-br-sm
          "
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0px 0px 4px ${borderColor})`,
          }}
        />
      </motion.div>
    </div>
  );
};

export default TrueFocus;
