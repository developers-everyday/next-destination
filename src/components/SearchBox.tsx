"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { useItineraryStore } from "@/store/useItineraryStore";

export default function SearchBox() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { addStop, theme } = useItineraryStore();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (value: string) => {
        setQuery(value);
        if (value.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!mapboxToken) throw new Error("Missing Mapbox Token");

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&types=place,poi,address&limit=5`
            );
            const data = await response.json();
            setResults(data.features || []);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (place: any) => {
        addStop({
            name: place.text,
            coordinates: place.center, // [lng, lat]
            dayIndex: 1, // Default to Day 1 for now
        });
        setQuery("");
        setResults([]);
        setIsOpen(false);
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
    };

    const isDark = theme === 'dark';

    return (
        <div ref={wrapperRef} className="relative w-full mb-4 z-50">
            <div className="mb-1 flex items-center justify-between">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Add Stop
                </label>
                {query && (
                    <button onClick={clearSearch} className="text-[10px] text-blue-500 font-bold hover:underline">
                        Clear
                    </button>
                )}
            </div>

            <div className="relative group w-full">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for a location..."
                    className={`w-full max-w-full box-border rounded px-2 py-1.5 text-xs font-mono focus:outline-none transition-all ${isDark
                        ? 'bg-[#1e293b] text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500/50'
                        : 'bg-[#f2f5f7] text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200'}`}
                    style={{
                        color: isDark ? 'white' : '#111827',
                        boxSizing: 'border-box'
                    }}
                />
                {isLoading && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3 animate-spin" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-md shadow-lg overflow-hidden border z-50 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                    {results.map((place) => (
                        <button
                            key={place.id}
                            onClick={() => handleSelect(place)}
                            className={`w-full px-3 py-2 text-left transition-colors flex items-start gap-2 border-b last:border-0 ${isDark
                                ? 'hover:bg-white/5 border-gray-700'
                                : 'hover:bg-gray-50 border-gray-100'}`}
                        >
                            <div className={`mt-0.5 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <MapPin size={12} />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                    {place.text}
                                </p>
                                <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {place.place_name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
