import { useItineraryStore } from "@/store/useItineraryStore";
import { Trash2, GripVertical, ChevronLeft, Map as MapIcon, Save, FolderOpen, X } from "lucide-react";
import { useMemo, useState, useEffect } from 'react';
import SearchBox from "./SearchBox";
import { dbService, TripMetadata } from "@/services/db";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableStopItem({ stop, index, onRemove, onFocus, isDark }: { stop: any, index: number, onRemove: (id: string) => void, onFocus: (coords: [number, number]) => void, isDark: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                marginBottom: '12px'
            }}
            className={`group p-3 rounded-lg flex items-center gap-3 transition-colors ${isDragging ? 'bg-black/80 ring-2 ring-blue-500' : ''}`}
            onClick={() => onFocus(stop.coordinates)}
        >
            <div
                {...attributes}
                {...listeners}
                style={{ color: isDark ? '#9ca3af' : '#6b7280', cursor: 'grab', touchAction: 'none' }}
                className={isDark ? "hover:text-white" : "hover:text-black"}
            >
                <GripVertical size={16} />
            </div>

            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)', color: '#60a5fa' }}>
                {index + 1}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate" style={{ color: isDark ? 'white' : '#1f2937' }}>{stop.name}</h3>
                <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Day {stop.dayIndex || 1}</p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(stop.id);
                }}
                className={`p-1 opacity-100 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                style={{ color: '#ef4444' }}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

export default function Sidebar() {
    const { stops, removeStop, setFocusedLocation, itinerary, reorderStops, tripConstraints, loadItinerary, theme, toggleTheme } = useItineraryStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showTrips, setShowTrips] = useState(false);
    const [savedTrips, setSavedTrips] = useState<TripMetadata[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = stops.findIndex((stop) => stop.id === active.id);
            const newIndex = stops.findIndex((stop) => stop.id === over?.id);
            reorderStops(oldIndex, newIndex);
        }
    };

    const handleSaveTrip = async () => {
        try {
            if (stops.length === 0) {
                setNotification({ message: "Add some stops first!", type: 'error' });
                return;
            }

            const tripId = crypto.randomUUID();
            await dbService.saveTrip({
                id: tripId,
                name: tripConstraints.destination || `My Trip to ${stops[0].name}`,
                updatedAt: Date.now(),
                stops,
                itinerary,
                tripConstraints,
                center: stops.length > 0 ? stops[0].coordinates : undefined
            });

            setNotification({ message: "Trip saved successfully!", type: 'success' });
            // Refresh trips list if open
            if (showTrips) {
                const trips = await dbService.getTrips();
                setSavedTrips(trips);
            }
        } catch (error) {
            console.error('Failed to save trip:', error);
            setNotification({ message: "Failed to save trip.", type: 'error' });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLoadTrips = async () => {
        setShowTrips(true);
        const trips = await dbService.getTrips();
        setSavedTrips(trips);
    };

    const loadTrip = async (id: string) => {
        const trip = await dbService.loadTrip(id);
        if (trip) {
            loadItinerary(trip);
            setShowTrips(false);
            setNotification({ message: "Trip loaded!", type: 'success' });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const deleteTrip = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await dbService.deleteTrip(id);
        const trips = await dbService.getTrips();
        setSavedTrips(trips);
    };

    const isDark = theme === 'dark';

    return (
        <div className="flex h-full items-start relative">
            <div
                className={`h-full rounded-2xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 border-0 p-0' : 'w-80 m-4 shadow-2xl'}`}
                style={{
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(24px)',
                    color: isDark ? 'white' : 'black',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)'
                }}
            >
                {/* Header */}
                <div className="p-4 flex flex-col gap-2" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center justify-between">
                        <h2 className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {tripConstraints.destination || "Itinerary"}
                        </h2>
                        <div className="flex gap-1">
                            <button onClick={handleSaveTrip} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-green-400' : 'hover:bg-black/5 text-green-600'}`} title="Save Trip">
                                <Save size={18} />
                            </button>
                            <button onClick={handleLoadTrips} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-blue-400' : 'hover:bg-black/5 text-blue-500'}`} title="My Trips">
                                <FolderOpen size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                        {itinerary.length > 0 ? `${itinerary.length} Days Planned` : `${stops.length} stops planned`}
                    </p>
                </div>

                {notification && (
                    <div className={`mx-4 mt-2 p-2 text-xs rounded text-center ${notification.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {notification.message}
                    </div>
                )}

                {!showTrips ? (
                    <>
                        <div className="px-4 pt-4">
                            <SearchBox />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {itinerary.length > 0 ? (
                                itinerary.map((day) => (
                                    <div key={day.day} className="space-y-3">
                                        <h3 className={`font-bold text-lg border-b pb-1 ${isDark ? 'text-blue-400 border-gray-700' : 'text-blue-600 border-gray-200'}`}>Day {day.day}</h3>
                                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{day.narrative}</p>
                                        <div className={`space-y-2 pl-2 border-l-2 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                                            {day.stops.map((stop, index) => (
                                                <div
                                                    key={stop.id}
                                                    className={`group p-2 rounded flex items-center gap-3 transition-all cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                                                    onClick={() => setFocusedLocation(stop.coordinates)}
                                                >
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{stop.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : stops.length === 0 ? (
                                <div className="text-center mt-10" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                                    <p>No stops yet.</p>
                                    <p className="text-sm mt-2">"Take me to Paris"</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={stops.map(s => s.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {stops.map((stop, index) => (
                                            <SortableStopItem
                                                key={stop.id}
                                                stop={stop}
                                                index={index}
                                                onRemove={removeStop}
                                                onFocus={setFocusedLocation}
                                                isDark={isDark}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Stored Trips</h3>
                            <button onClick={() => setShowTrips(false)} className={`p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {savedTrips.length === 0 ? (
                                <p className="text-gray-500 text-center text-sm py-4">No saved trips yet.</p>
                            ) : (
                                savedTrips.map(trip => (
                                    <div
                                        key={trip.id}
                                        onClick={() => loadTrip(trip.id)}
                                        className={`p-3 rounded-lg cursor-pointer border transition-colors group relative ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/5' : 'bg-white/50 hover:bg-white/80 border-gray-200 shadow-sm'}`}
                                    >
                                        <h4 className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{trip.name}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(trip.updatedAt).toLocaleDateString()}</p>
                                        <button
                                            onClick={(e) => deleteTrip(e, trip.id)}
                                            className="absolute right-2 top-2 p-1.5 rounded-md text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                            title="Delete Trip"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 ml-2 mt-4 pointer-events-auto">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-lg backdrop-blur-md border shadow-xl transition-all ${isDark ? 'bg-black/80 text-white border-white/20 hover:bg-black' : 'bg-white/80 text-black border-white/60 hover:bg-white'}`}
                    title={isCollapsed ? "Expand Itinerary" : "Collapse Itinerary"}
                >
                    {isCollapsed ? <MapIcon size={20} /> : <ChevronLeft size={20} />}
                </button>

                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg backdrop-blur-md border shadow-xl transition-all ${isDark ? 'bg-black/80 text-yellow-400 border-white/20 hover:bg-black' : 'bg-white/80 text-indigo-600 border-white/60 hover:bg-white'}`}
                    title="Toggle Theme"
                >
                    {isDark ? "☀" : "☾"}
                </button>
            </div>
        </div>
    );
}
