/** 관리자가 부여할 수 있는 직업 목록 (7가지) */
export const JOB_OPTIONS = [
  "국세청장",
  "은행원",
  "경찰서장",
  "낙농업자",
  "에너지지킴이",
  "청소업자",
  "날쌘돌이",
] as const;

export type JobType = (typeof JOB_OPTIONS)[number];

export function isValidJob(value: string | null | undefined): value is JobType {
  if (!value) return false;
  return (JOB_OPTIONS as readonly string[]).includes(value);
}
