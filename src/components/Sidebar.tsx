"use client";

import { useItineraryStore } from "@/store/useItineraryStore";
import { Trash2, GripVertical } from "lucide-react";
import { useMemo } from 'react';

export default function Sidebar() {
    const { stops, removeStop, setFocusedLocation } = useItineraryStore();

    const groupedStops = useMemo(() => {
        // Group stops by day for future expansion, currently showing flat list
        return stops;
    }, [stops]);

    return (
        <div className="w-full h-full bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Itinerary
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                    {stops.length} stops planned
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {stops.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No stops yet.</p>
                        <p className="text-sm mt-2">"Take me to Paris"</p>
                    </div>
                ) : (
                    stops.map((stop, index) => (
                        <div
                            key={stop.id}
                            className="group bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 flex items-center gap-3 transition-all cursor-pointer"
                            onClick={() => setFocusedLocation(stop.coordinates)}
                        >
                            <div className="text-gray-500 cursor-grab active:cursor-grabbing">
                                <GripVertical size={16} />
                            </div>

                            <div className="bg-blue-600/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{stop.name}</h3>
                                <p className="text-xs text-gray-400">Day {stop.dayIndex || 1}</p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeStop(stop.id);
                                }}
                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
