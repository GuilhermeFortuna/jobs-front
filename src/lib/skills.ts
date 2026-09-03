export const MAX_SKILLS = 50;
export const MAX_SKILL_LABEL_LENGTH = 60;

export function validateSkillLabel(
  label: string,
  existingLabels: string[],
): string | null {
  const trimmed = label.trim();
  if (!trimmed) {
    return "Enter a skill label";
  }
  if (trimmed.length > MAX_SKILL_LABEL_LENGTH) {
    return `Skill label must be at most ${MAX_SKILL_LABEL_LENGTH} characters`;
  }
  if (existingLabels.length >= MAX_SKILLS) {
    return `At most ${MAX_SKILLS} skills are allowed per profile`;
  }
  const normalized = trimmed.toLocaleLowerCase();
  if (
    existingLabels.some(
      (item) => item.trim().toLocaleLowerCase() === normalized,
    )
  ) {
    return `Skill "${trimmed}" is already on this profile`;
  }
  return null;
}
