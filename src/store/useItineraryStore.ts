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

    // Story Mode
    isStoryMode: boolean;
    activeDayIndex: number;
    activeActivityIndex: number;
    toggleStoryMode: () => void;
    nextStop: () => void;
    prevStop: () => void;

    startJourney: () => void;
    stopJourney: () => void;
    resetTrip: () => void;
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

            addStop: (stop) => set((state) => {
                const newStop = { ...stop, id: Math.random().toString(36).substring(7) };

                // Sync with Itinerary (Default to Day 1)
                const newItinerary = [...state.itinerary];
                if (newItinerary.length === 0) {
                    newItinerary.push({ day: 1, narrative: "Day 1", stops: [] });
                }
                const dayIndex = stop.dayIndex ? stop.dayIndex - 1 : 0;
                if (!newItinerary[dayIndex]) {
                    newItinerary[dayIndex] = { day: dayIndex + 1, narrative: `Day ${dayIndex + 1}`, stops: [] };
                }
                newItinerary[dayIndex].stops.push(newStop);

                return {
                    stops: [...state.stops, newStop],
                    itinerary: newItinerary
                };
            }),

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

                // Sync Itinerary
                const newItinerary: ItineraryDay[] = [];
                newStops.forEach(stop => {
                    const day = stop.dayIndex || 1;
                    let dayGroup = newItinerary.find(d => d.day === day);
                    if (!dayGroup) {
                        dayGroup = { day, narrative: `Day ${day}`, stops: [] };
                        newItinerary.push(dayGroup);
                    }
                    dayGroup.stops.push(stop);
                });
                newItinerary.sort((a, b) => a.day - b.day);

                return { stops: newStops, itinerary: newItinerary };
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
            }),

            // Story Mode Implementation
            isStoryMode: false,
            activeDayIndex: 0,
            activeActivityIndex: 0,

            toggleStoryMode: () => set((state) => ({
                isStoryMode: !state.isStoryMode,
                activeDayIndex: 0,
                activeActivityIndex: 0
            })),

            nextStop: () => set((state) => {
                const currentDay = state.itinerary[state.activeDayIndex];
                if (!currentDay) return state; // Safety check

                // Check if there are more stops in the current day
                if (state.activeActivityIndex < currentDay.stops.length - 1) {
                    return { activeActivityIndex: state.activeActivityIndex + 1 };
                }
                // Move to next day
                else if (state.activeDayIndex < state.itinerary.length - 1) {
                    return {
                        activeDayIndex: state.activeDayIndex + 1,
                        activeActivityIndex: 0
                    };
                }
                // End of trip
                return state;
            }),

            prevStop: () => set((state) => {
                // If not at the first stop of the day
                if (state.activeActivityIndex > 0) {
                    return { activeActivityIndex: state.activeActivityIndex - 1 };
                }
                // If we can go back to previous day
                else if (state.activeDayIndex > 0) {
                    const prevDay = state.itinerary[state.activeDayIndex - 1];
                    return {
                        activeDayIndex: state.activeDayIndex - 1,
                        activeActivityIndex: prevDay.stops.length > 0 ? prevDay.stops.length - 1 : 0
                    };
                }
                return state;
            }),

            // Unified Journey Control
            // Unified Journey Control
            startJourney: () => set(() => ({
                isStoryMode: true,
                activeDayIndex: 0,
                activeActivityIndex: 0
            })),
            stopJourney: () => set(() => ({
                isStoryMode: false,
            })),

            resetTrip: () => set({
                stops: [],
                itinerary: [],
                tripConstraints: {},
                focusedLocation: null,
                isStoryMode: false,
                activeDayIndex: 0,
                activeActivityIndex: 0
            }),

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
