"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface TreeGrowthProps {
  elapsedSeconds: number;
}

export function TreeGrowth({ elapsedSeconds }: TreeGrowthProps) {
  const minutes = Math.floor(elapsedSeconds / 60);

  // Growth stages:
  // 0: Sprout (< 2 min)
  // 1: Seedling (2 - 10 min)
  // 2: Young Tree (10 - 25 min)
  // 3: Mature Tree (25 - 50 min)
  // 4: Ancient Forge Pine (50+ min)
  let stage = 0;
  let stageName = "Sprout";
  if (minutes >= 50) {
    stage = 4;
    stageName = "Ancient Forge Pine";
  } else if (minutes >= 25) {
    stage = 3;
    stageName = "Mature Oak";
  } else if (minutes >= 10) {
    stage = 2;
    stageName = "Young Sapling";
  } else if (minutes >= 2) {
    stage = 1;
    stageName = "Seedling";
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* SVG Canvas for Tree */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl glass-panel border border-[var(--border-color)] flex items-center justify-center overflow-hidden shadow-glow">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full p-4 transition-all duration-700 ease-out"
        >
          {/* Ground mound */}
          <ellipse cx="100" cy="180" rx="65" ry="12" fill="#1b3a2a" />
          <ellipse cx="100" cy="180" rx="50" ry="8" fill="#2d7658" opacity="0.6" />

          {/* STAGE 0: Tiny sprout (<2m) */}
          {stage === 0 && (
            <g className="animate-fade-in">
              <path
                d="M100 176 Q100 162 98 152"
                stroke="#5eb08b"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M98 152 Q90 148 92 142 Q100 144 98 152Z"
                fill="#8eccaf"
              />
              <path
                d="M98 154 Q106 150 105 144 Q98 147 98 154Z"
                fill="#3d946f"
              />
            </g>
          )}

          {/* STAGE 1: Seedling (2-10m) */}
          {stage === 1 && (
            <g className="animate-fade-in">
              <path
                d="M100 176 Q100 145 99 125"
                stroke="#3d946f"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M99 145 Q85 138 88 126 Q100 134 99 145Z"
                fill="#5eb08b"
              />
              <path
                d="M99 135 Q115 128 112 118 Q100 126 99 135Z"
                fill="#3d946f"
              />
              <circle cx="99" cy="120" r="10" fill="#8eccaf" opacity="0.85" />
            </g>
          )}

          {/* STAGE 2: Young Sapling (10-25m) */}
          {stage === 2 && (
            <g className="animate-fade-in">
              <path
                d="M100 176 Q102 135 100 100"
                stroke="#2d7658"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M101 135 Q80 125 75 110"
                stroke="#2d7658"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M101 120 Q120 110 126 95"
                stroke="#2d7658"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="75" cy="108" r="14" fill="#3d946f" />
              <circle cx="126" cy="95" r="16" fill="#5eb08b" />
              <circle cx="100" cy="90" r="22" fill="#8eccaf" />
            </g>
          )}

          {/* STAGE 3: Mature Tree (25-50m) */}
          {stage === 3 && (
            <g className="animate-fade-in">
              <path
                d="M100 176 Q103 125 100 80"
                stroke="#1e4c3a"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M100 130 Q70 115 55 95"
                stroke="#1e4c3a"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M100 110 Q130 95 145 78"
                stroke="#1e4c3a"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Dense Foliage */}
              <circle cx="55" cy="90" r="22" fill="#2d7658" />
              <circle cx="145" cy="75" r="24" fill="#3d946f" />
              <circle cx="85" cy="65" r="30" fill="#5eb08b" opacity="0.9" />
              <circle cx="115" cy="60" r="32" fill="#3d946f" opacity="0.95" />
              <circle cx="100" cy="50" r="28" fill="#8eccaf" />
            </g>
          )}

          {/* STAGE 4: Ancient Forge Pine (50+ min) */}
          {stage === 4 && (
            <g className="animate-fade-in">
              {/* Massive trunk */}
              <path
                d="M100 176 Q105 120 100 65"
                stroke="#183e30"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M100 125 Q60 110 40 85"
                stroke="#183e30"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M100 105 Q140 90 160 70"
                stroke="#183e30"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              {/* Pine tier cones & leafy crown */}
              <circle cx="40" cy="80" r="28" fill="#245e47" />
              <circle cx="160" cy="68" r="30" fill="#2d7658" />
              <circle cx="75" cy="55" r="36" fill="#3d946f" />
              <circle cx="125" cy="50" r="38" fill="#5eb08b" />
              <circle cx="100" cy="35" r="34" fill="#8eccaf" />
              {/* Glowing firefly / spark particles */}
              <circle cx="90" cy="40" r="3" fill="#ffffff" className="animate-pulse" />
              <circle cx="115" cy="48" r="2.5" fill="#bae1ce" className="animate-pulse" />
              <circle cx="150" cy="60" r="2" fill="#ffffff" className="animate-pulse" />
              <circle cx="50" cy="75" r="2" fill="#bae1ce" className="animate-pulse" />
            </g>
          )}
        </svg>

        {/* Floating badge */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-forest-950/80 backdrop-blur-md border border-forest-500/30 text-xs text-forest-300 font-semibold flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{stageName}</span>
        </div>
      </div>
    </div>
  );
}
