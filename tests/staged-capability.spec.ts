import { expect, test } from "@playwright/test";

import { compileCapability } from "@/lib/staged-capability";

const baseHash = "a".repeat(64);

test("capability compiler canonicalizes, clones, freezes, and binds TTL", async () => {
  const source = {
    operations: [
      {
        id: "OP-1",
        taskId: "OPS-31",
        value: "Jon Bell",
      },
    ],
    policy: {
      namespace: "launch",
      reversible: true,
    },
  };

  const compiled = await compileCapability({
    subjectId: "PLAN-1",
    baseVersion: 12,
    baseHash,
    payload: source,
    ttlMs: 60_000,
    now: () => 1_000,
  });

  expect(compiled).toMatchObject({
    subjectId: "PLAN-1",
    baseVersion: 12,
    baseHash,
    approvedAt: 1_000,
    expiresAt: 61_000,
    digest: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
  expect(Object.isFrozen(compiled)).toBe(true);
  expect(Object.isFrozen(compiled.payload)).toBe(true);
  expect(Object.isFrozen(compiled.payload.operations)).toBe(true);
  expect(Object.isFrozen(compiled.payload.operations[0])).toBe(true);

  source.operations[0].value = "Maya Chen";
  expect(compiled.payload.operations[0].value).toBe("Jon Bell");

  const sameMeaningDifferentKeyOrder = await compileCapability({
    subjectId: "PLAN-1",
    baseVersion: 12,
    baseHash,
    payload: {
      policy: {
        reversible: true,
        namespace: "launch",
      },
      operations: [
        {
          value: "Jon Bell",
          taskId: "OPS-31",
          id: "OP-1",
        },
      ],
    },
    ttlMs: 60_000,
    now: () => 1_000,
  });

  expect(sameMeaningDifferentKeyOrder.digest).toBe(compiled.digest);
});

test("changing one reviewed field changes the compiled capability digest", async () => {
  const common = {
    subjectId: "PLAN-1",
    baseVersion: 12,
    baseHash,
    ttlMs: 60_000,
    now: () => 1_000,
  };

  const first = await compileCapability({
    ...common,
    payload: [{ taskId: "OPS-31", assignee: "Maya Chen" }],
  });
  const edited = await compileCapability({
    ...common,
    payload: [{ taskId: "OPS-31", assignee: "Jon Bell" }],
  });

  expect(edited.digest).not.toBe(first.digest);
});
