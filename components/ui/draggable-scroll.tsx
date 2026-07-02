"use client";

import { useRef } from "react";

interface DraggableScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function DraggableScroll({
  children,
  className = "",
}: DraggableScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;

    isDragging.current = true;
    startX.current = e.pageX;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !ref.current) return;

    e.preventDefault();

    const walk = e.pageX - startX.current;

    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  const stopDragging = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={ref}
      className={`
        overflow-x-auto
        cursor-grab
        active:cursor-grabbing
        select-none
        ${className}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
    >
      {children}
    </div>
  );
}