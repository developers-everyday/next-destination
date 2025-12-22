import { create } from 'zustand';

export interface Stop {
    id: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
    dayIndex: number;
    notes?: string;
}

interface ItineraryState {
    stops: Stop[];
    focusedLocation: [number, number] | null; // [lng, lat]

    addStop: (stop: Omit<Stop, 'id'>) => void;
    removeStop: (id: string) => void;
    reorderStops: (startIndex: number, endIndex: number) => void;
    setFocusedLocation: (coordinates: [number, number]) => void;
}

export const useItineraryStore = create<ItineraryState>((set) => ({
    stops: [],
    focusedLocation: null,

    addStop: (stop) => set((state) => ({
        stops: [...state.stops, { ...stop, id: Math.random().toString(36).substring(7) }],
    })),

    removeStop: (id) => set((state) => ({
        stops: state.stops.filter((s) => s.id !== id),
    })),

    reorderStops: (startIndex, endIndex) => set((state) => {
        const newStops = [...state.stops];
        const [removed] = newStops.splice(startIndex, 1);
        newStops.splice(endIndex, 0, removed);
        return { stops: newStops };
    }),

    setFocusedLocation: (coordinates) => set({ focusedLocation: coordinates }),
}));
