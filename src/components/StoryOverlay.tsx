"use client";

import { useItineraryStore } from "@/store/useItineraryStore";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { useEffect, useState } from "react";

export default function StoryOverlay() {
    const {
        itinerary,
        activeDayIndex,
        activeActivityIndex,
        nextStop,
        prevStop,
        toggleStoryMode,
        setFocusedLocation
    } = useItineraryStore();

    // Safety check - if no itinerary active
    const day = itinerary[activeDayIndex];
    if (!day) return null; // Or show loading/placeholder

    const stop = day.stops[activeActivityIndex];
    if (!stop) return null;

    // Simulate time based on index (start 9 AM, +2 hours per stop)
    const time = `${9 + (activeActivityIndex * 2)}:00 ${activeActivityIndex * 2 + 9 >= 12 ? 'PM' : 'AM'}`;

    // Effect to focus map when stop changes
    useEffect(() => {
        if (stop && stop.coordinates) {
            setFocusedLocation(stop.coordinates);
        }
    }, [activeDayIndex, activeActivityIndex, stop, setFocusedLocation]);

    return (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg pointer-events-auto">
            <div className="bg-[#0b1121]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 text-white transition-all duration-500 animate-in slide-in-from-bottom-5 fade-in">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50">
                        Day {activeDayIndex + 1} • {time}
                    </span>
                    <button
                        onClick={toggleStoryMode}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                        title="Exit Story Mode"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold mb-3 leading-tight text-white drop-shadow-lg">{stop.name}</h2>
                    <p className="text-gray-300 italic text-base max-w-sm mx-auto">
                        {stop.notes || day.narrative || "Explore this amazing location."}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={prevStop}
                        disabled={activeDayIndex === 0 && activeActivityIndex === 0}
                        className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        title="Previous Stop"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={toggleStoryMode}
                        className="px-6 py-4 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 text-xs font-bold uppercase tracking-wider transition-all hover:border-red-500/50 hover:text-red-400"
                    >
                        Exit
                    </button>

                    <button
                        onClick={nextStop}
                        disabled={activeDayIndex === itinerary.length - 1 && activeActivityIndex === day.stops.length - 1}
                        className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:shadow-[0_0_50px_rgba(37,99,235,0.7)] hover:scale-105 active:scale-95 text-lg"
                    >
                        Next <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
