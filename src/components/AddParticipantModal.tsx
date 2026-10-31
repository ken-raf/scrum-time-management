'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Plus, X } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { suggestAvatarId } from '@/lib/avatars';
import { sfx } from '@/lib/sound';
import { AvatarPicker } from '@/components/avatar/AvatarPicker';
import { Avatar } from '@/components/avatar/Avatar';

const QUICK_TIMES = ['01:00', '01:30', '02:00', '03:00'];

interface AddParticipantModalProps {
  open: boolean;
  onClose: () => void;
}

/** Adds participants one after another without leaving the modal. */
export function AddParticipantModal({ open, onClose }: AddParticipantModalProps) {
  const t = useTranslations('participants');
  const addParticipant = useMeetingStore((s) => s.addParticipant);
  const [name, setName] = useState('');
  const [timeInput, setTimeInput] = useState('02:00');
  const [avatar, setAvatar] = useState('ani-fox');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ name: string; avatar: string; key: number } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Fresh form and an unused animal each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setName('');
    setTimeInput('02:00');
    setError(null);
    setAdded(null);
    setAvatar(suggestAvatarId(useMeetingStore.getState().participants.map((p) => p.avatar)));
    const id = setTimeout(() => nameRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('errors.nameRequired'));
      nameRef.current?.focus();
      return;
    }
    const m = /^(\d{1,2}):(\d{2})$/.exec(timeInput.trim());
    if (!m || Number(m[2]) > 59 || Number(m[1]) * 60 + Number(m[2]) === 0) {
      setError(t('errors.timeFormat'));
      return;
    }
    addParticipant(trimmed, Number(m[1]) * 60 + Number(m[2]), avatar);
    sfx.pop();
    setAdded({ name: trimmed, avatar, key: Date.now() });
    setName('');
    setError(null);
    setAvatar(suggestAvatarId([...useMeetingStore.getState().participants.map((p) => p.avatar), avatar]));
    nameRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-participant-title"
        >
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="card max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] sm:p-6"
          >
            <div className="mb-5 flex items-center gap-4">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={avatar}
                  initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                >
                  <Avatar avatarId={avatar} seed={avatar} mood={name.trim() ? 'done' : 'waiting'} size={64} />
                </motion.div>
              </AnimatePresence>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">{t('eyebrow')}</p>
                <h2 id="add-participant-title" className="mt-1 text-xl font-semibold tracking-tight">
                  {t('addParticipant')}
                </h2>
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label={t('close')}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
                <label className="grid gap-1.5">
                  <span className="text-xs text-foreground-muted">{t('name')}</span>
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    className="field"
                    placeholder={t('namePlaceholder')}
                    autoComplete="off"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs text-foreground-muted">{t('allocatedTime')}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={timeInput}
                    onChange={(e) => {
                      setTimeInput(e.target.value);
                      setError(null);
                    }}
                    className="field font-mono tabular"
                    placeholder="02:00"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_TIMES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setTimeInput(q)}
                    aria-pressed={timeInput === q}
                    className="rounded-full border border-border px-3 py-1 font-mono text-xs text-foreground-muted transition-colors hover:text-foreground aria-pressed:border-primary aria-pressed:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="grid gap-2">
                <span className="text-xs text-foreground-muted">{t('chooseAvatar')}</span>
                <AvatarPicker value={avatar} onChange={setAvatar} size={46} />
              </div>

              <div className="min-h-6" aria-live="polite">
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-error" role="alert">
                      {error}
                    </motion.p>
                  ) : added ? (
                    <motion.p
                      key={added.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-sm text-success"
                    >
                      <Check size={16} />
                      <Avatar avatarId={added.avatar} seed={added.avatar} mood="celebrate" size={24} />
                      {t('added', { name: added.name })}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  {t('done')}
                </button>
                <button type="submit" className="btn btn-primary min-w-[9rem]">
                  <Plus size={18} />
                  {t('add')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
