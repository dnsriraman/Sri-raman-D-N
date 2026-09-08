import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  root = null,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}) {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      const [entry] = entries;
      if (entry && entry.isIntersecting) {
        setIsIntersecting(true);
        setHasAnimated(true);
        if (triggerOnce && ref.current) {
          observer.unobserve(ref.current);
        }
      } else if (!triggerOnce) {
        setIsIntersecting(false);
      }
    },
    [triggerOnce]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // Fallback if IntersectionObserver is unsupported
      setIsIntersecting(true);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      root,
      rootMargin,
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, handleIntersect]);

  return { ref, isIntersecting, isVisible: hasAnimated || isIntersecting, hasAnimated };
}

/**
 * Helper hook specifically for staggered animations of multiple elements
 */
export function useStaggeredIntersection<T extends HTMLElement = HTMLDivElement>(
  itemCount: number,
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isVisible } = useIntersectionObserver<T>(options);

  const getItemStyle = (index: number, baseDelay: number = 0.08) => {
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * baseDelay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * baseDelay}s`,
    };
  };

  return { containerRef: ref, isVisible, getItemStyle };
}
