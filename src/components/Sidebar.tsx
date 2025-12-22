"use client";

import { useItineraryStore } from "@/store/useItineraryStore";
import { Trash2, GripVertical } from "lucide-react";
import { useMemo } from 'react';

export default function Sidebar() {
    const { stops, removeStop, setFocusedLocation, itinerary } = useItineraryStore();

    const groupedStops = useMemo(() => {
        // Group stops by day for future expansion, currently showing flat list
        return stops;
    }, [stops]);

    return (
        <div
            className="w-full h-full rounded-xl overflow-hidden flex flex-col pointer-events-auto"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white'
            }}
        >
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <h2 className="text-xl font-bold" style={{ color: '#60a5fa' }}>
                    Itinerary
                </h2>
                <p className="text-xs" style={{ color: '#9ca3af', marginTop: '4px' }}>
                    {itinerary.length > 0 ? `${itinerary.length} Days Planned` : `${stops.length} stops planned`}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {itinerary.length > 0 ? (
                    itinerary.map((day) => (
                        <div key={day.day} className="space-y-3">
                            <h3 className="font-bold text-lg text-blue-400 border-b border-gray-700 pb-1">Day {day.day}</h3>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{day.narrative}</p>
                            <div className="space-y-2 pl-2 border-l-2 border-gray-800">
                                {day.stops.map((stop, index) => (
                                    <div
                                        key={stop.id}
                                        className="group p-2 rounded flex items-center gap-3 transition-all cursor-pointer hover:bg-white/5"
                                        onClick={() => setFocusedLocation(stop.coordinates)}
                                    >
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-blue-500/20 text-blue-400">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-white truncate">{stop.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : stops.length === 0 ? (
                    <div className="text-center mt-10" style={{ color: '#6b7280' }}>
                        <p>No stops yet.</p>
                        <p className="text-sm mt-2">"Take me to Paris"</p>
                    </div>
                ) : (
                    stops.map((stop, index) => (
                        <div
                            key={stop.id}
                            className="group p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                marginBottom: '12px'
                            }}
                            onClick={() => setFocusedLocation(stop.coordinates)}
                        >
                            <div style={{ color: '#9ca3af', cursor: 'grab' }}>
                                <GripVertical size={16} />
                            </div>

                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate" style={{ color: 'white' }}>{stop.name}</h3>
                                <p className="text-xs" style={{ color: '#9ca3af' }}>Day {stop.dayIndex || 1}</p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeStop(stop.id);
                                }}
                                className="p-1 opacity-100"
                                style={{ color: '#ef4444' }}
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
