"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import NetworkSpecs from "@/components/NetworkSpecs";
import FeaturesSection from "@/components/FeaturesSection";
import TokenomicsSection from "@/components/TokenomicsSection";
import MainnetStatus from "@/components/MainnetStatus";
import RoadmapSection from "@/components/RoadmapSection";
import MiningSection from "@/components/MiningSection";
import DownloadSection from "@/components/DownloadSection";
import RunNodeSection from "@/components/RunNodeSection";
import ExplorerPreview from "@/components/ExplorerPreview";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <HeroSection />
      <StatsBar />
      <NetworkSpecs />
      <FeaturesSection />
      <TokenomicsSection />
      <MainnetStatus />
      <RoadmapSection />
      <MiningSection />
      <RunNodeSection />
      <ExplorerPreview />
      <DownloadSection />
    </>
  );
}