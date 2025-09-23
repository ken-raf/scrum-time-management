'use client';

import { useTranslations } from 'next-intl';
import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { Users, Clock, CheckCircle, AlertTriangle, Target } from 'lucide-react';

export const LiveStats = () => {
  const t = useTranslations();
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
      <div className="bg-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
          <Target size={24} className="text-primary" />
          {t('liveStats.title')}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <Users size={24} className="text-primary mx-auto mb-2" />
            <p className="text-sm text-foreground-secondary mb-1">{t('liveStats.presentParticipants')}</p>
            <p className="text-2xl font-bold text-foreground">{presentParticipants.length}</p>
          </div>

          <div className="bg-secondary rounded-lg p-4 text-center">
            <CheckCircle size={24} className="text-success mx-auto mb-2" />
            <p className="text-sm text-foreground-secondary mb-1">{t('liveStats.haveSpoken')}</p>
            <p className="text-2xl font-bold text-foreground">
              {spokenParticipants.length}/{presentParticipants.length}
            </p>
          </div>

          <div className="bg-secondary rounded-lg p-4 text-center">
            <Clock size={24} className="text-warning mx-auto mb-2" />
            <p className="text-sm text-foreground-secondary mb-1">{t('liveStats.timeUsed')}</p>
            <p className="text-xl font-bold text-foreground font-mono">
              {formatTime(totalUsedTime)}
            </p>
          </div>

          <div className={`rounded-lg p-4 text-center ${
            overtimeParticipants.length > 0 ? 'bg-secondary' : 'bg-secondary'
          }`}>
            {overtimeParticipants.length > 0 ? (
              <AlertTriangle size={24} className="text-error mx-auto mb-2" />
            ) : (
              <CheckCircle size={24} className="text-success mx-auto mb-2" />
            )}
            <p className="text-sm text-foreground-secondary mb-1">{t('liveStats.overtimes')}</p>
            <p className="text-2xl font-bold text-foreground">{overtimeParticipants.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-foreground-secondary mb-2">
            <span>{t('liveStats.meetingProgress')}</span>
            <span>{spokenParticipants.length}/{presentParticipants.length}</span>
          </div>
          <div className="w-full bg-border rounded-full h-3">
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
            <p className="text-sm text-foreground-secondary mb-1">{t('liveStats.totalAllocatedTime')}</p>
            <p className="text-lg font-bold text-primary font-mono">
              {formatTime(totalAllocatedTime)}
            </p>
          </div>
          <div>
            <p className="text-sm text-foreground-secondary mb-1">{t('liveStats.elapsedTime')}</p>
            <p className="text-lg font-bold text-success font-mono">
              {formatTime(globalTimer)}
            </p>
          </div>
        </div>
      </div>

      {/* Participants Status */}
      <div className="bg-surface rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {t('liveStats.participantsStatus')}
        </h3>

        <div className="space-y-3">
          {/* Spoken Participants */}
          {spokenParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-success mb-2">
                {t('liveStats.haveSpokenList')} ({spokenParticipants.length})
              </h4>
              <div className="space-y-2">
                {spokenParticipants.map(participant => {
                  const isOvertime = (participant.actualTime || 0) > participant.allocatedTime;
                  return (
                    <div
                      key={participant.id}
                      className={`flex justify-between items-center p-2 rounded ${
                        isOvertime ? 'bg-secondary' : 'bg-secondary'
                      }`}
                    >
                      <span className="text-foreground">{participant.name}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`font-mono font-semibold ${
                          isOvertime ? 'text-error' : 'text-success'
                        }`}>
                          {formatTime(participant.actualTime || 0)}
                        </span>
                        <span className="text-foreground-muted">/</span>
                        <span className="font-mono text-foreground-secondary">
                          {formatTime(participant.allocatedTime)}
                        </span>
                        {isOvertime && (
                          <AlertTriangle size={16} className="text-error" />
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
              <h4 className="text-sm font-medium text-primary mb-2">
                {t('liveStats.waiting')} ({remainingParticipants.length})
              </h4>
              <div className="space-y-2">
                {remainingParticipants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex justify-between items-center p-2 rounded bg-secondary"
                  >
                    <span className="text-foreground">{participant.name}</span>
                    <span className="font-mono text-foreground-secondary text-sm">
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