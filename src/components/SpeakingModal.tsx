'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/components/ClientIntlProvider';
import { useMeetingStore } from '@/stores/meetingStore';
import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/utils/time';
import { Play, Square, User, Clock, AlertTriangle } from 'lucide-react';

interface SpeakingModalProps {
  isOpen: boolean;
  participantId: string;
  onClose: () => void;
  onNext: () => void;
}

export const SpeakingModal = ({ isOpen, participantId, onClose, onNext }: SpeakingModalProps) => {
  const t = useTranslations();
  const { locale } = useLanguage();
  const {
    participants,
    currentSpeakingTime,
    isSpeaking,
    startSpeaking,
    stopSpeaking,
    incrementSpeakingTimer,
    resetCurrentSpeakingTime
  } = useMeetingStore();

  const participant = participants.find(p => p.id === participantId);

  useTimer(isSpeaking, incrementSpeakingTimer);

  if (!participant) return null;

  const isOvertime = currentSpeakingTime > participant.allocatedTime;
  const remainingTime = participant.allocatedTime - currentSpeakingTime;

  // Text-to-speech thank you function
  const speakThankYou = (participantName: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();

        // Create the thank you message based on locale
        const thankYouText = locale === 'fr'
          ? `Merci ${participantName}`
          : `Thank you ${participantName}`;

        const utterance = new SpeechSynthesisUtterance(thankYouText);

        // Set language based on current locale
        utterance.lang = locale === 'fr' ? 'fr-FR' : 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 0.8;

        // Speak immediately
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Text-to-speech not available:', error);
    }
  };

  const handleStart = () => {
    resetCurrentSpeakingTime();
    startSpeaking(participantId);
  };

  const handleStop = () => {
    // Play thank you message before stopping
    speakThankYou(participant.name);

    stopSpeaking();
    onNext();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-surface rounded-lg shadow-xl p-8 max-w-md w-full max-h-screen overflow-y-auto"
          >
            <div className="text-center">
              {/* Participant Info */}
              <div className="mb-8">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={40} className="text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {participant.name}
                </h2>
                <p className="text-foreground-secondary">
                  Temps alloué : {formatTime(participant.allocatedTime)}
                </p>
              </div>

              {/* Timer Display */}
              <div className="mb-8">
                <div className={`text-6xl font-mono font-bold mb-4 ${
                  isOvertime ? 'text-red-600' : 'text-foreground'
                }`}>
                  <motion.div
                    animate={isOvertime ? {
                      scale: [1, 1.05, 1],
                      rotate: [0, 1, -1, 0]
                    } : {}}
                    transition={isOvertime ? {
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    } : {}}
                  >
                    {formatTime(currentSpeakingTime)}
                  </motion.div>
                </div>

                {/* Status Indicators */}
                <div className="space-y-2">
                  {!isSpeaking && (
                    <div className="flex items-center justify-center gap-2 text-foreground-secondary">
                      <Clock size={16} />
                      <span className="text-sm">Prêt à commencer</span>
                    </div>
                  )}

                  {isSpeaking && !isOvertime && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Clock size={16} />
                      <span className="text-sm">
                        Temps restant : {formatTime(Math.max(0, remainingTime))}
                      </span>
                    </div>
                  )}

                  {isOvertime && (
                    <motion.div
                      className="flex items-center justify-center gap-2 text-red-600"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <AlertTriangle size={16} />
                      <span className="text-sm font-semibold">
                        Temps dépassé de {formatTime(currentSpeakingTime - participant.allocatedTime)}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {!isSpeaking ? (
                  <button
                    onClick={handleStart}
                    className="w-full bg-success text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 flex items-center justify-center gap-3"
                  >
                    <Play size={24} />
                    Commencer
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-3 ${
                      isOvertime
                        ? 'bg-error text-white hover:bg-error/90 focus:ring-error'
                        : 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary'
                    }`}
                  >
                    <Square size={24} />
                    Terminer
                  </button>
                )}

                <button
                  onClick={onClose}
                  disabled={isSpeaking}
                  className={`w-full py-2 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isSpeaking
                      ? 'bg-secondary text-foreground-muted cursor-not-allowed'
                      : 'bg-secondary-hover text-foreground-secondary hover:bg-border-hover focus:ring-primary'
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};