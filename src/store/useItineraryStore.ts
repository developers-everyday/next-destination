import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TripData } from '@/services/db';

export interface Stop {
    id: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
    dayIndex: number;
    notes?: string;
}

export interface ItineraryDay {
    day: number;
    narrative: string;
    stops: Stop[];
}

export interface TripConstraints {
    destination?: string;
    duration?: string;
    vibe?: string;
}

interface ItineraryState {
    stops: Stop[];
    focusedLocation: [number, number] | null; // [lng, lat]
    itinerary: ItineraryDay[];
    tripConstraints: TripConstraints;

    addStop: (stop: Omit<Stop, 'id'>) => void;
    removeStop: (id: string) => void;
    reorderStops: (startIndex: number, endIndex: number) => void;
    setFocusedLocation: (coordinates: [number, number]) => void;
    setItinerary: (itinerary: ItineraryDay[]) => void;
    setTripConstraints: (constraints: TripConstraints) => void;
    loadItinerary: (tripData: TripData) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useItineraryStore = create<ItineraryState>()(
    persist(
        (set) => ({
            stops: [],
            focusedLocation: null,
            itinerary: [],
            tripConstraints: {},
            theme: 'dark', // Default to dark/cinematic mode

            toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

            addStop: (stop) => set((state) => ({
                stops: [...state.stops, { ...stop, id: Math.random().toString(36).substring(7) }],
            })),

            removeStop: (id) => set((state) => ({
                stops: state.stops.filter((s) => s.id !== id),
                // Also remove from itinerary if present (optional complexity, keeping simple for now)
                itinerary: state.itinerary.map(day => ({
                    ...day,
                    stops: day.stops.filter(s => s.id !== id)
                }))
            })),

            reorderStops: (startIndex, endIndex) => set((state) => {
                const newStops = [...state.stops];
                const [removed] = newStops.splice(startIndex, 1);
                newStops.splice(endIndex, 0, removed);
                return { stops: newStops };
            }),

            setFocusedLocation: (coordinates) => set({ focusedLocation: coordinates }),

            setItinerary: (itinerary) => set({
                itinerary,
                // Flatten stops from itinerary to main stops list for map display
                stops: itinerary.flatMap(day => day.stops)
            }),

            setTripConstraints: (constraints) => set({ tripConstraints: constraints }),

            loadItinerary: (tripData) => set({
                stops: tripData.stops,
                itinerary: tripData.itinerary,
                tripConstraints: tripData.tripConstraints || {},
                focusedLocation: tripData.center || null
            })
        }),
        {
            name: 'vox-travel-storage',
            partialize: (state) => ({
                stops: state.stops,
                itinerary: state.itinerary,
                tripConstraints: state.tripConstraints,
                theme: state.theme
            }),
        }
    )
);
