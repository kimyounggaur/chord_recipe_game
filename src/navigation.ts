import type { Mode } from './game';
import type { SaveData } from './storage';

/** Silent and audible entry must resolve exactly the same saved progress. */
export function homeDestination(saved: Pick<SaveData, 'resume' | 'tutorial'>): { mode: Mode; id: string; resume: boolean } {
  if (!saved.resume) return { mode: 'tutorial', id: 'L01', resume: false };
  if (saved.resume.mode === 'tutorial' && saved.tutorial.checkpoint >= 13) return { mode: 'order', id: 'L04', resume: false };
  return { mode: saved.resume.mode || 'order', id: saved.resume.lessonId, resume: true };
}
