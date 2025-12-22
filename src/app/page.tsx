"use client";

import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import VoiceAgent from "@/components/VoiceAgent";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Map Background */}
      <div className="absolute inset-0 z-0">
        <Map />
      </div>

      {/* Floating UI Layer */}
      <div className="relative z-10 pointer-events-none w-full h-full flex">
        {/* Sidebar (Left) */}
        <div className="pointer-events-auto w-auto h-full p-4 z-40">
          <Sidebar />
        </div>

        {/* Voice Agent Overlay (Bottom Center or floating) */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <VoiceAgent />
        </div>
      </div>
    </main>
  );
}
