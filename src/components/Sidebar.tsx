import { useItineraryStore } from "@/store/useItineraryStore";
import { Trash2, GripVertical, ChevronLeft, Map as MapIcon, Save, FolderOpen, X, Play, MapPin, Navigation } from "lucide-react";
import { useState } from 'react';
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
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableStopItem({ stop, index, total, onRemove, onFocus, isDark }: { stop: any, index: number, total: number, onRemove: (id: string) => void, onFocus: (coords: [number, number]) => void, isDark: boolean }) {
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
        zIndex: isDragging ? 20 : 'auto',
        position: 'relative' as const,
    };

    // Determine icon based on position
    const isStart = index === 0;
    const isEnd = index === total - 1 && total > 1;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative pl-3 pr-2 py-2 border-b last:border-0 transition-colors ${isDragging ? 'opacity-50' : ''} ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
            onClick={() => onFocus(stop.coordinates)}
        >
            <div className="flex items-center gap-3">
                {/* Marker - Technical/Minimal */}
                <div className="shrink-0 relative">
                    <div className={`w-5 h-5 flex items-center justify-center font-mono text-[10px] font-bold rounded-sm border ${isStart
                        ? (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200')
                        : isEnd
                            ? (isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200')
                            : (isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200')
                        }`}>
                        {index + 1}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                        <h3 className={`font-semibold text-xs truncate leading-tight ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                            {stop.name}
                        </h3>
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className={`p-1 cursor-grab active:cursor-grabbing transition-opacity ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                            <GripVertical size={12} />
                        </div>
                    </div>
                </div>

                {/* Remove Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(stop.id);
                    }}
                    className={`shrink-0 p-1 transition-opacity ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const { stops, removeStop, setFocusedLocation, itinerary, reorderStops, tripConstraints, loadItinerary, theme, toggleTheme, toggleStoryMode } = useItineraryStore();
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

            setNotification({ message: "Trip saved!", type: 'success' });
            if (showTrips) {
                const trips = await dbService.getTrips();
                setSavedTrips(trips);
            }
        } catch (error) {
            setNotification({ message: "Failed to save.", type: 'error' });
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
        <div className="flex h-full items-start relative z-[1000] pointer-events-none">
            <div
                className={`h-[95vh] my-auto ml-4 rounded-xl flex flex-col pointer-events-auto transition-all duration-300 ease-in-out shadow-2xl z-50
                    ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-96'}
                    ${isDark ? 'bg-[#0f172a] border border-white/10 text-white shadow-black/50' : 'bg-white text-gray-900'}
                `}
                style={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#111827' // Force text color (gray-900 hex)
                }}
            >
                {/* Header */}
                <div className={`p-4 shrink-0 relative z-20 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}
                    style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className={`text-xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {tripConstraints.destination || "Itinerary"}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className={`flex rounded bg-gray-100 p-0.5 ${isDark ? 'bg-gray-800' : 'bg-[#f2f5f7]'}`}>
                                    {['Driving', 'Walking', 'Cycling'].map((mode) => (
                                        <button
                                            key={mode}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${mode === 'Driving'
                                                ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm')
                                                : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={handleSaveTrip} className={`p-2 rounded hover:bg-black/5 transition-colors ${isDark ? 'hover:bg-white/10 text-green-400' : 'text-green-600'}`} title="Save Trip">
                                <Save size={16} />
                            </button>
                            <button onClick={handleLoadTrips} className={`p-2 rounded hover:bg-black/5 transition-colors ${isDark ? 'hover:bg-white/10 text-blue-400' : 'text-blue-500'}`} title="My Trips">
                                <FolderOpen size={16} />
                            </button>
                        </div>
                    </div>

                    {!showTrips && <SearchBox />}

                    {notification && (
                        <div className={`mt-3 p-2 text-xs rounded text-center ${notification.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            {notification.message}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    {!showTrips ? (
                        <div className="p-2 pb-24">
                            {stops.length === 0 ? (
                                <div className={`text-center mt-12 px-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    <MapIcon size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Search for a place to add it to your trip.</p>
                                </div>
                            ) : (
                                <div className="space-y-0 relative">
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
                                                    total={stops.length}
                                                    onRemove={removeStop}
                                                    onFocus={setFocusedLocation}
                                                    isDark={isDark}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Saved Trips</h3>
                                <button onClick={() => setShowTrips(false)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {savedTrips.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8 text-sm">No saved trips.</p>
                                ) : (
                                    savedTrips.map(trip => (
                                        <div
                                            key={trip.id}
                                            onClick={() => loadTrip(trip.id)}
                                            className={`p-3 rounded-lg cursor-pointer border transition-all ${isDark ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700' : 'bg-white hover:border-blue-400 border-gray-200 shadow-sm'}`}
                                        >
                                            <h4 className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{trip.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(trip.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={`p-4 shrink-0 border-t ${isDark ? 'bg-[#0f172a] border-white/10' : 'bg-[#f9fafb] border-gray-200'}`}
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f9fafb' }}>

                    {/* Offline / Extra options */}
                    <div className={`flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <button className="hover:text-blue-500 hover:underline">Share</button>
                        <span>•</span>
                        <button className="hover:text-blue-500 hover:underline">Print</button>
                    </div>
                </div>
            </div>

            {/* Floating Controls (Outside Sidebar) */}
            <div className={`absolute top-4 left-4 h-12 flex items-center gap-2 pointer-events-auto transition-transform duration-300 ${isCollapsed ? 'translate-x-0' : 'translate-x-[384px]'}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    {isCollapsed ? <MapIcon size={18} /> : <ChevronLeft size={18} />}
                </button>

                {isCollapsed && (
                    <button
                        onClick={toggleTheme}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-indigo-600 hover:bg-gray-50'
                            }`}
                    >
                        {isDark ? "☀" : "☾"}
                    </button>
                )}
            </div>

            <div className={`absolute top-4 left-[440px] pointer-events-auto space-x-2 ${isCollapsed ? 'hidden' : 'block'}`}>
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full shadow-sm transition-colors ${isDark ? 'bg-transparent text-yellow-400 hover:bg-white/10' : 'bg-transparent text-indigo-600 hover:bg-black/5'
                        }`}
                    title="Toggle Theme"
                >
                    {isDark ? "☀" : "☾"}
                </button>
            </div>
        </div>
    );
}
