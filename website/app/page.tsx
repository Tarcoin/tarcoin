"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import NetworkSpecs from "@/components/NetworkSpecs";
import FeaturesSection from "@/components/FeaturesSection";
import TokenomicsSection from "@/components/TokenomicsSection";
import MainnetStatus from "@/components/MainnetStatus";
import RoadmapSection from "@/components/RoadmapSection";
import MiningSection from "@/components/MiningSection";
import DownloadSection from "@/components/DownloadSection";
import ExplorerPreview from "@/components/ExplorerPreview";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-tarcoin-black flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg">
        <Navbar />
        <HeroSection />
        <StatsBar />
        <NetworkSpecs />
        <FeaturesSection />
        <TokenomicsSection />
        <MainnetStatus />
        <RoadmapSection />
        <MiningSection />
        <ExplorerPreview />
        <DownloadSection />
        <Footer />
        <ScrollToTop />
      </div>
    </main>
  );
}