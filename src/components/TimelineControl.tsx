import { Play, Pause } from "lucide-react";
import React from "react";

interface TimelineControlProps {
    onStart: () => void;
    isSimulating: boolean;
}

export default function TimelineControl({ onStart, isSimulating }: TimelineControlProps) {
    return (
        <div className="absolute bottom-10 right-4 z-10 flex gap-4">
            <button
                onClick={onStart}
                disabled={isSimulating}
                className={`
                    flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all
                    ${isSimulating
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:scale-105 border border-cyan-400'}
                `}
            >
                {isSimulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                {isSimulating ? "Driving..." : "Start Drive"}
            </button>
        </div>
    );
}
