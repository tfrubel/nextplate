"use client";
import { gsap } from "gsap";
import { TransitionRouter } from "next-transition-router";
import { FC, useRef } from "react";

const TransitionProvider: FC<any> = ({ children }) => {
  const targetElemRef = useRef<HTMLDivElement>(null);
  return (
    <TransitionRouter
      leave={(next) => {
        const pageLeaveAnimation = gsap.to(targetElemRef.current, {
          opacity: 0,
          y: 5,
          duration: 0.4,
          onComplete: next,
        });
        return () => pageLeaveAnimation.kill();
      }}
      enter={(next) => {
        gsap.set(targetElemRef.current, { opacity: 0, y: 5 });
        const pageEnterAnimation = gsap.to(targetElemRef.current, {
          opacity: 1,
          y: 0,
          delay: 0.1,
          duration: 0.4,
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
