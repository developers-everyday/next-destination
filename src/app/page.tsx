"use client";

import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import VoiceAgent from "@/components/VoiceAgent";
import StoryOverlay from "@/components/StoryOverlay";
import { useItineraryStore } from "@/store/useItineraryStore";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Map Background */}
      <div className="absolute inset-0 z-0">
        <Map />
      </div>

      <OverlayWrapper />
    </main>
  );
}

function OverlayWrapper() {
  const { isStoryMode } = useItineraryStore();

  return (
    <div className="relative z-10 pointer-events-none w-full h-full flex">
      {/* Sidebar (Left) or Story Mode HUD (Bottom) */}
      {!isStoryMode ? (
        <div className="pointer-events-auto w-auto h-full p-4 z-40">
          <Sidebar />
        </div>
      ) : (
        <StoryOverlay />
      )}

      {/* Voice Agent Overlay (Bottom Center or floating) */}
      {/* If in Story Mode, Voice Agent might need adjusting, usually HUD takes bottom center. 
          Assuming VoiceAgent floats above or user is fine with overlap. 
          Actually user prompt didn't specify Voice Agent position change, but HUD is bottom-10.
          VoiceAgent is bottom-32. They probably stack okay. active z-index might matter.
      */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <VoiceAgent />
      </div>
    </div>
  );
}
