import gsap from 'gsap';

/**
 * GSAP Animation Presets
 * Reusable timeline factories for consistent motion language.
 */

/** Standard easing curves */
export const EASE = {
  out: 'power2.out',
  inOut: 'power3.inOut',
  expo: 'expo.out',
  bounce: 'back.out(1.7)',
};

/** Micro-interaction: hover glow */
export function hoverGlow(element, active) {
  gsap.to(element, {
    boxShadow: active
      ? '0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(139,92,246,0.2)'
      : '0 0 15px rgba(99,102,241,0.15)',
    duration: 0.25,
    ease: EASE.out,
  });
}

/** Staggered reveal for child elements */
export function staggerReveal(container, childSelector, options = {}) {
  const { delay = 0, stagger = 0.06, y = 30 } = options;

  return gsap.fromTo(
    container.querySelectorAll(childSelector),
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: EASE.out,
      stagger,
      delay,
    }
  );
}

/** Section entrance animation */
export function sectionEntrance(element) {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: EASE.inOut,
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        end: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    }
  );
}
