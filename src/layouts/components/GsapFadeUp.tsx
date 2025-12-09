"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import React from "react";
gsap.registerPlugin(ScrollTrigger);

const GsapFadeUp = ({ children }: { children: React.ReactNode }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.from(containerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          end: "top 70%",
          scrub: 1,
          markers: false,
        },
        opacity: 0,
        y: 30,
        ease: "power4.out",
      });
    },
    { scope: containerRef },
  );

  return <div ref={containerRef}>{children}</div>;
};

export default GsapFadeUp;
