import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-up';
  delay?: number; // in seconds, e.g. 0.1
  duration?: number; // in seconds, e.g. 0.6
  threshold?: number;
  className?: string;
  id?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 0.65,
  threshold = 0.12,
  className = '',
  id,
}) => {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold,
    triggerOnce: true,
  });

  const getTransform = () => {
    switch (animation) {
      case 'fade-up':
        return isVisible ? 'translateY(0)' : 'translateY(28px)';
      case 'fade-down':
        return isVisible ? 'translateY(0)' : 'translateY(-28px)';
      case 'fade-left':
        return isVisible ? 'translateX(0)' : 'translateX(-28px)';
      case 'fade-right':
        return isVisible ? 'translateX(0)' : 'translateX(28px)';
      case 'scale-up':
        return isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(18px)';
      case 'fade-in':
      default:
        return 'none';
    }
  };

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};
