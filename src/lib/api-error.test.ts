import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

describe("ApiError", () => {
  it("flags expired searches", () => {
    const error = new ApiError(410, "Search not found or expired");
    expect(error.isExpired).toBe(true);
    expect(error.isConflict).toBe(false);
  });

  it("flags duplicate profile names", () => {
    const error = new ApiError(409, "A profile with that name already exists");
    expect(error.isConflict).toBe(true);
  });
});
