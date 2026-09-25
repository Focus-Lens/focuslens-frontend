import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmailChildSetupInvitation,
  createLinkChildSetupInvitation,
  getChildSetupValidationMessage,
  getDraftProfileSetupMode,
  saveProfileSetupModeAndContinue,
} from "../src/services/childSetupFlow.js";

const draftId = "draft-123";

for (const profileSetupMode of ["ParentManaged", "ChildManaged"]) {
  test(`Continue saves ${profileSetupMode} before navigating and does not invite`, async () => {
    const calls = [];
    const order = [];

    await saveProfileSetupModeAndContinue({
      draftId,
      profileSetupMode,
      request: async (...args) => {
        calls.push(args);
        order.push("request");
        return null; // The API returns 204 No Content.
      },
      onSaved: (mode) => {
        assert.equal(mode, profileSetupMode);
        order.push("saved");
      },
      navigate: (path) => {
        assert.equal(path, profileSetupMode === "ParentManaged" ? "/setup-intro" : "/setup/send-link");
        order.push("navigate");
      },
      nextPath: profileSetupMode === "ParentManaged" ? "/setup-intro" : "/setup/send-link",
    });

    assert.deepEqual(calls, [[
      `/api/parents/child-setups/${draftId}/profile-setup-mode`,
      { method: "PUT", body: { profileSetupMode } },
    ]]);
    assert.deepEqual(order, ["request", "saved", "navigate"]);
    assert.equal(calls.some(([path]) => path.includes("/invite")), false);
  });
}

test("Continue does not navigate when the mode save is rejected with backend validation", async () => {
  const calls = [];
  let navigated = false;

  await assert.rejects(
    saveProfileSetupModeAndContinue({
      draftId,
      profileSetupMode: "ParentManaged",
      request: async (...args) => {
        calls.push(args);
        const error = new Error("Invalid profile setup mode.");
        error.status = 400;
        error.details = { code: "ChildSetup.ProfileSetupModeRequired" };
        throw error;
      },
      navigate: () => { navigated = true; },
      nextPath: "/setup-intro",
    }),
  );

  assert.equal(calls.length, 1);
  assert.equal(navigated, false);
});

test("Continue requires a draft and a selected mode", async () => {
  let requestCount = 0;
  const request = async () => { requestCount += 1; };

  await assert.rejects(saveProfileSetupModeAndContinue({
    draftId: "",
    profileSetupMode: "ParentManaged",
    request,
    navigate() {},
    nextPath: "/setup-intro",
  }), /draft is missing/);

  await assert.rejects(saveProfileSetupModeAndContinue({
    draftId,
    profileSetupMode: null,
    request,
    navigate() {},
    nextPath: "/setup-intro",
  }), /Choose who/);

  assert.equal(requestCount, 0);
});

test("draft loading preserves profileSetupMode, including null", () => {
  assert.equal(getDraftProfileSetupMode({ profileSetupMode: "ParentManaged" }), "ParentManaged");
  assert.equal(getDraftProfileSetupMode({ profileSetupMode: "ChildManaged" }), "ChildManaged");
  assert.equal(getDraftProfileSetupMode({ profileSetupMode: null }, "ParentManaged"), null);
  assert.equal(getDraftProfileSetupMode({}, "ChildManaged"), "ChildManaged");
});

test("email invitation is created with one explicit delivery request", async () => {
  const calls = [];
  await createEmailChildSetupInvitation(draftId, "child@example.com", async (...args) => {
    calls.push(args);
    return { id: "email-invitation" };
  });

  assert.deepEqual(calls, [[
    `/api/parents/child-setups/${draftId}/invite`,
    { method: "POST", body: { childEmail: "child@example.com" } },
  ]]);
});

test("link invitation is created with one explicit delivery request", async () => {
  const calls = [];
  await createLinkChildSetupInvitation(draftId, async (...args) => {
    calls.push(args);
    return { invitationUrl: "https://focuslens.example/invite/token" };
  });

  assert.deepEqual(calls, [[
    `/api/parents/child-setups/${draftId}/invite/link/create`,
    { method: "POST" },
  ]]);
});

test("backend setup validation codes get user-facing messages", () => {
  assert.match(
    getChildSetupValidationMessage({ details: { code: "ChildSetup.Incomplete" } }),
    /Complete the required child profile/,
  );
  assert.match(
    getChildSetupValidationMessage({ message: "ChildSetup.ProfileSetupModeRequired" }),
    /Choose who will set up/,
  );
  assert.equal(getChildSetupValidationMessage({ message: "Other error" }), null);
});
