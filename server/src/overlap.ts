/**
 * Slot Overlap & Time Window Validation Engine
 * --------------------------------------------
 * Prevents double-opening overlapping or duplicate time slots for a professional
 * on the same date.
 */

export interface TimeWindow {
  date: string;
  professionalId: string;
  startTime: string;
  endTime: string;
}

export function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function isValidTimeWindow(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) return false;
  return startTime < endTime;
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Filters a batch of candidate slots against existing slots (and deduplicates
 * within the candidate batch itself) so no overlapping slots are created for
 * the same professional on the same date.
 */
export function filterNonOverlappingSlots<T extends TimeWindow>(
  candidates: T[],
  existing: TimeWindow[],
): { accepted: T[]; skippedCount: number } {
  const accepted: T[] = [];
  let skippedCount = 0;

  for (const candidate of candidates) {
    if (!isValidTimeWindow(candidate.startTime, candidate.endTime)) {
      skippedCount++;
      continue;
    }

    const conflictsWithExisting = existing.some(
      (ex) =>
        ex.professionalId === candidate.professionalId &&
        ex.date === candidate.date &&
        timesOverlap(candidate.startTime, candidate.endTime, ex.startTime, ex.endTime),
    );

    const conflictsWithAccepted = accepted.some(
      (acc) =>
        acc.professionalId === candidate.professionalId &&
        acc.date === candidate.date &&
        timesOverlap(candidate.startTime, candidate.endTime, acc.startTime, acc.endTime),
    );

    if (conflictsWithExisting || conflictsWithAccepted) {
      skippedCount++;
    } else {
      accepted.push(candidate);
    }
  }

  return { accepted, skippedCount };
}

/**
 * Determines whether an open availability slot has passed its booking cutoff threshold.
 * Example: slot at 09:30 with cutoffMinutes = 15 disappears once current time is 09:16
 * (i.e. remaining minutes until slot start is strictly less than cutoffMinutes, or <= 0 when cutoffMinutes is 0).
 */
export function isSlotExpiredByCutoff(
  slotDate: string,
  slotStartTime: string,
  cutoffMinutes: number | null | undefined,
  nowDateStr: string,
  nowTimeStr: string,
): boolean {
  const [sY, sM, sD] = String(slotDate || '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  const [sH, sMin] = String(slotStartTime || '00:00')
    .split(':')
    .map(Number);
  const [nY, nM, nD] = String(nowDateStr || '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  const [nH, nMin] = String(nowTimeStr || '00:00')
    .split(':')
    .map(Number);

  if (!sY || !sM || !sD || !nY || !nM || !nD) return false;

  const slotStartMs = Date.UTC(sY, sM - 1, sD, sH || 0, sMin || 0, 0, 0);
  const nowMs = Date.UTC(nY, nM - 1, nD, nH || 0, nMin || 0, 0, 0);
  const remainingMinutes = Math.floor((slotStartMs - nowMs) / 60_000);
  const cutoff = Math.max(0, Number(cutoffMinutes ?? 15) || 0);

  if (cutoff === 0) {
    return remainingMinutes <= 0;
  }
  return remainingMinutes < cutoff;
}

