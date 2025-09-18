import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Participant, MeetingState, MeetingSummary, HistoricalMeeting } from '@/types';

interface MeetingStore {
  participants: Participant[];
  meetingState: MeetingState;
  globalTimer: number;
  currentSpeakingTime: number;
  isSpeaking: boolean;
  summaries: MeetingSummary[];
  historicalMeetings: HistoricalMeeting[];

  // Participant actions
  addParticipant: (name: string, allocatedTime: number) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  toggleParticipantPresence: (id: string) => void;

  // Meeting actions
  startMeeting: () => void;
  endMeeting: () => void;
  selectNextParticipant: () => string | null;
  startSpeaking: (participantId: string) => void;
  stopSpeaking: () => void;
  clearCurrentParticipant: () => void;

  // Timer actions
  incrementGlobalTimer: () => void;
  incrementSpeakingTimer: () => void;
  resetCurrentSpeakingTime: () => void;

  // Summary actions
  saveMeetingSummary: () => void;
  saveHistoricalMeeting: () => void;
  getHistoricalMeetings: () => HistoricalMeeting[];

  // Reset
  resetMeeting: () => void;
}

const initialMeetingState: MeetingState = {
  isStarted: false,
  isFinished: false,
  participantsOrder: [],
  spokenParticipants: [],
};

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      participants: [],
      meetingState: initialMeetingState,
      globalTimer: 0,
      currentSpeakingTime: 0,
      isSpeaking: false,
      summaries: [],
      historicalMeetings: [],

      addParticipant: (name: string, allocatedTime: number) => {
        const newParticipant: Participant = {
          id: crypto.randomUUID(),
          name,
          allocatedTime,
          isPresent: true,
        };
        set((state) => ({
          participants: [...state.participants, newParticipant],
        }));
      },

      removeParticipant: (id: string) => {
        set((state) => ({
          participants: state.participants.filter(p => p.id !== id),
        }));
      },

      updateParticipant: (id: string, updates: Partial<Participant>) => {
        set((state) => ({
          participants: state.participants.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      toggleParticipantPresence: (id: string) => {
        set((state) => ({
          participants: state.participants.map(p =>
            p.id === id ? { ...p, isPresent: !p.isPresent } : p
          ),
        }));
      },

      startMeeting: () => {
        const presentParticipants = get().participants.filter(p => p.isPresent);
        const shuffledOrder = [...presentParticipants]
          .map(p => p.id)
          .sort(() => Math.random() - 0.5);

        const startTime = new Date();
        // Generate meeting name with French date format
        const meetingName = `Réunion du ${startTime.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })} ${startTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;

        set((state) => ({
          meetingState: {
            ...state.meetingState,
            isStarted: true,
            name: meetingName,
            startTime,
            participantsOrder: shuffledOrder,
            spokenParticipants: [],
          },
          globalTimer: 0,
        }));
      },

      endMeeting: () => {
        get().saveMeetingSummary();
        get().saveHistoricalMeeting();
        set((state) => ({
          meetingState: {
            ...state.meetingState,
            isFinished: true,
            endTime: new Date(),
          },
          isSpeaking: false,
        }));
      },

      selectNextParticipant: () => {
        const { meetingState } = get();
        const availableParticipants = meetingState.participantsOrder.filter(
          id => !meetingState.spokenParticipants.includes(id)
        );

        if (availableParticipants.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * availableParticipants.length);
        const selectedParticipant = availableParticipants[randomIndex];

        set((state) => ({
          meetingState: {
            ...state.meetingState,
            currentParticipant: selectedParticipant,
          },
        }));

        return selectedParticipant;
      },

      startSpeaking: () => {
        set(() => ({
          isSpeaking: true,
          currentSpeakingTime: 0,
        }));
      },

      stopSpeaking: () => {
        const { currentSpeakingTime, meetingState } = get();

        if (meetingState.currentParticipant) {
          // Update participant's actual time
          get().updateParticipant(meetingState.currentParticipant, {
            actualTime: currentSpeakingTime,
          });

          // Add to spoken participants
          set((state) => ({
            meetingState: {
              ...state.meetingState,
              spokenParticipants: [
                ...state.meetingState.spokenParticipants,
                meetingState.currentParticipant!,
              ],
              currentParticipant: undefined,
            },
            isSpeaking: false,
            currentSpeakingTime: 0,
          }));
        }
      },

      clearCurrentParticipant: () => {
        set((state) => ({
          meetingState: {
            ...state.meetingState,
            currentParticipant: undefined,
          },
        }));
      },

      incrementGlobalTimer: () => {
        set((state) => ({
          globalTimer: state.globalTimer + 1,
        }));
      },

      incrementSpeakingTimer: () => {
        set((state) => ({
          currentSpeakingTime: state.currentSpeakingTime + 1,
        }));
      },

      resetCurrentSpeakingTime: () => {
        set(() => ({
          currentSpeakingTime: 0,
        }));
      },

      saveMeetingSummary: () => {
        const { participants, globalTimer } = get();
        const presentParticipants = participants.filter(p => p.isPresent);

        const summary: MeetingSummary = {
          date: new Date(),
          totalDuration: globalTimer,
          participants: presentParticipants.map(p => ({
            name: p.name,
            allocatedTime: p.allocatedTime,
            actualTime: p.actualTime || 0,
            isOvertime: (p.actualTime || 0) > p.allocatedTime,
          })),
        };

        set((state) => ({
          summaries: [...state.summaries, summary],
        }));
      },

      saveHistoricalMeeting: () => {
        const { participants, meetingState, globalTimer } = get();

        if (!meetingState.startTime) return;

        const presentParticipants = participants.filter(p => p.isPresent);
        const participantsWithTime = presentParticipants.filter(p => p.actualTime !== undefined);
        const overtimeParticipants = participantsWithTime.filter(p => (p.actualTime || 0) > p.allocatedTime);
        const totalAllocatedTime = presentParticipants.reduce((sum, p) => sum + p.allocatedTime, 0);
        const totalActualTime = participantsWithTime.reduce((sum, p) => sum + (p.actualTime || 0), 0);

        const startTime = new Date(meetingState.startTime);
        const endTime = meetingState.endTime ? new Date(meetingState.endTime) : new Date();

        // Generate meeting name with French date format
        const meetingName = `Réunion du ${startTime.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })} ${startTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;

        const historicalMeeting: HistoricalMeeting = {
          id: crypto.randomUUID(),
          name: meetingName,
          startTime,
          endTime,
          totalDuration: globalTimer,
          participants: presentParticipants.map(p => ({
            name: p.name,
            allocatedTime: p.allocatedTime,
            actualTime: p.actualTime || 0,
            isOvertime: (p.actualTime || 0) > p.allocatedTime,
            isPresent: p.isPresent,
          })),
          summary: {
            totalParticipants: presentParticipants.length,
            participantsWhoSpoke: participantsWithTime.length,
            totalOvertimeParticipants: overtimeParticipants.length,
            totalAllocatedTime,
            totalActualTime,
          },
        };

        set((state) => ({
          historicalMeetings: [...state.historicalMeetings, historicalMeeting],
        }));
      },

      getHistoricalMeetings: () => {
        return get().historicalMeetings.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      },

      resetMeeting: () => {
        set(() => ({
          meetingState: initialMeetingState,
          globalTimer: 0,
          currentSpeakingTime: 0,
          isSpeaking: false,
        }));
      },
    }),
    {
      name: 'scrum-meeting-storage',
    }
  )
);