"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Marker, Layer, Source, MapRef, GeolocateControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useItineraryStore } from "@/store/useItineraryStore";
import { MapPin } from "lucide-react";
import TimelineControl from "./TimelineControl";
import PassportPin from "./PassportPin";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent() {
    const mapRef = useRef<MapRef>(null);
    const { stops, focusedLocation, addStop, theme, startJourney, stopJourney, isStoryMode } = useItineraryStore();

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
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                    longitude: -74.006,
                    latitude: 40.7128,
                    zoom: 12,
                    pitch: 60,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle={theme === 'dark' ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12"}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
                light={isDark ? {
                    anchor: 'viewport',
                    color: 'white',
                    intensity: 0.4,
                    position: [1.5, 90, 80]
                } as any : undefined}
                fog={isDark ? {
                    "range": [0.5, 10],
                    "color": "#001e3c",      // Deep Cyber Blue
                    "high-color": "#0a1f3d", // Lighter blue near horizon
                    "space-color": "#000000",
                    "horizon-blend": 0.05,
                    "star-intensity": 0.5
                } as any : undefined}
            >
                <Source
                    id="mapbox-dem"
                    type="raster-dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                    maxzoom={14}
                />

                {/* Add 3D Building Layer */}
                <Layer {...{
                    'id': '3d-buildings',
                    'source': 'composite',
                    'source-layer': 'building',
                    'filter': ['==', 'extrude', 'true'],
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': '#aaa',
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
                    }
                } as any} />

                {/* Render Route Line */}
                {stops.length > 1 && (
                    <Source id="route" type="geojson" data={routeGeoJSON as any}>
                        <Layer
                            id="route-line"
                            type="line"
                            paint={{
                                "line-color": theme === 'dark' ? "#00f0ff" : "#3b82f6",
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
                            <div
                                className={`p-2 rounded-full border-2 border-white ${isDark ? 'shadow-[0_0_15px_rgba(0,240,255,0.7)] animate-pulse' : 'shadow-lg'}`}
                                style={{ backgroundColor: isDark ? '#06b6d4' : '#dc2626' }}
                            >
                                <MapPin className="w-5 h-5" style={{ color: isDark ? '#000000' : '#ffffff' }} />
                            </div>
                            <span
                                className="mt-1 text-xs font-bold px-2 py-1 rounded backdrop-blur-sm shadow-sm"
                                style={{
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                    color: isDark ? '#67e8f9' : '#b91c1c',
                                    borderColor: isDark ? 'rgba(6,182,212,0.3)' : 'transparent',
                                    borderWidth: isDark ? '1px' : '0px'
                                }}
                            >
                                {index + 1}. {stop.name}
                            </span>
                        </div>

                        <PassportPin name={stop.name} />
                    </Marker >
                ))
                }
            </Map >
            <TimelineControl
                onStart={() => {
                    if (isStoryMode) {
                        stopJourney();
                    } else {
                        startJourney();
                    }
                }}
                isStoryMode={isStoryMode}
            />
        </div >
    );
}
