'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { formatTimeInput, parseTimeInput } from '@/utils/time';
import { sfx } from '@/lib/sound';
import { ParticipantAvatar } from '@/components/avatar/ParticipantAvatar';
import { AvatarPicker } from '@/components/avatar/AvatarPicker';
import { Avatar } from '@/components/avatar/Avatar';
import { participantAvatar } from '@/lib/avatars';

export const ParticipantTable = ({ onAdd }: { onAdd?: () => void }) => {
  const t = useTranslations('participants');
  const participants = useMeetingStore((s) => s.participants);
  const removeParticipant = useMeetingStore((s) => s.removeParticipant);
  const updateParticipant = useMeetingStore((s) => s.updateParticipant);
  const toggleParticipantPresence = useMeetingStore((s) => s.toggleParticipantPresence);
  const isDisabled = useMeetingStore((s) => s.meetingState.isStarted);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [avatarFor, setAvatarFor] = useState<string | null>(null);

  const presentCount = participants.filter((p) => p.isPresent).length;

  const startEditing = (id: string, name: string, allocatedTime: number) => {
    if (isDisabled) return;
    setEditingId(id);
    setEditingName(name);
    setEditingTime(formatTimeInput(allocatedTime));
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = (id: string) => {
    if (!editingName.trim()) return;
    const allocatedTime = parseTimeInput(editingTime);
    updateParticipant(id, { name: editingName.trim(), ...(allocatedTime > 0 ? { allocatedTime } : {}) });
    setEditingId(null);
  };

  return (
    <div className="card flex flex-col p-5 sm:p-6 lg:h-full lg:min-h-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            {t('listTitle')} <span className="font-mono text-base text-foreground-muted tabular">{participants.length}</span>
          </h2>
          {participants.length > 0 && (
            <p className="text-xs text-foreground-muted">{t('presentCount', { present: presentCount, total: participants.length })}</p>
          )}
        </div>
        {onAdd && !isDisabled && participants.length > 0 && (
          <button type="button" onClick={onAdd} className="btn btn-ghost !px-3 !py-2" aria-label={t('addParticipant')}>
            <Plus size={16} />
            {t('addShort')}
          </button>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="grid flex-1 place-content-center justify-items-center gap-3 py-8 text-center">
          <div className="flex -space-x-3">
            {['ani-fox', 'ani-panda', 'ani-owl', 'ani-lion'].map((id) => (
              <Avatar key={id} avatarId={id} seed={id} mood="waiting" size={44} className="ring-4 ring-[var(--theme-surface)]" />
            ))}
          </div>
          <p className="font-medium">{t('empty')}</p>
          <p className="max-w-xs text-sm text-foreground-muted">{t('emptyBody')}</p>
          {onAdd && (
            <button type="button" onClick={onAdd} className="btn btn-primary mt-2">
              <Plus size={18} />
              {t('addParticipant')}
            </button>
          )}
        </div>
      ) : (
        <ul className="-mr-2 grid content-start overflow-y-auto pr-2 lg:min-h-0 lg:flex-1">
          <AnimatePresence initial={false}>
            {participants.map((p) => {
              const editing = editingId === p.id;
              const choosingAvatar = avatarFor === p.id;
              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDisabled) return;
                        toggleParticipantPresence(p.id);
                        sfx.click();
                      }}
                      disabled={isDisabled}
                      aria-pressed={p.isPresent}
                      aria-label={t('markPresent', { name: p.name })}
                      className={clsx(
                        'grid h-6 w-6 flex-none place-items-center rounded-[7px] border-[1.5px] transition-[background-color,border-color,transform] duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50',
                        p.isPresent ? 'border-success bg-success' : 'border-border-hover'
                      )}
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                        <motion.path
                          d="M3 8.5 L6.5 12 L13 4.5"
                          fill="none"
                          stroke="var(--theme-primary-foreground)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={false}
                          animate={{ pathLength: p.isPresent ? 1 : 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => !isDisabled && setAvatarFor(choosingAvatar ? null : p.id)}
                      disabled={isDisabled}
                      aria-label={t('changeAvatar', { name: p.name })}
                      aria-expanded={choosingAvatar}
                      className="flex-none rounded-full transition-transform hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
                    >
                      <ParticipantAvatar participant={p} size={40} />
                    </button>

                    {editing ? (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="field min-w-0 flex-1 !py-1.5"
                          autoFocus
                          aria-label={t('name')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(p.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <input
                          type="text"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          className="field w-20 !py-1.5 font-mono tabular"
                          aria-label={t('allocatedTime')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(p.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(p.id, p.name, p.allocatedTime)}
                        disabled={isDisabled}
                        className={clsx(
                          'flex min-w-0 flex-1 items-center gap-3 text-left',
                          !isDisabled && 'group cursor-pointer',
                          !p.isPresent && 'text-foreground-muted line-through decoration-border-hover'
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium group-hover:text-primary">{p.name}</span>
                        <span className="font-mono text-sm text-foreground-muted tabular">{formatTimeInput(p.allocatedTime)}</span>
                      </button>
                    )}

                    <div className="flex flex-none items-center gap-1">
                      {editing ? (
                        <>
                          <button type="button" onClick={() => saveEditing(p.id)} className="btn btn-ghost btn-icon !h-8 !w-8 !text-success" aria-label={t('save')}>
                            <Check size={16} />
                          </button>
                          <button type="button" onClick={cancelEditing} className="btn btn-ghost btn-icon !h-8 !w-8" aria-label={t('cancel')}>
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          {!isDisabled && (
                            <button
                              type="button"
                              onClick={() => startEditing(p.id, p.name, p.allocatedTime)}
                              className="btn btn-ghost btn-icon !h-8 !w-8"
                              aria-label={t('edit', { name: p.name })}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              removeParticipant(p.id);
                              sfx.remove();
                            }}
                            disabled={isDisabled}
                            className="btn btn-ghost btn-icon !h-8 !w-8 hover:!bg-error/10 hover:!text-error"
                            aria-label={t('delete', { name: p.name })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {choosingAvatar && !isDisabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-3 pl-9">
                          <AvatarPicker
                            value={participantAvatar(p).id}
                            onChange={(id) => {
                              updateParticipant(p.id, { avatar: id });
                              setAvatarFor(null);
                            }}
                            size={36}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};
