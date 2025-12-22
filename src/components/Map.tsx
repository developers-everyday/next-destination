"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, Layer, Source, MapRef, GeolocateControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useItineraryStore } from "@/store/useItineraryStore";
import { MapPin } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent() {
    const mapRef = useRef<MapRef>(null);
    const { stops, focusedLocation, addStop, theme } = useItineraryStore();

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
                pitch: 60,
                essential: true,
            });
        }
    }, [focusedLocation]);

    // Get User's Current Location
    const onMapLoad = () => {
        console.log("Map loaded, checking geolocation...");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("Flying to user location:", position.coords);
                    if (mapRef.current) {
                        mapRef.current.flyTo({
                            center: [position.coords.longitude, position.coords.latitude],
                            zoom: 14,
                            pitch: 60,
                            essential: true,
                            duration: 2000
                        });
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }
    };

    const handleMapClick = async (event: any) => {
        const { lng, lat } = event.lngLat;
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
            );
            const data = await response.json();
            const placeName = data.features?.[0]?.text || "Pinned Location";

            addStop({
                name: placeName,
                coordinates: [lng, lat],
                dayIndex: 1
            });
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            // Fallback
            addStop({
                name: "Pinned Location",
                coordinates: [lng, lat],
                dayIndex: 1
            });
        }
    };

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

    const isDark = theme === 'dark';

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 2.3522, // Paris
                    latitude: 48.8566,
                    zoom: 12,
                    pitch: 60, // Initial pitch for 3D view
                }}
                onLoad={onMapLoad}
                onClick={handleMapClick}
                style={{ width: "100%", height: "100%" }}
                mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v11"}
                mapboxAccessToken={MAPBOX_TOKEN}
                projection={'globe' as any}
                fog={isDark ? {
                    "range": [0.5, 10],
                    "color": "rgba(255, 255, 255, 0.2)", // Slight atmospheric haze
                    "horizon-blend": 0.3,
                    "high-color": "#245bde",
                    "space-color": "#000000",
                    "star-intensity": 0.8
                } as any : undefined}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            >
                <Source
                    id="mapbox-dem"
                    type="raster-dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                    maxzoom={14}
                />

                <GeolocateControl position="top-left" />

                {/* 3D Buildings Layer */}
                <Layer
                    id="3d-buildings"
                    source="composite"
                    source-layer="building"
                    filter={['==', 'extrude', 'true']}
                    type="fill-extrusion"
                    minzoom={15}
                    paint={{
                        'fill-extrusion-color': isDark ? '#aaa' : '#ddd',
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }}
                />

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
                                "line-color": isDark ? "#00F0FF" : "#3b82f6", // Neon Cyan vs Blue
                                "line-width": 6,
                                "line-opacity": 0.9,
                                "line-blur": isDark ? 3 : 0, // Glow effect only in dark mode
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
                            <div className={`p-2 rounded-full border-2 border-white ${isDark ? 'bg-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.7)] animate-pulse' : 'bg-blue-600 shadow-lg'}`}>
                                <MapPin className={`${isDark ? 'text-black' : 'text-white'} w-5 h-5`} />
                            </div>
                            <span className={`mt-1 text-xs font-bold px-2 py-1 rounded backdrop-blur-sm ${isDark ? 'bg-black/80 text-cyan-300 border border-cyan-500/30' : 'bg-white/90 text-blue-700 shadow-sm'}`}>
                                {index + 1}. {stop.name}
                            </span>
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}
