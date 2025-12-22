import { useItineraryStore } from "@/store/useItineraryStore";
import { Trash2, GripVertical, ChevronLeft, ChevronRight, Map as MapIcon } from "lucide-react";
import { useMemo, useState } from 'react';
import SearchBox from "./SearchBox";
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

function SortableStopItem({ stop, index, onRemove, onFocus }: { stop: any, index: number, onRemove: (id: string) => void, onFocus: (coords: [number, number]) => void }) {
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
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '12px'
            }}
            className={`group p-3 rounded-lg flex items-center gap-3 transition-colors ${isDragging ? 'bg-black/80 ring-2 ring-blue-500' : ''}`}
            onClick={() => onFocus(stop.coordinates)}
        >
            <div
                {...attributes}
                {...listeners}
                style={{ color: '#9ca3af', cursor: 'grab', touchAction: 'none' }}
                className="hover:text-white"
            >
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
                    onRemove(stop.id);
                }}
                className="p-1 opacity-100 hover:bg-white/10 rounded"
                style={{ color: '#ef4444' }}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

export default function Sidebar() {
    const { stops, removeStop, setFocusedLocation, itinerary, reorderStops } = useItineraryStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

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

    return (
        <div className="flex h-full items-start">
            <div
                className={`h-full rounded-xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 border-0 p-0' : 'w-80 rounded-xl border border-white/10'}`}
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
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

                <div className="px-4 pt-4">
                    <SearchBox />
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
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-2 mt-4 p-2 bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/20 hover:bg-black transition-all shadow-xl pointer-events-auto"
                title={isCollapsed ? "Expand Itinerary" : "Collapse Itinerary"}
            >
                {isCollapsed ? <MapIcon size={20} /> : <ChevronLeft size={20} />}
            </button>
        </div>
    );
}
