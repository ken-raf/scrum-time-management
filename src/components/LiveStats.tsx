'use client';

import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { Users, Clock, CheckCircle, AlertTriangle, Target } from 'lucide-react';

export const LiveStats = () => {
  const { participants, meetingState, globalTimer } = useMeetingStore();

  const presentParticipants = participants.filter(p => p.isPresent);
  const spokenParticipants = presentParticipants.filter(p =>
    meetingState.spokenParticipants.includes(p.id)
  );
  const remainingParticipants = presentParticipants.filter(p =>
    !meetingState.spokenParticipants.includes(p.id)
  );

  const totalAllocatedTime = presentParticipants.reduce((sum, p) => sum + p.allocatedTime, 0);
  const totalUsedTime = spokenParticipants.reduce((sum, p) => sum + (p.actualTime || 0), 0);
  const overtimeParticipants = spokenParticipants.filter(p => (p.actualTime || 0) > p.allocatedTime);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <Target size={24} className="text-blue-600" />
          Statistiques en temps réel
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Users size={24} className="text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Participants présents</p>
            <p className="text-2xl font-bold text-gray-800">{presentParticipants.length}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Ont parlé</p>
            <p className="text-2xl font-bold text-gray-800">
              {spokenParticipants.length}/{presentParticipants.length}
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <Clock size={24} className="text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Temps utilisé</p>
            <p className="text-xl font-bold text-gray-800 font-mono">
              {formatTime(totalUsedTime)}
            </p>
          </div>

          <div className={`rounded-lg p-4 text-center ${
            overtimeParticipants.length > 0 ? 'bg-red-50' : 'bg-green-50'
          }`}>
            {overtimeParticipants.length > 0 ? (
              <AlertTriangle size={24} className="text-red-600 mx-auto mb-2" />
            ) : (
              <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
            )}
            <p className="text-sm text-gray-600 mb-1">Dépassements</p>
            <p className="text-2xl font-bold text-gray-800">{overtimeParticipants.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression de la réunion</span>
            <span>{spokenParticipants.length}/{presentParticipants.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${presentParticipants.length > 0 ? (spokenParticipants.length / presentParticipants.length) * 100 : 0}%`
              }}
            ></div>
          </div>
        </div>

        {/* Time Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Temps total alloué</p>
            <p className="text-lg font-bold text-blue-600 font-mono">
              {formatTime(totalAllocatedTime)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Temps écoulé</p>
            <p className="text-lg font-bold text-green-600 font-mono">
              {formatTime(globalTimer)}
            </p>
          </div>
        </div>
      </div>

      {/* Participants Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          État des participants
        </h3>

        <div className="space-y-3">
          {/* Spoken Participants */}
          {spokenParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2">
                ✅ Ont parlé ({spokenParticipants.length})
              </h4>
              <div className="space-y-2">
                {spokenParticipants.map(participant => {
                  const isOvertime = (participant.actualTime || 0) > participant.allocatedTime;
                  return (
                    <div
                      key={participant.id}
                      className={`flex justify-between items-center p-2 rounded ${
                        isOvertime ? 'bg-red-50' : 'bg-green-50'
                      }`}
                    >
                      <span className="text-gray-800">{participant.name}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono">
                          {formatTime(participant.actualTime || 0)}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span className="font-mono text-gray-600">
                          {formatTime(participant.allocatedTime)}
                        </span>
                        {isOvertime && (
                          <AlertTriangle size={16} className="text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remaining Participants */}
          {remainingParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                ⏳ En attente ({remainingParticipants.length})
              </h4>
              <div className="space-y-2">
                {remainingParticipants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex justify-between items-center p-2 rounded bg-blue-50"
                  >
                    <span className="text-gray-800">{participant.name}</span>
                    <span className="font-mono text-gray-600 text-sm">
                      {formatTime(participant.allocatedTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};