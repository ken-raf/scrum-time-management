'use client';

import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { Clock, Users, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export const MeetingSummary = () => {
  const { participants, globalTimer } = useMeetingStore();

  const presentParticipants = participants.filter(p => p.isPresent);
  const participantsWithTime = presentParticipants.filter(p => p.actualTime !== undefined);
  const overtimeParticipants = participantsWithTime.filter(p => (p.actualTime || 0) > p.allocatedTime);

  const totalAllocatedTime = presentParticipants.reduce((sum, p) => sum + p.allocatedTime, 0);
  const totalActualTime = participantsWithTime.reduce((sum, p) => sum + (p.actualTime || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-4">
          <Calendar size={28} className="text-blue-600" />
          Résumé de la réunion
        </h2>

        {/* Meeting Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Clock size={32} className="text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Durée totale</p>
            <p className="text-2xl font-bold text-gray-800 font-mono">
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
      </div>

      {/* Time Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Comparaison des temps
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Temps total alloué</p>
            <p className="text-2xl font-bold text-blue-600 font-mono">
              {formatTime(totalAllocatedTime)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Temps total utilisé</p>
            <p className="text-2xl font-bold text-green-600 font-mono">
              {formatTime(totalActualTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Participants Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
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
                    <td className="py-3 px-2 font-medium text-gray-900">
                      {participant.name}
                    </td>
                    <td className="py-3 px-2 font-mono text-gray-900">
                      {formatTime(participant.allocatedTime)}
                    </td>
                    <td className="py-3 px-2 font-mono text-gray-900">
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
                            <span className="text-sm text-gray-600">N&apos;a pas parlé</span>
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
    </div>
  );
};