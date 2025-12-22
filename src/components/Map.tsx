"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, Layer, Source, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useItineraryStore } from "@/store/useItineraryStore";
import { MapPin } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent() {
    const mapRef = useRef<MapRef>(null);
    const { stops, focusedLocation } = useItineraryStore();

    useEffect(() => {
        if (!MAPBOX_TOKEN) {
            console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
            alert("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
        }
    }, []);

    useEffect(() => {
        if (focusedLocation && mapRef.current) {
            mapRef.current.flyTo({
                center: focusedLocation,
                zoom: 14,
                essential: true,
            });
        }
    }, [focusedLocation]);

    if (!MAPBOX_TOKEN) {
        return <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">Mapbox Token Missing</div>;
    }

    // Create GeoJSON for the route line
    const routeGeoJSON = {
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates: stops.map((stop) => stop.coordinates),
        },
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 2.3522, // Paris
                    latitude: 48.8566,
                    zoom: 12,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                {/* Render Route Line */}
                {stops.length > 1 && (
                    <Source type="geojson" data={routeGeoJSON as any}>
                        <Layer
                            id="route"
                            type="line"
                            layout={{
                                "line-join": "round",
                                "line-cap": "round",
                            }}
                            paint={{
                                "line-color": "#3b82f6", // Blue color
                                "line-width": 4,
                                "line-opacity": 0.8,
                            }}
                        />
                    </Source>
                )}

                {/* Render Markers */}
                {stops.map((stop, index) => (
                    <Marker
                        key={stop.id}
                        longitude={stop.coordinates[0]}
                        latitude={stop.coordinates[1]}
                        anchor="bottom"
                    >
                        <div className="flex flex-col items-center">
                            <div className="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white">
                                <MapPin className="text-white w-5 h-5" />
                            </div>
                            <span className="mt-1 text-xs font-bold bg-black/80 text-white px-2 py-1 rounded">
                                {index + 1}. {stop.name}
                            </span>
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}
