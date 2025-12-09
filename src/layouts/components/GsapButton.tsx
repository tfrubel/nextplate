"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";

const GsapButton = ({
  button,
}: {
  button: {
    enable: boolean;
    label: string;
    link: string;
    rest: any;
  };
}) => {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const flairRef = useRef<HTMLSpanElement>(null);

  const getXY = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return { x: 0, y: 0 };

    const { left, top, width, height } =
      buttonRef.current.getBoundingClientRect();

    const xTransformer = (val: number) =>
      Math.max(0, Math.min(100, (val / width) * 100));
    const yTransformer = (val: number) =>
      Math.max(0, Math.min(100, (val / height) * 100));

    return {
      x: xTransformer(e.clientX - left),
      y: yTransformer(e.clientY - top),
    };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!flairRef.current) return;

    const { x, y } = getXY(e);

    gsap.set(flairRef.current, {
      xPercent: x,
      yPercent: y,
    });

    gsap.to(flairRef.current, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!flairRef.current) return;

    const { x, y } = getXY(e);
    gsap.killTweensOf(flairRef.current);

    gsap.to(flairRef.current, {
      xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
      yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
      scale: 0,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!flairRef.current) return;

    const { x, y } = getXY(e);

    gsap.to(flairRef.current, {
      xPercent: x,
      yPercent: y,
      duration: 0.4,
      ease: "power2",
    });
  };

  useGSAP(
    () => {
      if (!flairRef.current) return;

      gsap.set(flairRef.current, {
        xPercent: -50,
        yPercent: -50,
        scale: 0,
      });
    },
    { scope: buttonRef },
  );

  if (!button.enable) return null;
  return (
    <Link
      ref={buttonRef}
      href={button.link}
      className=" btn btn-primary relative border-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      {...button.rest}
    >
      <span
        ref={flairRef}
        className="button__flair  pointer-events-none"
      ></span>
      <span className="button__label relative z-10">{button.label}</span>
    </Link>
  );
};

export default GsapButton;
