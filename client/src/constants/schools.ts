/** 与 server/src/constants/schools.ts 保持一致 */
export const SCHOOL_OPTIONS = [
  "赣南师范大学",
  "江西师范大学",
  "江西科技学院",
  "南昌航空大学",
  "其他",
] as const;

export type School = (typeof SCHOOL_OPTIONS)[number];

/** 近期活动侧栏默认筛选学校 */
export const DEFAULT_ACTIVITY_SCHOOL: School = "南昌航空大学";
