import path from "path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const projectRoot = path.resolve(__dirname);

export default function nextConfig(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    outputFileTracingRoot: projectRoot,
    turbopack: {
      root: projectRoot,
    },
  };
}
