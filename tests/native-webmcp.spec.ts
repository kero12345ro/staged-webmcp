import { expect, test, type Page } from "@playwright/test";

type ToolRecord = {
  name: string;
  title?: string;
};

type ToolResult = {
  ok: boolean;
  status: string;
  planId?: string;
  blockedOperations?: Array<{
    taskId: string;
    attempted: string;
    reason: string;
  }>;
  receipt?: {
    id: string;
    beforeVersion: number;
    afterVersion: number;
    operationCount: number;
  };
  boardVersion?: number;
  approvalDigest?: string;
  approvedCapability?: {
    digest: string;
    baseHash: string;
    expiresAt: number;
    operationCount: number;
  } | null;
  tasks?: Array<{
    id: string;
    column: string;
    assignee: string;
  }>;
};

async function nativeToolNames(page: Page) {
  return page.evaluate(async () => {
    const context = (
      document as Document & {
        modelContext?: {
          getTools(): Promise<ToolRecord[]>;
        };
      }
    ).modelContext;

    if (!context) return null;
    return (await context.getTools()).map((tool) => tool.name).sort();
  });
}

async function executeNativeTool(
  page: Page,
  name: string,
  input: Record<string, unknown>,
) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const context = (
        document as Document & {
          modelContext?: {
            getTools(): Promise<ToolRecord[]>;
            executeTool(tool: ToolRecord, inputJson: string): Promise<string | null>;
          };
        }
      ).modelContext;

      if (!context) throw new Error("document.modelContext is unavailable");

      const tools = await context.getTools();
      const tool = tools.find((candidate) => candidate.name === toolName);
      if (!tool) throw new Error("Native tool is unavailable: " + toolName);

      const raw = await context.executeTool(tool, JSON.stringify(toolInput));
      if (raw === null) throw new Error("Tool returned no result");
      return JSON.parse(raw) as ToolResult;
    },
    { toolName: name, toolInput: input },
  );
}

async function executeNativeToolTwice(
  page: Page,
  name: string,
  input: Record<string, unknown>,
) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const context = (
        document as Document & {
          modelContext?: {
            getTools(): Promise<ToolRecord[]>;
            executeTool(tool: ToolRecord, inputJson: string): Promise<string | null>;
          };
        }
      ).modelContext;

      if (!context) throw new Error("document.modelContext is unavailable");

      const tool = (await context.getTools()).find(
        (candidate) => candidate.name === toolName,
      );
      if (!tool) throw new Error("Native tool is unavailable: " + toolName);

      const [first, second] = await Promise.all([
        context.executeTool(tool, JSON.stringify(toolInput)),
        context.executeTool(tool, JSON.stringify(toolInput)),
      ]);
      if (first === null || second === null) {
        throw new Error("A concurrent tool call returned no result");
      }
      return [JSON.parse(first) as ToolResult, JSON.parse(second) as ToolResult];
    },
    { toolName: name, toolInput: input },
  );
}

const baseTools = [
  "get_launch_board",
  "inspect_staged_plan",
  "stage_plan",
];

test("human approval dynamically grants and consumes an exact commit capability", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Approval should change what agents can do.",
    }),
  ).toBeVisible();

  await expect(page.getByText("Native WebMCP connected")).toBeVisible();

  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);

  const staged = await executeNativeTool(page, "stage_plan", {
    summary: "Prepare the Friday launch board on an isolated branch.",
    operations: [
      {
        type: "assign",
        taskId: "OPS-31",
        value: "Maya Chen",
        reason: "Checkout reliability belongs with the launch owner.",
      },
      {
        type: "move",
        taskId: "OPS-31",
        value: "this-week",
        reason: "The overdue checkout issue blocks launch.",
      },
      {
        type: "archive",
        taskId: "OPS-27",
        value: "duplicate",
        reason: "The work is already tracked elsewhere.",
      },
      {
        type: "move",
        taskId: "BILL-8",
        value: "this-week",
        reason: "The task is stale.",
      },
    ],
  });

  expect(staged).toMatchObject({
    ok: true,
    status: "staged",
  });
  expect(staged.blockedOperations).toEqual([
    expect.objectContaining({
      taskId: "BILL-8",
      attempted: "move",
    }),
  ]);

  await expect(page.getByText("Canonical board is still v12")).toBeVisible();
  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);

  await page.getByRole("combobox").selectOption("Jon Bell");
  await expect(page.getByRole("combobox")).toHaveValue("Jon Bell");

  await page
    .getByRole("button", { name: "Compile capability · 3 operations" })
    .click();

  await expect
    .poll(() => nativeToolNames(page))
    .toEqual(["commit_plan", ...baseTools].sort());

  const inspected = await executeNativeTool(
    page,
    "inspect_staged_plan",
    {},
  );
  expect(inspected.approvedCapability).toMatchObject({
    digest: expect.stringMatching(/^[a-f0-9]{64}$/),
    operationCount: 3,
  });
  await expect(page.getByTestId("approval-digest")).toContainText(
    inspected.approvedCapability?.digest.slice(0, 16) ?? "missing",
  );

  const [committed, concurrentReplay] = await executeNativeToolTwice(
    page,
    "commit_plan",
    {},
  );

  expect(committed).toMatchObject({
    ok: true,
    status: "committed",
    receipt: {
      beforeVersion: 12,
      afterVersion: 13,
      operationCount: 3,
    },
  });
  expect(concurrentReplay).toMatchObject({
    ok: true,
    status: "committed",
    approvalDigest: committed.approvalDigest,
    receipt: {
      id: committed.receipt?.id,
      beforeVersion: 12,
      afterVersion: 13,
    },
  });

  const canonicalBoard = await executeNativeTool(
    page,
    "get_launch_board",
    {},
  );
  expect(
    canonicalBoard.tasks?.find((task) => task.id === "OPS-31"),
  ).toMatchObject({
    assignee: "Jon Bell",
    column: "this-week",
  });

  await expect(page.getByRole("heading", { name: "Approved plan landed." })).toBeVisible();
  await expect
    .poll(() => nativeToolNames(page))
    .toEqual([...baseTools, "undo_commit"].sort());

  const reverted = await executeNativeTool(page, "undo_commit", {});

  expect(reverted).toMatchObject({
    ok: true,
    status: "reverted",
    boardVersion: 14,
  });

  await expect(page.getByRole("heading", { name: "Commit safely undone." })).toBeVisible();
  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);
});

test("revoking approval removes commit_plan without changing canonical state", async ({
  page,
}) => {
  await page.goto("/");
  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);

  await executeNativeTool(page, "stage_plan", {
    summary: "Stage one reversible assignment.",
    operations: [
      {
        type: "assign",
        taskId: "OPS-31",
        value: "Jon Bell",
        reason: "Prepare a reviewable ownership change.",
      },
    ],
  });

  await page
    .getByRole("button", { name: "Compile capability · 1 operations" })
    .click();

  await expect
    .poll(() => nativeToolNames(page))
    .toContain("commit_plan");

  await page.getByRole("button", { name: "Revoke" }).click();

  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);
  await expect(page.getByText("Canonical board is still v12")).toBeVisible();
});

test("an unused capability expires and disappears after its exact TTL", async ({
  page,
}) => {
  await page.clock.install({
    time: new Date("2026-08-29T12:00:00.000Z"),
  });
  await page.goto("/");
  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);

  await executeNativeTool(page, "stage_plan", {
    summary: "Stage one time-bounded assignment.",
    operations: [
      {
        type: "assign",
        taskId: "OPS-31",
        value: "Jon Bell",
        reason: "Prove expiry without changing canonical state.",
      },
    ],
  });

  await page
    .getByRole("button", { name: "Compile capability · 1 operations" })
    .click();
  await expect.poll(() => nativeToolNames(page)).toContain("commit_plan");

  await page.clock.fastForward(60_001);

  await expect.poll(() => nativeToolNames(page)).toEqual(baseTools);
  await expect(
    page.getByText("The one-time commit capability expired without being used."),
  ).toBeVisible();
  await expect(page.getByText("Canonical board is still v12")).toBeVisible();
});
