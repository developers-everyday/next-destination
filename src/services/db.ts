import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Stop, ItineraryDay, TripConstraints } from '@/store/useItineraryStore';

export interface TripData {
    id: string;
    name: string;
    updatedAt: number;
    stops: Stop[];
    itinerary: ItineraryDay[];
    tripConstraints: TripConstraints;
    center?: [number, number];
    zoom?: number;
}

export type TripMetadata = Pick<TripData, 'id' | 'name' | 'updatedAt'>;

interface VoxTravelDB extends DBSchema {
    trips: {
        key: string;
        value: TripData;
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'vox-travel-db';
const DB_VERSION = 1;

class DBService {
    private dbPromise: Promise<IDBPDatabase<VoxTravelDB>>;

    constructor() {
        if (typeof window === 'undefined') {
            this.dbPromise = new Promise(() => { }); // Server-side dummy
        } else {
            this.dbPromise = openDB<VoxTravelDB>(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    const store = db.createObjectStore('trips', { keyPath: 'id' });
                    store.createIndex('by-date', 'updatedAt');
                },
            });
        }
    }

    async saveTrip(trip: TripData): Promise<string> {
        const db = await this.dbPromise;
        await db.put('trips', trip);
        return trip.id;
    }

    async getTrips(): Promise<TripMetadata[]> {
        const db = await this.dbPromise;
        const trips = await db.getAll('trips');
        return trips
            .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async loadTrip(id: string): Promise<TripData | undefined> {
        const db = await this.dbPromise;
        return db.get('trips', id);
    }

    async deleteTrip(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('trips', id);
    }
}

export const dbService = new DBService();
