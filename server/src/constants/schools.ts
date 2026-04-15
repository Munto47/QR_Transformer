export const SCHOOL_OPTIONS = [
  "赣南师范大学",
  "江西师范大学",
  "江西科技学院",
  "南昌航空大学",
  "其他",
] as const;

export type School = (typeof SCHOOL_OPTIONS)[number];

export function isValidSchool(value: string): value is School {
  return (SCHOOL_OPTIONS as readonly string[]).includes(value);
}
