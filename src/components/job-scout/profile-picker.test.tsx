import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfilePicker } from "@/components/job-scout/profile-picker";
import type { Profile } from "@/lib/api";
import { ApiError } from "@/lib/api-error";

const profile: Profile = {
  id: "profile-1",
  display_name: "Gui",
  preferences: {
    query: "",
    location: "",
    country: null,
    worldwide: null,
    seniority: [],
    employment_types: [],
    providers: [],
    minimum_salary: null,
    posted_within_days: null,
    sort: "relevance",
  },
  skills: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

afterEach(cleanup);

function renderPicker(
  overrides?: Partial<Profile> & {
    onUpdateSkills?: (labels: string[]) => Promise<Profile | undefined>;
  },
) {
  const onUpdateSkills =
    overrides?.onUpdateSkills ??
    vi.fn(async (labels: string[]) => ({
      ...profile,
      ...overrides,
      skills: labels.map((label) => ({ label, token: label.toLowerCase() })),
    }));

  const current: Profile = {
    ...profile,
    ...overrides,
    skills: overrides?.skills ?? profile.skills,
  };

  render(
    <ProfilePicker
      profiles={[current]}
      profile={current}
      onSelect={vi.fn()}
      onCreate={vi.fn()}
      onRename={vi.fn()}
      onUpdateSkills={onUpdateSkills}
      skillsOpen
      onSkillsOpenChange={vi.fn()}
    />,
  );

  return { onUpdateSkills };
}

describe("ProfilePicker skills editor", () => {
  it("presents an empty skill list as an opportunity", () => {
    renderPicker();
    expect(screen.getByText(/Add skills you care about/i)).toBeInTheDocument();
    expect(screen.getByText(/re-rank the next search/i)).toBeInTheDocument();
  });

  it("adds and removes skills, then saves labels only", async () => {
    const onUpdateSkills = vi.fn(async (labels: string[]) => ({
      ...profile,
      skills: labels.map((label) => ({ label, token: label.toLowerCase() })),
    }));
    renderPicker({
      skills: [{ label: "Python", token: "python" }],
      onUpdateSkills,
    });

    expect(screen.getByText("Python")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("New skill"), {
      target: { value: "TypeScript" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Python" }));
    expect(screen.queryByText("Python")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save skills" }));
    await waitFor(() => {
      expect(onUpdateSkills).toHaveBeenCalledWith(["TypeScript"]);
    });
    const payload = onUpdateSkills.mock.calls[0][0] as string[];
    expect(payload.every((label) => typeof label === "string")).toBe(true);
  });

  it("shows inline validation for duplicates and length", () => {
    renderPicker({
      skills: [{ label: "Python", token: "python" }],
    });

    fireEvent.change(screen.getByLabelText("New skill"), {
      target: { value: "python" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /already on this profile/i,
    );

    fireEvent.change(screen.getByLabelText("New skill"), {
      target: { value: "x".repeat(61) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /at most 60 characters/i,
    );
  });

  it("surfaces a server 422 as readable text", async () => {
    const onUpdateSkills = vi.fn(async () => {
      throw new ApiError(
        422,
        'Duplicate skill token "kubernetes": "k8s" and "Kubernetes"',
      );
    });
    renderPicker({ onUpdateSkills });

    fireEvent.change(screen.getByLabelText("New skill"), {
      target: { value: "k8s" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Save skills" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Duplicate skill token/i,
      );
    });
  });
});
