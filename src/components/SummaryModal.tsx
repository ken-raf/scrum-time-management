'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { X, Clock, Users, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SummaryModal = ({ isOpen, onClose }: SummaryModalProps) => {
  const { participants, globalTimer, meetingState } = useMeetingStore();

  const presentParticipants = participants.filter(p => p.isPresent);
  const participantsWithTime = presentParticipants.filter(p => p.actualTime !== undefined);
  const overtimeParticipants = participantsWithTime.filter(p => (p.actualTime || 0) > p.allocatedTime);

  const totalAllocatedTime = presentParticipants.reduce((sum, p) => sum + p.allocatedTime, 0);
  const totalActualTime = participantsWithTime.reduce((sum, p) => sum + (p.actualTime || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar size={28} className="text-blue-600" />
                Résumé de la réunion
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Meeting Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Clock size={32} className="text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Durée totale</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatTime(globalTimer)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Users size={32} className="text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Participants</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {presentParticipants.length}
                  </p>
                </div>

                <div className={`rounded-lg p-4 text-center ${
                  overtimeParticipants.length > 0 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  {overtimeParticipants.length > 0 ? (
                    <AlertTriangle size={32} className="text-red-600 mx-auto mb-2" />
                  ) : (
                    <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-gray-600 mb-1">Dépassements</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {overtimeParticipants.length}
                  </p>
                </div>
              </div>

              {/* Time Comparison */}
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Comparaison des temps
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Temps total alloué</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatTime(totalAllocatedTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Temps total utilisé</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatTime(totalActualTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Participants Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Détail par participant
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">
                          Participant
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">
                          Temps alloué
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">
                          Temps utilisé
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">
                          Différence
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {presentParticipants.map((participant) => {
                        const actualTime = participant.actualTime || 0;
                        const isOvertime = actualTime > participant.allocatedTime;
                        const difference = actualTime - participant.allocatedTime;
                        const hasSpoken = participant.actualTime !== undefined;

                        return (
                          <tr
                            key={participant.id}
                            className={`border-b border-gray-100 ${
                              isOvertime ? 'bg-red-50' : hasSpoken ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <td className="py-3 px-2 font-medium">
                              {participant.name}
                            </td>
                            <td className="py-3 px-2 font-mono">
                              {formatTime(participant.allocatedTime)}
                            </td>
                            <td className="py-3 px-2 font-mono">
                              {hasSpoken ? formatTime(actualTime) : '-'}
                            </td>
                            <td className={`py-3 px-2 font-mono font-semibold ${
                              !hasSpoken
                                ? 'text-gray-400'
                                : isOvertime
                                ? 'text-red-600'
                                : difference < 0
                                ? 'text-green-600'
                                : 'text-gray-800'
                            }`}>
                              {!hasSpoken
                                ? '-'
                                : difference > 0
                                ? `+${formatTime(difference)}`
                                : difference < 0
                                ? `-${formatTime(Math.abs(difference))}`
                                : '±00:00'
                              }
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                {!hasSpoken ? (
                                  <>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <span className="text-sm text-gray-600">N'a pas parlé</span>
                                  </>
                                ) : isOvertime ? (
                                  <>
                                    <AlertTriangle size={16} className="text-red-600" />
                                    <span className="text-sm text-red-600 font-medium">Dépassement</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={16} className="text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">Respecté</span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <button
                    onClick={onClose}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};