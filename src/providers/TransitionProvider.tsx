"use client";
import { gsap } from "gsap";
import { GSDevTools } from "gsap/GSDevTools";
import ScrollTrigger from "gsap/ScrollTrigger";
import { TransitionRouter } from "next-transition-router";
import { FC, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(GSDevTools);

const TransitionProvider: FC<any> = ({ children }) => {
  const targetElemRef = useRef<HTMLDivElement>(null);
  return (
    <TransitionRouter
      leave={(next) => {
        const pageLeaveAnimation = gsap.to(targetElemRef.current, {
          opacity: 0,
          y: 5,
          duration: 0.3,
          onComplete: next,
        });
        return () => pageLeaveAnimation.kill();
      }}
      enter={(next) => {
        gsap.set(targetElemRef.current, { opacity: 0, y: 5 });
        const pageEnterAnimation = gsap.to(targetElemRef.current, {
          opacity: 1,
          y: 0,
          delay: 0.05,
          duration: 0.3,
          onComplete: next,
        });
        return () => pageEnterAnimation.kill();
      }}
      auto
    >
      <div ref={targetElemRef} className="border">
        {children}
      </div>
    </TransitionRouter>
  );
};

export default TransitionProvider;
