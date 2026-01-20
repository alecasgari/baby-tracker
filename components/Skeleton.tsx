"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  rounded?: "full" | "lg";
}

export function Skeleton({ className = "", rounded = "full" }: SkeletonProps) {
  const roundedClass = rounded === "lg" ? "skeleton-card" : "skeleton";
  return <div className={`${roundedClass} ${className}`} />;
}

