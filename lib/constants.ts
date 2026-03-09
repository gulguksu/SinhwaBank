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

/** 특수 기능이 있는 직업 (직업별 페이지/세션 추가) */
export const JOB_WITH_SPECIAL_PAGE = ["국세청장", "은행원", "경찰서장"] as const;

/** 직업 이름 → 대시보드용 경로 slug */
export const JOB_TO_SLUG: Record<string, string> = {
  국세청장: "tax-commissioner",
  은행원: "banker",
  경찰서장: "police",
};

export const SLUG_TO_JOB: Record<string, string> = {
  "tax-commissioner": "국세청장",
  banker: "은행원",
  police: "경찰서장",
};

/** 은행원 지급 내역 드롭다운 옵션 */
export const BANK_PAYMENT_DESCRIPTIONS = ["월급", "예금 만기", "예금 중도 포기금"] as const;

export function isValidJob(value: string | null | undefined): value is JobType {
  if (!value) return false;
  return (JOB_OPTIONS as readonly string[]).includes(value);
}

export function hasJobSpecialPage(job: string | null | undefined): boolean {
  if (!job) return false;
  return (JOB_WITH_SPECIAL_PAGE as readonly string[]).includes(job);
}
