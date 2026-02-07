import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Programming language preference
      programmingLanguage: 'python', // python, cpp, javascript
      
      // Theme
      theme: 'default',
      isDarkMode: true,
      
      // Sound & Voice
      soundEnabled: true,
      voiceTutorEnabled: true,
      
      // Editor settings
      editorFontSize: 14,
      editorTabSize: 4,
      
      // Actions
      setProgrammingLanguage: (lang) => set({ programmingLanguage: lang }),
      
      setTheme: (theme) => set({ theme }),
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      
      toggleVoiceTutor: () => set((state) => ({ voiceTutorEnabled: !state.voiceTutorEnabled })),
      
      setEditorFontSize: (size) => set({ editorFontSize: size }),
      
      setEditorTabSize: (size) => set({ editorTabSize: size }),
    }),
    {
      name: 'codehub-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        programmingLanguage: state.programmingLanguage,
        theme: state.theme,
        isDarkMode: state.isDarkMode,
        soundEnabled: state.soundEnabled,
        voiceTutorEnabled: state.voiceTutorEnabled,
        editorFontSize: state.editorFontSize,
        editorTabSize: state.editorTabSize,
      }),
    }
  )
);
