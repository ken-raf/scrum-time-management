export interface Participant {
  id: string;
  name: string;
  allocatedTime: number; // in seconds
  isPresent: boolean;
  actualTime?: number; // time actually used in seconds
}

export interface MeetingState {
  isStarted: boolean;
  isFinished: boolean;
  name?: string;
  startTime?: Date;
  endTime?: Date;
  currentParticipant?: string;
  participantsOrder: string[];
  spokenParticipants: string[];
}

export interface MeetingSummary {
  date: Date;
  totalDuration: number;
  participants: Array<{
    name: string;
    allocatedTime: number;
    actualTime: number | undefined;
    isOvertime: boolean;
  }>;
}

export interface HistoricalMeeting {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  participants: Array<{
    name: string;
    allocatedTime: number;
    actualTime: number | undefined;
    isOvertime: boolean;
    isPresent: boolean;
  }>;
  summary: {
    totalParticipants: number;
    participantsWhoSpoke: number;
    totalOvertimeParticipants: number;
    totalAllocatedTime: number;
    totalActualTime: number;
  };
}