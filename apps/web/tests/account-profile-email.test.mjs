import { describe, expect, test } from "bun:test";

import {
  hasAccountEmailChanged,
  resolveAccountProfile,
} from "../lib/account/profile.ts";

describe("account profile email", () => {
  test("keeps the signed-in user's email when the public profile omits it", () => {
    const publicProfile = {
      id: 7,
      username: "remix",
      first_name: "Re",
      last_name: "Mix",
      bio: "",
      details: {},
    };
    const sessionUser = {
      id: 7,
      email: "martin.hsuching@gmail.com",
    };

    expect(resolveAccountProfile(publicProfile, sessionUser)).toEqual({
      ...publicProfile,
      email: "martin.hsuching@gmail.com",
    });
  });

  test("does not report an unchanged email as changed", () => {
    expect(
      hasAccountEmailChanged(
        "martin.hsuching@gmail.com",
        "martin.hsuching@gmail.com",
      ),
    ).toBe(false);
  });
});
