import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PickerMode = 'wheel' | 'reel' | 'deck' | 'spotlight';
export type PickerPreference = PickerMode | 'random';

export const PICKER_MODES: PickerMode[] = ['wheel', 'reel', 'deck', 'spotlight'];

interface SettingsStore {
  soundEnabled: boolean;
  pickerPreference: PickerPreference;
  setSoundEnabled: (enabled: boolean) => void;
  setPickerPreference: (preference: PickerPreference) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      pickerPreference: 'random',
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setPickerPreference: (pickerPreference) => set({ pickerPreference }),
    }),
    { name: 'scrum-settings' }
  )
);
