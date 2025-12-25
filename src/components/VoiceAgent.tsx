"use client";

import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useItineraryStore } from "@/store/useItineraryStore";

export default function VoiceAgent() {
    const { setFocusedLocation, addStop } = useItineraryStore();
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState("Idle");

    // Single conversation hook with client tools
    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setIsActive(true);
            setStatus("Connected");
        },
        onDisconnect: (...args) => {
            console.warn("Disconnected from ElevenLabs", args);
            setIsActive(false);
            setStatus("Disconnected");
        },
        onMessage: (message) => {
            console.log("Message:", message);
            if (message.source === "ai") {
                setStatus("Agent speaking...");
            }
        },
        onError: (e) => {
            console.error("Voice Agent Error:", e);
            setStatus(`Error: ${typeof e === 'string' ? e : "Check console"}`);
            alert(`Voice Agent Error: ${typeof e === 'string' ? e : JSON.stringify(e)}`);
            setIsActive(false);
        },
        clientTools: {
            move_map: (parameters: { lat: number; lng: number }) => {
                console.log("Tool Call: move_map", parameters);
                setStatus("Moving map...");
                setFocusedLocation([parameters.lng, parameters.lat]);
                return "Map moved.";
            },
            add_place: (parameters: { name: string; lat: number; lng: number; day?: number }) => {
                console.log("Tool Call: add_place", parameters);
                setStatus(`Adding ${parameters.name}...`);
                setFocusedLocation([parameters.lng, parameters.lat]);
                addStop({
                    name: parameters.name,
                    coordinates: [parameters.lng, parameters.lat],
                    dayIndex: parameters.day || 1,
                });
                return `Added ${parameters.name} to itinerary.`;
            },
            generate_itinerary: (parameters: { plan: any }) => {
                console.log("Tool Call: generate_itinerary", parameters);
                setStatus("Generating itinerary...");
                const { setItinerary } = useItineraryStore.getState();

                try {
                    const plan = parameters.plan;
                    // Validate basic structure (optional but good practice)
                    if (!Array.isArray(plan)) {
                        throw new Error("Plan must be an array of days");
                    }

                    const formattedItinerary = plan.map((day: any) => ({
                        day: day.day,
                        narrative: day.narrative,
                        stops: (day.stops || []).map((stop: any) => ({
                            id: Math.random().toString(36).substring(7),
                            name: stop.name,
                            coordinates: stop.coordinates || [stop.lng, stop.lat],
                            dayIndex: day.day
                        }))
                    }));

                    setItinerary(formattedItinerary);
                    return "Itinerary generated and displayed on screen.";
                } catch (e) {
                    console.error("Error generating itinerary", e);
                    return "Failed to display itinerary.";
                }
            },
            start_journey: (parameters: {}) => {
                console.log("Tool Call: start_journey");
                setStatus("Starting journey...");
                const { startJourney } = useItineraryStore.getState();
                startJourney();
                return "Starting the journey simulation now.";
            },
            next_stop: (parameters: {}) => {
                console.log("Tool Call: next_stop");
                setStatus("Moving to next stop...");
                const { nextStop } = useItineraryStore.getState(); // Assuming nextStop is available in the store
                nextStop();
                return "Moved to the next stop.";
            },
            previous_stop: (parameters: {}) => {
                console.log("Tool Call: previous_stop");
                setStatus("Moving to previous stop...");
                const { prevStop } = useItineraryStore.getState(); // Assuming prevStop is available in the store
                prevStop();
                return "Moved to the previous stop.";
            }
        }
    });

    const handleToggle = async () => {
        if (isActive) {
            await conversation.endSession();
        } else {
            try {
                setStatus("Requesting microphone...");
                const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
                if (!agentId || agentId === "Replace-with-agent-id") {
                    throw new Error("Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local");
                }

                await navigator.mediaDevices.getUserMedia({ audio: true });
                setStatus("Connecting...");

                // Removed overrides temporarily to debug connectivity
                console.log("Starting session with Agent ID:", agentId);

                // @ts-ignore
                await conversation.startSession({
                    agentId: agentId,
                    // NOTE: The 'overrides' below caused an error because the Agent is properly locked.
                    // PLEASE PASTE THE PROMPT (System Instruction) INTO THE ELEVENLABS DASHBOARD INSTEAD.
                    // overrides: {
                    //     agent: {
                    //         prompt: {
                    //             prompt: `You are a travel agent... (See walkthrough.md or chat history for full prompt)`
                    //         }
                    //     }
                    // }
                });
            } catch (e: any) {
                console.error("Failed to start conversation:", e);
                setStatus("Connection failed");
                alert(`Error starting voice agent: ${e.message || e}`);
            }
        }
    };


    return (
        <div className="flex flex-col items-center gap-2 pointer-events-auto z-50">
            <button
                onClick={handleToggle}
                className={`cursor-pointer !pointer-events-auto relative group flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${isActive
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-blue-600 hover:bg-blue-500"
                    }`}
            >
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-full blur-lg opacity-50 ${isActive ? 'bg-red-500' : 'bg-blue-500'}`} />

                <div className="relative z-10 text-white">
                    {isActive ? <MicOff size={32} /> : <Mic size={32} />}
                </div>
            </button>
            <div
                className="px-4 py-2 rounded-full shadow-lg border border-gray-200 z-50"
                style={{ backgroundColor: 'white', color: 'black' }}
            >
                <span
                    className="text-xs font-bold"
                    style={{ color: status.startsWith("Error") ? 'red' : 'black' }}
                >
                    {status}
                </span>
            </div>
        </div>
    );
}
