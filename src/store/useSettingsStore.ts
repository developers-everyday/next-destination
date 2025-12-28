import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    mapboxToken: string;
    elevenLabsAgentId: string;
    isSettingsOpen: boolean;
    setMapboxToken: (token: string) => void;
    setElevenLabsAgentId: (id: string) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
            elevenLabsAgentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
            isSettingsOpen: false,
            setMapboxToken: (token) => set({ mapboxToken: token }),
            setElevenLabsAgentId: (id) => set({ elevenLabsAgentId: id }),
            setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
            resetToDefaults: () => set({
                mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
                elevenLabsAgentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''
            }),
        }),
        {
            name: 'settings-storage-v2', // name of the item in the storage (must be unique)
            partialize: (state) => ({ mapboxToken: state.mapboxToken, elevenLabsAgentId: state.elevenLabsAgentId }),
        }
    )
);
