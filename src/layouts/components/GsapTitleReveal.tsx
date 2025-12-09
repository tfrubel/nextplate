"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";
import React, { JSX } from "react";

gsap.registerPlugin(ScrollTrigger, SplitText);

const GsapTitleReveal = ({
  texts,
  as: AnyTag = "h2",
}: {
  texts: string;
  as?: keyof JSX.IntrinsicElements;
}) => {
  const textContainerRef = React.useRef<HTMLElement>(null);
  const Component = AnyTag as any;

  useGSAP(
    () => {
      if (!textContainerRef.current) return;
      const split = new SplitText(textContainerRef.current, { type: "chars" });
      gsap.from(split.chars, {
        scrollTrigger: {
          trigger: textContainerRef.current,
          start: "top 90%",
          end: "top center",
          scrub: 1,
          markers: false,
        },
        opacity: 0,
        y: 30,
        filter: "blur(20px)",
        stagger: 0.01,
        ease: "power4.out",
      });

      return () => split.revert();
    },
    { scope: textContainerRef },
  );

  return (
    <Component ref={textContainerRef} className="gsap-title-reveal">
      {texts}
    </Component>
  );
};

export default GsapTitleReveal;
