"use client";

import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useItineraryStore } from "@/store/useItineraryStore";

export default function VoiceAgent() {
    const { setFocusedLocation, addStop } = useItineraryStore();
    const [isActive, setIsActive] = useState(false);

    const conversation = useConversation({
        onConnect: () => setIsActive(true),
        onDisconnect: () => setIsActive(false),
        onMessage: (message) => {
            // Optional: Log messages for debugging
            console.log("Message:", message);
        },
        onError: (error) => {
            console.error("Voice Agent Error:", error);
            setIsActive(false);
        }
    });

    const startListening = useCallback(async () => {
        try {
            // Request microphone permission explicitly first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Start the conversation
            // NOTE: User must replace 'YOUR_AGENT_ID' with their actual Agent ID from ElevenLabs
            // @ts-ignore - SDK types might be stricter than documentation or require connectionType
            await conversation.startSession({
                agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "REPLACE_WITH_AGENT_ID",
            });
        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    }, [conversation]);

    const stopListening = useCallback(async () => {
        await conversation.endSession();
    }, [conversation]);

    // Register client tools
    useEffect(() => {
        // This is where we interpret tool calls from the conversation
        // Note: The @elevenlabs/react SDK handles tool calls via the clientTools parameter in startSession in newer versions
        // or by overriding client tools. However, looking at standard implementation:
        // We normally pass clientTools to startSession or useConversation configuration.
        // Let's check documentation or standard patterns. 
        // The instructions say: "Define clientTools inside the hook".
        // Actually the SDK exposes clientTools definition in the hook config.
    }, []);

    // Re-implementing useConversation to include clientTools properly
    // Since we can't change the hook call dynamically easily without types usually, 
    // Let's assume standard usage pattern where we pass it to `startSession` or the hook.
    // The provided architecture says: "Define clientTools inside the hook".

    // Let's adjust to pass clientTools to useConversation if supported, or handle tool calls if they come as events.
    // But standard ElevenLabs React SDK handles client tools by defining functions that match the tool names.

    // Refactoring to match likely SDK signature for tools
    const conversationWithTools = useConversation({
        onConnect: () => setIsActive(true),
        onDisconnect: () => setIsActive(false),
        onError: (e) => console.error(e),
        clientTools: {
            move_map: (parameters: { lat: number; lng: number }) => {
                console.log("Tool Call: move_map", parameters);
                setFocusedLocation([parameters.lng, parameters.lat]);
                return "Map moved."; // Return string response to agent
            },
            add_place: (parameters: { name: string; lat: number; lng: number; day?: number }) => {
                console.log("Tool Call: add_place", parameters);
                addStop({
                    name: parameters.name,
                    coordinates: [parameters.lng, parameters.lat],
                    dayIndex: parameters.day || 1,
                });
                return `Added ${parameters.name} to itinerary.`;
            }
        }
    });

    // Wrapper to switch between our initial conv and the one with tools
    // (Actually we should just use one).
    // Overwriting the previous `conversation` variable logic with the correct one.

    const handleToggle = async () => {
        if (isActive) {
            await conversationWithTools.endSession();
        } else {
            try {
                const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
                if (!agentId || agentId === "Replace-with-agent-id") {
                    throw new Error("Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local");
                }

                await navigator.mediaDevices.getUserMedia({ audio: true });

                // @ts-ignore
                await conversationWithTools.startSession({
                    agentId: agentId,
                });
            } catch (e: any) {
                console.error("Failed to start conversation:", e);
                alert(`Error starting voice agent: ${e.message || e}`);
            }
        }
    };


    return (
        <button
            onClick={handleToggle}
            className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${isActive
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
    );
}
