'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { AddParticipantModal } from '@/components/AddParticipantModal';
import { ParticipantTable } from '@/components/ParticipantTable';
import { GlobalTimer } from '@/components/GlobalTimer';
import { MeetingControls } from '@/components/MeetingControls';
import { ParticipantPicker } from '@/components/selection/ParticipantPicker';
import { SpeakingModal } from '@/components/SpeakingModal';
import { LiveStats } from '@/components/LiveStats';
import { MeetingSummary } from '@/components/MeetingSummary';
import { useMeetingStore } from '@/stores/meetingStore';

const enter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

// On desktop the app is exactly one screen tall: the page never scrolls,
// each card fills its row and long lists scroll inside their card.
const VIEW = 'flex flex-col gap-4 lg:h-full lg:min-h-0';
const ROW = 'grid gap-4 lg:min-h-0 lg:flex-1';

export default function Home() {
  const t = useTranslations();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const meetingState = useMeetingStore((s) => s.meetingState);
  const openAdd = useCallback(() => setAddOpen(true), []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  // After a reload (or an app update) during someone's turn, bring their timer
  // back instead of leaving the turn frozen with no way to close it.
  useEffect(() => {
    const resume = () => {
      const { meetingState } = useMeetingStore.getState();
      if (meetingState.isStarted && !meetingState.isFinished && meetingState.currentParticipant) {
        setSelectedParticipant(meetingState.currentParticipant);
      }
    };
    if (useMeetingStore.persist.hasHydrated()) resume();
    else return useMeetingStore.persist.onFinishHydration(resume);
  }, []);

  const handleParticipantSelected = (participantId: string) => {
    setSelectedParticipant(participantId);
    const { meetingState } = useMeetingStore.getState();
    useMeetingStore.setState({ meetingState: { ...meetingState, currentParticipant: participantId } });
  };

  const handleCloseSpeakingModal = () => {
    setSelectedParticipant(null);
    useMeetingStore.getState().clearCurrentParticipant();
  };

  const view = meetingState.isFinished ? 'summary' : meetingState.isStarted ? 'live' : 'setup';

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-theme lg:h-dvh lg:overflow-hidden">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 lg:min-h-0 lg:py-5">
        <AnimatePresence mode="wait">
          {view === 'setup' && (
            <motion.div key="setup" {...enter} className={VIEW}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">{t('home.eyebrow')}</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-balance">
                    {t('home.titleStart')} <span className="text-gradient">{t('home.titleAccent')}</span>
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={openAdd} className="btn">
                    <UserPlus size={18} />
                    {t('participants.addParticipant')}
                  </button>
                  <MeetingControls />
                </div>
              </div>
              <div className={`${ROW} lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]`}>
                <ParticipantTable onAdd={openAdd} />
                <div className="card flex flex-col gap-4 p-5 sm:p-6 lg:h-full lg:min-h-0">
                  <div>
                    <p className="eyebrow">{t('picker.previewEyebrow')}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">{t('picker.previewTitle')}</h2>
                  </div>
                  <div className="lg:min-h-0 lg:flex-1">
                    <ParticipantPicker onParticipantSelected={() => undefined} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'live' && (
            <motion.div key="live" {...enter} className={VIEW}>
              <div className="card flex flex-wrap items-center justify-between gap-4 !rounded-[20px] px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-6">
                  <GlobalTimer />
                  {meetingState.name && (
                    <div className="hidden border-l border-border pl-6 sm:block">
                      <p className="eyebrow">{t('meeting.current')}</p>
                      <p className="font-medium">{meetingState.name}</p>
                    </div>
                  )}
                </div>
                <MeetingControls />
              </div>
              <div className={`${ROW} lg:grid-cols-5`}>
                <div className="card min-w-0 p-4 sm:p-5 lg:col-span-3 lg:h-full lg:min-h-0">
                  <ParticipantPicker onParticipantSelected={handleParticipantSelected} />
                </div>
                <div className="min-w-0 lg:col-span-2 lg:h-full lg:min-h-0">
                  <LiveStats />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'summary' && (
            <motion.div key="summary" {...enter} className={VIEW}>
              <MeetingSummary />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddParticipantModal open={addOpen && view === 'setup'} onClose={closeAdd} />
      {selectedParticipant && (
        <SpeakingModal isOpen participantId={selectedParticipant} onClose={handleCloseSpeakingModal} />
      )}
    </div>
  );
}
