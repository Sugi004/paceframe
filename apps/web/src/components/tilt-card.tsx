'use client';

import type { CSSProperties, ReactNode } from 'react';

export function TiltCard({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    element.style.setProperty('--rx', `${offsetY * -10}deg`);
    element.style.setProperty('--ry', `${offsetX * 14}deg`);
    element.style.setProperty('--mx', `${offsetX * 18}px`);
    element.style.setProperty('--my', `${offsetY * 18}px`);
  }

  function reset(event: React.MouseEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    element.style.setProperty('--rx', '0deg');
    element.style.setProperty('--ry', '0deg');
    element.style.setProperty('--mx', '0px');
    element.style.setProperty('--my', '0px');
  }

  return (
    <div
      className="tilt-card"
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={
        {
          '--rx': '0deg',
          '--ry': '0deg',
          '--mx': '0px',
          '--my': '0px'
        } as CSSProperties
      }
    >
      <div className={`tilt-card-inner${className ? ` ${className}` : ''}`}>{children}</div>
    </div>
  );
}
