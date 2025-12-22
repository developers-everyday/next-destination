import { Play, Pause } from "lucide-react";
import React from "react";

interface TimelineControlProps {
    onStart: () => void;
    isSimulating: boolean;
}

export default function TimelineControl({ onStart, isSimulating }: TimelineControlProps) {
    return (
        <div
            className="fixed z-[1000] flex gap-4"
            style={{
                position: 'fixed',
                bottom: '48px', // bottom-12
                right: '48px', // right-12
                zIndex: 9999
            }}
        >
            <button
                onClick={onStart}
                disabled={isSimulating}
                className={`
                    cursor-pointer !pointer-events-auto relative group flex items-center justify-center gap-2 px-6 h-16 rounded-full shadow-2xl transition-all duration-300 bg-blue-600 hover:bg-blue-500
                    ${isSimulating ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'text-white'}
                `}
            >
                {isSimulating ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current" />}
                <span className="font-bold text-lg">Start Drive</span>
            </button>
        </div>
    );
}
