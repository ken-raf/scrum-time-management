'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

  const handleStart = () => {
    resetCurrentSpeakingTime();
    startSpeaking(participantId);
  };

  const handleStop = () => {
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
            className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full max-h-screen overflow-y-auto"
          >
            <div className="text-center">
              {/* Participant Info */}
              <div className="mb-8">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={40} className="text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {participant.name}
                </h2>
                <p className="text-gray-600">
                  Temps alloué : {formatTime(participant.allocatedTime)}
                </p>
              </div>

              {/* Timer Display */}
              <div className="mb-8">
                <div className={`text-6xl font-mono font-bold mb-4 ${
                  isOvertime ? 'text-red-600' : 'text-gray-800'
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
                    <div className="flex items-center justify-center gap-2 text-gray-600">
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
                    className="w-full bg-yellow-500 text-black py-4 px-6 rounded-lg font-semibold text-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center justify-center gap-3"
                  >
                    <Play size={24} />
                    Commencer
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-3 ${
                      isOvertime
                        ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                        : 'bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-500'
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
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500'
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