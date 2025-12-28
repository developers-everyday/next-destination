"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useItineraryStore } from "@/store/useItineraryStore";
import { dbService, TripMetadata } from "@/services/db";
import SettingsModal from "@/components/SettingsModal";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Settings, Map as MapIcon, RotateCw, Plus, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { resetTrip, loadItinerary, theme } = useItineraryStore();
  const { setSettingsOpen } = useSettingsStore();

  const [savedTrips, setSavedTrips] = useState<TripMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved trips on mount
    const loadTrips = async () => {
      try {
        const trips = await dbService.getTrips();
        setSavedTrips(trips);
      } catch (error) {
        console.error("Failed to load trips", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrips();
  }, []);

  const handleStartNew = () => {
    resetTrip();
    router.push("/map");
  };

  const handleLoadTrip = async (id: string) => {
    const trip = await dbService.loadTrip(id);
    if (trip) {
      loadItinerary(trip);
      router.push("/map");
    }
  };

  const isDark = theme === 'dark';

  return (
    <main className={`relative w-screen h-screen overflow-hidden flex flex-col ${isDark ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 z-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-600'} text-white`}>
            <MapIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">NextDestination</h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isDark ? 'border-white/10 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-100'}`}
        >
          <Settings size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </header>

      {/* Hero Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-7xl mx-auto px-8 py-12 flex flex-col gap-16">

          {/* Welcome / Start New */}
          <section className="flex flex-col gap-6 items-start max-w-2xl">
            <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
              Where to next?
            </h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Plan your next adventure with our AI-powered travel companion. Create detailed itineraries, explore standard maps, and visualize your journey in 3D.
            </p>

            <button
              onClick={handleStartNew}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              <Plus size={20} />
              Start New Journey
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
          </section>

          {/* Saved Journeys Grid */}
          <section className="w-full">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-2xl font-bold">Your Saved Stash</h3>
              <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-48 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                ))}
              </div>
            ) : savedTrips.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-2xl ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <RotateCw size={32} className="opacity-40" />
                </div>
                <p className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  You haven't saved any journeys yet. Start a new one to build your stash!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTrips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleLoadTrip(trip.id)}
                    className={`group relative flex flex-col items-start text-left h-48 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark
                        ? 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10'
                        : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${isDark ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <MapIcon size={24} />
                    </div>
                    <h4 className="text-xl font-bold mb-2 line-clamp-1">{trip.name}</h4>
                    <p className={`text-sm mb-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last updated: {new Date(trip.updatedAt).toLocaleDateString()}
                    </p>
                    <div className={`flex items-center gap-2 text-sm font-semibold mt-4 transition-colors ${isDark ? 'text-blue-400 group-hover:text-white' : 'text-blue-600 group-hover:text-blue-700'}`}>
                      Resume Journey <ArrowRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <SettingsModal />
    </main>
  );
}
