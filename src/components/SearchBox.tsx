"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
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
            dayIndex: 1, // Default to Day 1 for now, or we could ask
        });
        setQuery("");
        setResults([]);
        setIsOpen(false);
    };

    const isDark = theme === 'dark';

    return (
        <div ref={wrapperRef} className="relative w-full mb-4 z-50">
            <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Add a place..."
                    className={`w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${isDark
                        ? 'bg-white/10 border-white/10 text-white placeholder-gray-500'
                        : 'bg-black/5 border-black/10 text-black placeholder-gray-500'}`}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 h-4 w-4 animate-spin" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 backdrop-blur-xl border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}`}>
                    {results.map((place) => (
                        <button
                            key={place.id}
                            onClick={() => handleSelect(place)}
                            className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3 group border-b last:border-0 ${isDark
                                ? 'hover:bg-white/10 border-white/5'
                                : 'hover:bg-black/5 border-black/5'}`}
                        >
                            <MapPin className={`h-4 w-4 mt-1 transition-colors ${isDark ? 'text-gray-500 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'}`} />
                            <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black'}`}>
                                    {place.text}
                                </p>
                                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
