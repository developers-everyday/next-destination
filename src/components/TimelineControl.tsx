import { Play, Pause } from "lucide-react";
import React from "react";

interface TimelineControlProps {
    onStart: () => void;
    isStoryMode?: boolean;
}

export default function TimelineControl({ onStart, isStoryMode }: TimelineControlProps) {
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
                className={`
                    cursor-pointer !pointer-events-auto relative group flex items-center justify-center gap-2 px-6 h-16 rounded-full shadow-2xl transition-all duration-300 bg-blue-600 hover:bg-blue-500 text-white
                `}
            >
                {isStoryMode ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current" />}
                <span className="font-bold text-lg">
                    {isStoryMode ? "Exit Journey" : "Start Journey"}
                </span>
            </button>
        </div>
    );
}
