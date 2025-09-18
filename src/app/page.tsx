'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ParticipantForm } from '@/components/ParticipantForm';
import { ParticipantTable } from '@/components/ParticipantTable';
import { GlobalTimer } from '@/components/GlobalTimer';
import { MeetingControls } from '@/components/MeetingControls';
import { SimpleSpinWheel } from '@/components/SimpleSpinWheel';
import { SpeakingModal } from '@/components/SpeakingModal';
import { SummaryModal } from '@/components/SummaryModal';
import { LiveStats } from '@/components/LiveStats';
import { MeetingSummary } from '@/components/MeetingSummary';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useMeetingStore } from '@/stores/meetingStore';
import { Users, Clock, History } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const t = useTranslations();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { meetingState, selectNextParticipant, participants } = useMeetingStore();

  const handleParticipantSelected = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    setSelectedParticipant(participantId);

    // Set the current participant in the store so stopSpeaking() works
    const { meetingState } = useMeetingStore.getState();
    useMeetingStore.setState({
      meetingState: {
        ...meetingState,
        currentParticipant: participantId,
      },
    });
  };

  const handleCloseSpeakingModal = () => {
    setSelectedParticipant(null);
    // Clear the current participant when modal is closed without completing the turn
    const { clearCurrentParticipant } = useMeetingStore.getState();
    clearCurrentParticipant();
  };

  const handleNextParticipant = () => {
    const nextParticipant = selectNextParticipant();
    if (nextParticipant) {
      setSelectedParticipant(nextParticipant);
    }
  };

  const handleShowSummary = () => {
    setShowSummary(true);
  };

  const handleNewMeeting = () => {
    const { resetMeeting } = useMeetingStore.getState();
    resetMeeting();
    setShowSummary(false);
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  // No longer needed - summary shows directly in page

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <LanguageSwitcher />
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Clock size={40} className="text-yellow-500" />
              {t('app.title')}
            </h1>
            <Link
              href="/history"
              className="flex items-center gap-2 bg-white text-yellow-600 border border-yellow-600 px-4 py-2 rounded-lg font-medium hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
            >
              <History size={20} />
              {t('navigation.history')}
            </Link>
          </div>
          <p className="text-gray-600 text-lg">
            {t('app.description')}
          </p>
        </div>

        {/* Global Timer */}
        <GlobalTimer />

        {/* Meeting Name - Show when meeting is active */}
        {meetingState.isStarted && meetingState.name && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {meetingState.name}
              </h2>
            </div>
          </div>
        )}

        {/* Meeting Controls - Show at top when meeting is active or finished */}
        {meetingState.isStarted && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-center">
              <MeetingControls onShowSummary={handleShowSummary} onNewMeeting={handleNewMeeting} />
            </div>
          </div>
        )}

        {meetingState.isStarted && !meetingState.isFinished ? (
          /* During Meeting Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Live Stats */}
            <LiveStats />

            {/* Right Column - Spin Wheel */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Users size={24} className="text-yellow-500" />
                    {t('participants.participantSelection')}
                  </h2>
                </div>
                <SimpleSpinWheel onParticipantSelected={handleParticipantSelected} />
              </div>
            </div>
          </div>
        ) : meetingState.isFinished ? (
          /* Post Meeting Layout - Show Summary */
          <MeetingSummary />
        ) : (
          /* Pre/Post Meeting Layout */
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Participant Management */}
              <div className="space-y-6">
                <ParticipantForm />
                <ParticipantTable />
              </div>

              {/* Right Column - Meeting Flow */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Users size={24} className="text-yellow-500" />
                      {t('participants.participantSelection')}
                    </h2>
                  </div>
                  {meetingState.isFinished ? (
                    <div className="p-8 text-center">
                      <Users size={64} className="text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {t('meeting.meetingFinished')}
                      </h3>
                      <p className="text-gray-500">
                        {t('meeting.meetingFinishedDescription')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-8">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {t('meeting.wheelPreview')}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {t('meeting.wheelPreviewDescription')}
                        </p>
                      </div>
                      <SimpleSpinWheel onParticipantSelected={() => {}} />
                      {!meetingState.isStarted && (
                        <div className="mt-6">
                          <MeetingControls onShowSummary={handleShowSummary} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meeting Controls moved to top when meeting is finished */}
          </div>
        )}

        {/* Modals */}
        {selectedParticipant && (
          <SpeakingModal
            isOpen={true}
            participantId={selectedParticipant}
            onClose={handleCloseSpeakingModal}
            onNext={handleNextParticipant}
          />
        )}

        {/* Summary is now shown directly in page, no modal needed */}
      </div>
    </div>
  );
}