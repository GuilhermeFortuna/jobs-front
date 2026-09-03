import { describe, expect, it } from "vitest";

import {
  MAX_SKILL_LABEL_LENGTH,
  MAX_SKILLS,
  validateSkillLabel,
} from "@/lib/skills";

describe("validateSkillLabel", () => {
  it("rejects empty labels", () => {
    expect(validateSkillLabel("   ", [])).toBe("Enter a skill label");
  });

  it("rejects labels over the length cap", () => {
    expect(validateSkillLabel("x".repeat(MAX_SKILL_LABEL_LENGTH + 1), [])).toBe(
      `Skill label must be at most ${MAX_SKILL_LABEL_LENGTH} characters`,
    );
  });

  it("rejects when the profile already has the cap", () => {
    const existing = Array.from(
      { length: MAX_SKILLS },
      (_, index) => `skill-${index}`,
    );
    expect(validateSkillLabel("Python", existing)).toBe(
      `At most ${MAX_SKILLS} skills are allowed per profile`,
    );
  });

  it("rejects case-insensitive exact duplicates", () => {
    expect(validateSkillLabel("python", ["Python"])).toBe(
      'Skill "python" is already on this profile',
    );
  });

  it("accepts a valid new label", () => {
    expect(validateSkillLabel("  TypeScript  ", ["Python"])).toBeNull();
  });
});
