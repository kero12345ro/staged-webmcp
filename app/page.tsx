"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ColumnId = "backlog" | "this-week" | "done";
type OperationType = "assign" | "move" | "archive";

type Task = {
  id: string;
  title: string;
  column: ColumnId;
  assignee: string;
  tag: string;
  color: "violet" | "cyan" | "amber";
  due: string;
  archived?: boolean;
  protected?: boolean;
};

type PlanOperation = {
  id: string;
  type: OperationType;
  taskId: string;
  value: string;
  reason: string;
  enabled: boolean;
};

type BlockedOperation = {
  taskId: string;
  attempted: string;
  reason: string;
};

type StagedPlan = {
  id: string;
  summary: string;
  baseVersion: number;
  createdAt: number;
  operations: PlanOperation[];
  blocked: BlockedOperation[];
};

type Approval = {
  planId: string;
  expiresAt: number;
};

type Receipt = {
  id: string;
  planId: string;
  committedAt: number;
  beforeVersion: number;
  afterVersion: number;
  beforeHash: string;
  afterHash: string;
  beforeTasks: Task[];
  operations: PlanOperation[];
  status: "committed" | "reverted";
};

type ToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    options: { signal: AbortSignal },
  ) => Promise<unknown>;
};

type RegisteredTool = {
  name: string;
  [key: string]: unknown;
};

type ModelContext = {
  registerTool: (
    tool: ToolDefinition,
    options?: { signal?: AbortSignal },
  ) => Promise<void>;
  getTools: () => Promise<RegisteredTool[]>;
  executeTool: (
    tool: RegisteredTool,
    inputJson: string,
    options?: { signal?: AbortSignal },
  ) => Promise<string | null>;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

const INITIAL_TASKS: Task[] = [
  {
    id: "OPS-31",
    title: "Harden checkout retries",
    column: "backlog",
    assignee: "Unassigned",
    tag: "Infrastructure",
    color: "violet",
    due: "Overdue 1d",
  },
  {
    id: "OPS-27",
    title: "Remove duplicate analytics event",
    column: "backlog",
    assignee: "Jon Bell",
    tag: "Analytics",
    color: "cyan",
    due: "Duplicate",
  },
  {
    id: "BILL-8",
    title: "Reconcile failed invoices",
    column: "backlog",
    assignee: "Finance",
    tag: "Billing",
    color: "amber",
    due: "Protected",
    protected: true,
  },
  {
    id: "OPS-22",
    title: "Prepare release checklist",
    column: "this-week",
    assignee: "Maya Chen",
    tag: "Launch",
    color: "violet",
    due: "Today",
  },
  {
    id: "OPS-19",
    title: "Update incident runbook",
    column: "this-week",
    assignee: "Jon Bell",
    tag: "Reliability",
    color: "cyan",
    due: "Tomorrow",
  },
  {
    id: "OPS-14",
    title: "Verify rollback window",
    column: "done",
    assignee: "Maya Chen",
    tag: "Launch",
    color: "violet",
    due: "Done",
  },
];

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "this-week", label: "This week" },
  { id: "done", label: "Done" },
];

const DEMO_INPUT = {
  summary: "Clean up Friday launch work without directly changing production.",
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
      reason: "The overdue checkout issue blocks Friday launch.",
    },
    {
      type: "archive",
      taskId: "OPS-27",
      value: "duplicate",
      reason: "The same analytics fix is already tracked in OPS-22.",
    },
    {
      type: "move",
      taskId: "BILL-8",
      value: "this-week",
      reason: "It is stale work near the launch window.",
    },
  ],
};

function cloneTasks(tasks: Task[]) {
  return tasks.map((task) => ({ ...task }));
}

function applyOperations(tasks: Task[], operations: PlanOperation[]) {
  return tasks.map((task) => {
    const relevant = operations.filter(
      (operation) => operation.enabled && operation.taskId === task.id,
    );
    return relevant.reduce<Task>((next, operation) => {
      if (operation.type === "assign") {
        return { ...next, assignee: operation.value };
      }
      if (operation.type === "move") {
        return { ...next, column: operation.value as ColumnId };
      }
      return { ...next, archived: true };
    }, task);
  });
}

async function stateHash(tasks: Task[]) {
  const canonical = JSON.stringify(tasks);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(canonical),
    );
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function shortId(prefix: string) {
  return (
    prefix +
    "-" +
    Date.now().toString(36).slice(-5).toUpperCase() +
    Math.random().toString(36).slice(2, 4).toUpperCase()
  );
}

function operationLabel(operation: PlanOperation, tasks: Task[]) {
  const task = tasks.find((candidate) => candidate.id === operation.taskId);
  if (operation.type === "assign") {
    return {
      verb: "Assign",
      title: task?.title ?? operation.taskId,
      detail: "Unassigned → " + operation.value,
    };
  }
  if (operation.type === "move") {
    return {
      verb: "Move",
      title: task?.title ?? operation.taskId,
      detail: "Backlog → " + (operation.value === "this-week" ? "This week" : "Done"),
    };
  }
  return {
    verb: "Archive",
    title: task?.title ?? operation.taskId,
    detail: "Active → Archived",
  };
}

function normalizePlanInput(
  input: Record<string, unknown>,
  tasks: Task[],
  version: number,
): { plan?: StagedPlan; error?: string } {
  if (!Array.isArray(input.operations) || input.operations.length === 0) {
    return { error: "operations must contain at least one proposed change" };
  }

  const operations: PlanOperation[] = [];
  const blocked: BlockedOperation[] = [];

  input.operations.slice(0, 8).forEach((raw, index) => {
    if (!raw || typeof raw !== "object") {
      blocked.push({
        taskId: "unknown",
        attempted: "invalid",
        reason: "Operation is not a structured object.",
      });
      return;
    }

    const candidate = raw as Record<string, unknown>;
    const type = candidate.type;
    const taskId = candidate.taskId;
    const value = candidate.value;
    const reason = candidate.reason;
    const task = tasks.find((item) => item.id === taskId);

    if (
      (type !== "assign" && type !== "move" && type !== "archive") ||
      typeof taskId !== "string" ||
      typeof value !== "string" ||
      typeof reason !== "string"
    ) {
      blocked.push({
        taskId: typeof taskId === "string" ? taskId : "unknown",
        attempted: typeof type === "string" ? type : "invalid",
        reason: "Operation failed contract validation.",
      });
      return;
    }

    if (!task) {
      blocked.push({
        taskId,
        attempted: type,
        reason: "Task does not exist in the current board version.",
      });
      return;
    }

    if (task.protected) {
      blocked.push({
        taskId,
        attempted: type,
        reason: "Billing policy requires a finance-owner workflow.",
      });
      return;
    }

    if (
      type === "move" &&
      value !== "backlog" &&
      value !== "this-week" &&
      value !== "done"
    ) {
      blocked.push({
        taskId,
        attempted: type,
        reason: "Destination column is not valid.",
      });
      return;
    }

    operations.push({
      id: "OP-" + (index + 1),
      type,
      taskId,
      value,
      reason,
      enabled: true,
    });
  });

  if (operations.length === 0) {
    return { error: "Every proposed operation was rejected by policy or validation." };
  }

  return {
    plan: {
      id: shortId("PLAN"),
      summary:
        typeof input.summary === "string"
          ? input.summary.slice(0, 280)
          : "Agent-proposed board changes",
      baseVersion: version,
      createdAt: Date.now(),
      operations,
      blocked,
    },
  };
}

function StatusDot({ tone = "green" }: { tone?: "green" | "amber" | "gray" }) {
  const color =
    tone === "green"
      ? "bg-[#b7f34a]"
      : tone === "amber"
        ? "bg-amber-400"
        : "bg-stone-400";
  return <span className={"inline-block h-2 w-2 rounded-full " + color} />;
}

export default function StagedApp() {
  const [tasks, setTasks] = useState<Task[]>(() => cloneTasks(INITIAL_TASKS));
  const [version, setVersion] = useState(12);
  const [plan, setPlan] = useState<StagedPlan | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [webMcpStatus, setWebMcpStatus] = useState<
    "checking" | "native" | "preview" | "error"
  >("checking");
  const [activity, setActivity] = useState(
    "Waiting for an agent or the guided demo.",
  );
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);

  const tasksRef = useRef(tasks);
  const versionRef = useRef(version);
  const planRef = useRef(plan);
  const approvalRef = useRef(approval);
  const receiptRef = useRef(receipt);
  const localToolsRef = useRef(new Map<string, ToolDefinition>());
  const commitPromisesRef = useRef(new Map<string, Promise<unknown>>());

  const setPlanState = useCallback((next: StagedPlan | null) => {
    planRef.current = next;
    setPlan(next);
  }, []);

  const setApprovalState = useCallback((next: Approval | null) => {
    approvalRef.current = next;
    setApproval(next);
  }, []);

  const setReceiptState = useCallback((next: Receipt | null) => {
    receiptRef.current = next;
    setReceipt(next);
  }, []);

  const getBoard = useCallback(async () => {
    return {
      ok: true,
      boardVersion: versionRef.current,
      policy: "BILL-* tasks require a separate finance-owner workflow.",
      tasks: tasksRef.current
        .filter((task) => !task.archived)
        .map(({ id, title, column, assignee, tag, due, protected: locked }) => ({
          id,
          title,
          column,
          assignee,
          tag,
          due,
          locked: Boolean(locked),
        })),
    };
  }, []);

  const stagePlan = useCallback(
    async (input: Record<string, unknown>) => {
      const normalized = normalizePlanInput(
        input,
        tasksRef.current,
        versionRef.current,
      );

      if (!normalized.plan) {
        return { ok: false, status: "rejected", message: normalized.error };
      }

      setApprovalState(null);
      setReceiptState(null);
      setPlanState(normalized.plan);
      setActivity(
        "Agent staged " +
          normalized.plan.operations.length +
          " changes. Production is unchanged.",
      );

      return {
        ok: true,
        status: "staged",
        planId: normalized.plan.id,
        baseVersion: normalized.plan.baseVersion,
        acceptedOperations: normalized.plan.operations.length,
        blockedOperations: normalized.plan.blocked,
        message:
          "Plan is staged only. Ask the human to review the visible diff; you cannot approve it.",
      };
    },
    [setApprovalState, setPlanState, setReceiptState],
  );

  const inspectPlan = useCallback(async () => {
    const current = planRef.current;
    if (!current) {
      return {
        ok: true,
        status: "no_plan",
        message: "No staged plan exists.",
      };
    }
    return {
      ok: true,
      status: approvalRef.current ? "approved" : "awaiting_human",
      planId: current.id,
      baseVersion: current.baseVersion,
      currentBoardVersion: versionRef.current,
      operations: current.operations.filter((operation) => operation.enabled),
      blocked: current.blocked,
      commitCapabilityExposed: Boolean(approvalRef.current),
    };
  }, []);

  const commitPlan = useCallback(async () => {
    const currentPlan = planRef.current;
    const currentApproval = approvalRef.current;

    if (!currentPlan || !currentApproval || currentApproval.planId !== currentPlan.id) {
      return {
        ok: false,
        status: "not_authorized",
        message: "No exact human-approved plan is bound to this capability.",
      };
    }

    if (Date.now() > currentApproval.expiresAt) {
      setApprovalState(null);
      return {
        ok: false,
        status: "expired",
        planId: currentPlan.id,
        message: "The one-time commit capability expired. Ask the human to review again.",
      };
    }

    const existingReceipt = receiptRef.current;
    if (
      existingReceipt?.planId === currentPlan.id &&
      existingReceipt.status === "committed"
    ) {
      return {
        ok: true,
        status: "already_committed",
        planId: currentPlan.id,
        receiptId: existingReceipt.id,
        message: "This exact plan was already committed; no operation was repeated.",
      };
    }

    const existingPromise = commitPromisesRef.current.get(currentPlan.id);
    if (existingPromise) {
      return existingPromise;
    }

    const execution = (async () => {
      if (versionRef.current !== currentPlan.baseVersion) {
        return {
          ok: false,
          status: "stale",
          planId: currentPlan.id,
          message:
            "Board version changed after staging. The plan must be restaged before commit.",
        };
      }

      const selectedOperations = currentPlan.operations.filter(
        (operation) => operation.enabled,
      );
      if (selectedOperations.length === 0) {
        return {
          ok: false,
          status: "empty",
          planId: currentPlan.id,
          message: "The human removed every operation, so there is nothing to commit.",
        };
      }

      const beforeTasks = cloneTasks(tasksRef.current);
      const afterTasks = applyOperations(cloneTasks(beforeTasks), selectedOperations);
      const [beforeHash, afterHash] = await Promise.all([
        stateHash(beforeTasks),
        stateHash(afterTasks),
      ]);
      const beforeVersion = versionRef.current;
      const afterVersion = beforeVersion + 1;
      const nextReceipt: Receipt = {
        id: shortId("RCP"),
        planId: currentPlan.id,
        committedAt: Date.now(),
        beforeVersion,
        afterVersion,
        beforeHash,
        afterHash,
        beforeTasks,
        operations: selectedOperations,
        status: "committed",
      };

      tasksRef.current = afterTasks;
      versionRef.current = afterVersion;
      setTasks(afterTasks);
      setVersion(afterVersion);
      setReceiptState(nextReceipt);
      setPlanState(null);
      setActivity(
        "Agent committed the exact approved plan. Receipt " +
          nextReceipt.id +
          " is ready.",
      );

      window.setTimeout(() => setApprovalState(null), 0);

      return {
        ok: true,
        status: "committed",
        planId: currentPlan.id,
        receipt: {
          id: nextReceipt.id,
          beforeVersion,
          afterVersion,
          beforeHash,
          afterHash,
          operationCount: selectedOperations.length,
        },
        message:
          "Committed atomically. The capability is now consumed and undo is available.",
      };
    })();

    commitPromisesRef.current.set(currentPlan.id, execution);
    return execution;
  }, [setApprovalState, setPlanState, setReceiptState]);

  const undoCommit = useCallback(async () => {
    const currentReceipt = receiptRef.current;
    if (!currentReceipt || currentReceipt.status !== "committed") {
      return {
        ok: false,
        status: "unavailable",
        message: "There is no committed receipt eligible for undo.",
      };
    }

    const currentHash = await stateHash(tasksRef.current);
    if (
      versionRef.current !== currentReceipt.afterVersion ||
      currentHash !== currentReceipt.afterHash
    ) {
      return {
        ok: false,
        status: "conflict",
        message:
          "Canonical state changed after this receipt. Undo was refused to avoid overwriting newer work.",
      };
    }

    const restored = cloneTasks(currentReceipt.beforeTasks);
    const nextVersion = versionRef.current + 1;
    const revertedReceipt = { ...currentReceipt, status: "reverted" as const };

    tasksRef.current = restored;
    versionRef.current = nextVersion;
    setTasks(restored);
    setVersion(nextVersion);
    setReceiptState(revertedReceipt);
    setActivity(
      "Receipt " +
        currentReceipt.id +
        " was compensated safely. Board version is now v" +
        nextVersion +
        ".",
    );

    return {
      ok: true,
      status: "reverted",
      receiptId: currentReceipt.id,
      boardVersion: nextVersion,
      message: "The reversible board operations were restored from the receipt.",
    };
  }, [setReceiptState]);

  useEffect(() => {
    const controller = new AbortController();
    const localTools = localToolsRef.current;
    const definitions: ToolDefinition[] = [
      {
        name: "get_launch_board",
        title: "Read launch board",
        description:
          "Read the current canonical launch board, version, task ownership, and policy locks. Use before proposing changes.",
        inputSchema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => getBoard(),
      },
      {
        name: "stage_plan",
        title: "Stage a plan for human review",
        description:
          "Propose up to eight board operations on an isolated branch. This never changes canonical data and never grants approval. The human will see and edit a deterministic diff.",
        inputSchema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Short rationale shown to the human reviewer.",
              maxLength: 280,
            },
            operations: {
              type: "array",
              minItems: 1,
              maxItems: 8,
              description: "Ordered proposed board operations.",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["assign", "move", "archive"],
                  },
                  taskId: { type: "string", minLength: 1 },
                  value: {
                    type: "string",
                    description:
                      "Assignee, destination column, or archive reason.",
                  },
                  reason: {
                    type: "string",
                    description: "Why this operation helps the user's goal.",
                    maxLength: 220,
                  },
                },
                required: ["type", "taskId", "value", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "operations"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => stagePlan(input),
      },
      {
        name: "inspect_staged_plan",
        title: "Inspect staged plan status",
        description:
          "Inspect the current staged diff, policy blocks, board version, and whether a human has exposed a commit capability.",
        inputSchema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => inspectPlan(),
      },
    ];

    definitions.forEach((tool) => localTools.set(tool.name, tool));

    const register = async () => {
      if (!document.modelContext?.registerTool) {
        setWebMcpStatus("preview");
        return;
      }

      try {
        await Promise.all(
          definitions.map((tool) =>
            document.modelContext?.registerTool(tool, {
              signal: controller.signal,
            }),
          ),
        );
        setWebMcpStatus("native");
      } catch {
        setWebMcpStatus("error");
      }
    };

    void register();

    return () => {
      controller.abort();
      definitions.forEach((tool) => localTools.delete(tool.name));
    };
  }, [getBoard, inspectPlan, stagePlan]);

  useEffect(() => {
    const localTools = localToolsRef.current;
    if (!approval) {
      localTools.delete("commit_plan");
      return;
    }

    const controller = new AbortController();
    const commitTool: ToolDefinition = {
      name: "commit_plan",
      title: "Commit approved plan",
      description:
        "Commit only the exact staged plan already reviewed and approved by the human. The plan identity is closure-bound: this tool cannot create, edit, or approve a plan. It expires and disappears after one successful use.",
      inputSchema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async () => commitPlan(),
    };

    localTools.set(commitTool.name, commitTool);

    if (document.modelContext?.registerTool && webMcpStatus === "native") {
      void document.modelContext
        .registerTool(commitTool, { signal: controller.signal })
        .catch(() => setWebMcpStatus("error"));
    }

    const timeout = window.setTimeout(() => {
      if (approvalRef.current?.planId === approval.planId) {
        setApprovalState(null);
        setActivity("The one-time commit capability expired without being used.");
      }
    }, Math.max(0, approval.expiresAt - Date.now()));

    return () => {
      window.clearTimeout(timeout);
      window.setTimeout(() => controller.abort(), 0);
      localTools.delete(commitTool.name);
    };
  }, [approval, commitPlan, setApprovalState, webMcpStatus]);

  useEffect(() => {
    const localTools = localToolsRef.current;
    if (!receipt || receipt.status !== "committed") {
      localTools.delete("undo_commit");
      return;
    }

    const controller = new AbortController();
    const undoTool: ToolDefinition = {
      name: "undo_commit",
      title: "Undo committed plan",
      description:
        "Compensate the last Staged commit only if the canonical board still matches its receipt. Refuses to overwrite newer work.",
      inputSchema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async () => undoCommit(),
    };

    localTools.set(undoTool.name, undoTool);

    if (document.modelContext?.registerTool && webMcpStatus === "native") {
      void document.modelContext
        .registerTool(undoTool, { signal: controller.signal })
        .catch(() => setWebMcpStatus("error"));
    }

    return () => {
      window.setTimeout(() => controller.abort(), 0);
      localTools.delete(undoTool.name);
    };
  }, [receipt, undoCommit, webMcpStatus]);

  useEffect(() => {
    if (!approval) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [approval]);

  const invokeTool = useCallback(
    async (name: string, input: Record<string, unknown>) => {
      const localTool = localToolsRef.current.get(name);
      if (!localTool) {
        throw new Error("Tool is not currently exposed: " + name);
      }

      if (document.modelContext && webMcpStatus === "native") {
        const tools = await document.modelContext.getTools();
        const registered = tools.find((tool) => tool.name === name);
        if (!registered) {
          throw new Error("Native WebMCP registry does not expose " + name);
        }
        return document.modelContext.executeTool(
          registered,
          JSON.stringify(input),
        );
      }

      return localTool.execute(input, {
        signal: new AbortController().signal,
      });
    },
    [webMcpStatus],
  );

  const runAgentStage = async () => {
    setBusy(true);
    setActivity("Agent is reading the live board and staging a bounded plan…");
    try {
      await invokeTool("get_launch_board", {});
      await invokeTool("stage_plan", DEMO_INPUT);
    } catch (error) {
      setActivity(error instanceof Error ? error.message : "Agent call failed.");
    } finally {
      setBusy(false);
    }
  };

  const runAgentCommit = async () => {
    setBusy(true);
    setActivity("Agent found the one-time capability and is committing…");
    try {
      await invokeTool("commit_plan", {});
    } catch (error) {
      setActivity(error instanceof Error ? error.message : "Commit failed.");
    } finally {
      setBusy(false);
    }
  };

  const runUndo = async () => {
    setBusy(true);
    setActivity("Verifying the receipt before compensation…");
    try {
      await invokeTool("undo_commit", {});
    } catch (error) {
      setActivity(error instanceof Error ? error.message : "Undo failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleOperation = (operationId: string) => {
    if (!plan || approval) return;
    const next = {
      ...plan,
      operations: plan.operations.map((operation) =>
        operation.id === operationId
          ? { ...operation, enabled: !operation.enabled }
          : operation,
      ),
    };
    setPlanState(next);
  };

  const changeAssignee = (operationId: string, value: string) => {
    if (!plan || approval) return;
    const next = {
      ...plan,
      operations: plan.operations.map((operation) =>
        operation.id === operationId ? { ...operation, value } : operation,
      ),
    };
    setPlanState(next);
  };

  const approvePlan = () => {
    if (!plan || plan.operations.every((operation) => !operation.enabled)) return;
    const nextApproval = {
      planId: plan.id,
      expiresAt: Date.now() + 60_000,
    };
    setNow(Date.now());
    setApprovalState(nextApproval);
    setActivity(
      "Human approved the exact diff. commit_plan is exposed for 60 seconds.",
    );
  };

  const revokeApproval = () => {
    setApprovalState(null);
    setActivity("Human revoked approval. commit_plan disappeared immediately.");
  };

  const resetDemo = () => {
    const fresh = cloneTasks(INITIAL_TASKS);
    tasksRef.current = fresh;
    versionRef.current = 12;
    commitPromisesRef.current.clear();
    setTasks(fresh);
    setVersion(12);
    setPlanState(null);
    setApprovalState(null);
    setReceiptState(null);
    setActivity("Demo reset. Canonical board restored to v12.");
  };

  const commitRegistered = Boolean(approval);
  const undoRegistered = receipt?.status === "committed";
  const selectedOperations =
    plan?.operations.filter((operation) => operation.enabled).length ?? 0;
  const ttl = approval
    ? Math.max(0, Math.ceil((approval.expiresAt - now) / 1000))
    : 0;

  const tasksByColumn = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((column) => [
          column.id,
          tasks.filter(
            (task) => !task.archived && task.column === column.id,
          ),
        ]),
      ) as Record<ColumnId, Task[]>,
    [tasks],
  );

  const stagedMarkers = (taskId: string) =>
    plan?.operations
      .filter((operation) => operation.enabled && operation.taskId === taskId)
      .map((operation) => {
        if (operation.type === "assign") return "assign → " + operation.value;
        if (operation.type === "move") return "move → This week";
        return "archive";
      }) ?? [];

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#171713]">
      <nav className="sticky top-0 z-40 border-b border-[#171713]/10 bg-[#f4f1e9]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#171713] text-[#b7f34a]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.2]">
                <path d="M5 7h9M5 12h14M5 17h9" />
                <path d="m15 5 4 2-4 2M15 15l4 2-4 2" />
              </svg>
            </div>
            <span className="font-semibold tracking-[-0.03em]">Staged</span>
            <span className="rounded-full border border-[#171713]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]">
              WebMCP
            </span>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[#171713]/10 bg-white/65 px-3 py-1.5 text-xs text-[#56564f] md:flex">
            <StatusDot tone={webMcpStatus === "native" ? "green" : "amber"} />
            {webMcpStatus === "native"
              ? "Native WebMCP connected"
              : webMcpStatus === "checking"
                ? "Checking browser capability"
                : "Interactive preview mode"}
          </div>

          <button
            type="button"
            onClick={resetDemo}
            className="rounded-lg border border-[#171713]/15 bg-white/50 px-3 py-2 text-xs font-medium transition hover:bg-white"
          >
            Reset demo
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-[1500px] px-5 pb-8 pt-10 lg:px-8 lg:pt-14">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#66665e]">
              <span>Agent branch</span>
              <span className="h-px w-10 bg-[#171713]/25" />
              <span>Human commit</span>
            </div>
            <h1 className="max-w-4xl text-[clamp(3rem,7vw,7.4rem)] font-semibold leading-[0.83] tracking-[-0.075em]">
              Let agents draft.
              <br />
              <span className="text-[#6955e8]">You decide</span> what lands.
            </h1>
          </div>
          <div className="border-l border-[#171713]/15 pl-5 lg:mb-2 lg:pl-7">
            <p className="max-w-md text-base leading-7 text-[#56564f]">
              Git-style control for consequential agent actions. Stage a plan,
              inspect one deterministic diff, approve once, commit atomically,
              and keep the receipt.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-16 lg:px-8">
        <div className="overflow-hidden rounded-[24px] border border-[#171713]/15 bg-[#fbfaf5] shadow-[0_24px_70px_rgba(39,37,30,0.10)]">
          <div className="flex flex-col border-b border-[#171713]/10 bg-white/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#fbfaf5] bg-[#d9d1ff] text-[10px] font-semibold">MC</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#fbfaf5] bg-[#bdebf5] text-[10px] font-semibold">JB</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Launch control</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#77776e]">
                  Canonical board · v{version}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 sm:mt-0">
              <span className="rounded-full bg-[#e8f7cd] px-2.5 py-1 text-[11px] font-semibold text-[#385d00]">
                Production untouched until commit
              </span>
            </div>
          </div>

          <div className="grid min-h-[650px] xl:grid-cols-[minmax(0,1fr)_430px]">
            <section className="border-b border-[#171713]/10 p-4 sm:p-6 xl:border-b-0 xl:border-r">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#77776e]">
                    Shared live state
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Friday launch
                  </h2>
                </div>
                {plan && (
                  <span className="animate-pulse-soft rounded-full border border-[#6955e8]/30 bg-[#eeeafd] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5641d0]">
                    Branch preview active
                  </span>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {COLUMNS.map((column) => (
                  <div key={column.id} className="rounded-2xl bg-[#f0eee7] p-3">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{column.label}</span>
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 font-mono text-[10px] text-[#6b6b63]">
                          {tasksByColumn[column.id].length}
                        </span>
                      </div>
                      <span className="text-[#8b8b82]">•••</span>
                    </div>

                    <div className="space-y-3">
                      {tasksByColumn[column.id].map((task) => {
                        const markers = stagedMarkers(task.id);
                        return (
                          <article
                            key={task.id}
                            className={
                              "relative overflow-hidden rounded-xl border bg-[#fffefa] p-3.5 shadow-[0_3px_12px_rgba(44,41,32,0.04)] " +
                              (task.protected
                                ? "border-amber-300/70"
                                : markers.length
                                  ? "border-[#6955e8]/45 ring-2 ring-[#6955e8]/8"
                                  : "border-[#171713]/10")
                            }
                          >
                            {markers.length > 0 && (
                              <div className="absolute inset-y-0 left-0 w-1 bg-[#6955e8]" />
                            )}
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-[10px] text-[#8a8a81]">{task.id}</span>
                              {task.protected && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-700">
                                  Policy lock
                                </span>
                              )}
                            </div>
                            <h3 className="mt-2 min-h-10 text-sm font-semibold leading-5 tracking-[-0.01em]">
                              {task.title}
                            </h3>
                            <div className="mt-3 flex items-center gap-2 text-[11px] text-[#66665e]">
                              <span
                                className={
                                  "h-2 w-2 rounded-full " +
                                  (task.color === "violet"
                                    ? "bg-[#6955e8]"
                                    : task.color === "cyan"
                                      ? "bg-[#4fc8dd]"
                                      : "bg-amber-400")
                                }
                              />
                              <span>{task.tag}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-[#171713]/8 pt-3">
                              <span className="text-[10px] font-medium text-[#77776e]">{task.assignee}</span>
                              <span className="font-mono text-[9px] uppercase text-[#9a6555]">{task.due}</span>
                            </div>
                            {markers.length > 0 && (
                              <div className="mt-3 space-y-1 border-t border-dashed border-[#6955e8]/25 pt-2.5">
                                {markers.map((marker) => (
                                  <p key={marker} className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#5641d0]">
                                    + staged: {marker}
                                  </p>
                                ))}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="flex flex-col bg-[#191914] text-[#f6f4ed]">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                      Agent branch
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                      Review before reality
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/60">
                    {plan ? plan.id : receipt ? receipt.id : "No branch"}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-5 sm:p-6">
                {!plan && !receipt && (
                  <div className="flex h-full min-h-[420px] flex-col">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/65">Human request</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#b7f34a]">Ready</span>
                      </div>
                      <p className="text-sm leading-6 text-white/85">
                        “Clean up the launch board for Friday. Prioritize checkout
                        reliability, archive duplicates, and clear stale work.”
                      </p>
                    </div>

                    <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-white/30">
                      <span className="h-px flex-1 bg-white/10" />
                      Agent pathway
                      <span className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="space-y-2.5">
                      {[
                        ["get_launch_board", "Read only"],
                        ["stage_plan", "Branch only"],
                        ["inspect_staged_plan", "Read only"],
                      ].map(([name, scope]) => (
                        <div key={name} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-3">
                          <div className="flex items-center gap-2.5">
                            <StatusDot />
                            <code className="text-[11px] text-white/80">{name}</code>
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/35">{scope}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-xl border border-dashed border-white/10 px-3.5 py-3 opacity-45">
                        <div className="flex items-center gap-2.5">
                          <StatusDot tone="gray" />
                          <code className="text-[11px]">commit_plan</code>
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em]">Not exposed</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={runAgentStage}
                      disabled={busy}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7f34a] px-4 py-3.5 text-sm font-bold text-[#171713] transition hover:bg-[#c6fb68] disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? "Agent is staging…" : "Run guided agent demo"}
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                )}

                {plan && (
                  <div>
                    <div className="mb-4 rounded-xl border border-[#b7f34a]/25 bg-[#b7f34a]/8 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#d9ff91]">
                        <StatusDot />
                        Canonical board is still v{version}
                      </div>
                      <p className="mt-1.5 text-[11px] leading-5 text-white/50">
                        The agent created a reviewable branch. It cannot approve
                        or commit this plan.
                      </p>
                    </div>

                    {plan.blocked.length > 0 && (
                      <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/8 p-3.5">
                        <p className="text-xs font-semibold text-amber-200">
                          Policy caught {plan.blocked.length} operation
                        </p>
                        <p className="mt-1.5 text-[11px] leading-5 text-white/50">
                          {plan.blocked[0].taskId}: {plan.blocked[0].reason}
                        </p>
                      </div>
                    )}

                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-white/65">
                        Proposed diff
                      </p>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/35">
                        {selectedOperations} selected
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {plan.operations.map((operation, index) => {
                        const label = operationLabel(operation, tasks);
                        return (
                          <div
                            key={operation.id}
                            className={
                              "rounded-xl border p-3.5 transition " +
                              (operation.enabled
                                ? "border-white/12 bg-white/[0.05]"
                                : "border-white/5 bg-transparent opacity-40")
                            }
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                disabled={Boolean(approval)}
                                onClick={() => toggleOperation(operation.id)}
                                aria-label={operation.enabled ? "Remove operation" : "Restore operation"}
                                className={
                                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] " +
                                  (operation.enabled
                                    ? "border-[#b7f34a] bg-[#b7f34a] text-[#171713]"
                                    : "border-white/25")
                                }
                              >
                                {operation.enabled ? "✓" : ""}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] text-white/30">0{index + 1}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#b7f34a]">{label.verb}</span>
                                </div>
                                <p className="mt-1 truncate text-sm font-medium">{label.title}</p>
                                {operation.type === "assign" && !approval ? (
                                  <select
                                    value={operation.value}
                                    onChange={(event) => changeAssignee(operation.id, event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#24241e] px-2.5 py-2 text-[11px] text-white outline-none"
                                  >
                                    <option>Maya Chen</option>
                                    <option>Jon Bell</option>
                                    <option>Unassigned</option>
                                  </select>
                                ) : (
                                  <p className="mt-1 font-mono text-[10px] text-white/45">{label.detail}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!approval ? (
                      <button
                        type="button"
                        onClick={approvePlan}
                        disabled={selectedOperations === 0}
                        className="mt-5 w-full rounded-xl bg-[#b7f34a] px-4 py-3.5 text-sm font-bold text-[#171713] transition hover:bg-[#c6fb68] disabled:opacity-30"
                      >
                        Approve exact diff · {selectedOperations} changes
                      </button>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-[#b7f34a]/35 bg-[#b7f34a]/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <StatusDot />
                              <code className="text-xs font-semibold text-[#d9ff91]">commit_plan</code>
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-white/55">
                              Closure-bound to {plan.id}. No plan ID or approval
                              token is controlled by the agent.
                            </p>
                          </div>
                          <span className="font-mono text-xl font-semibold text-[#b7f34a]">{ttl}s</span>
                        </div>
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-[#b7f34a] transition-[width]"
                            style={{ width: Math.min(100, (ttl / 60) * 100) + "%" }}
                          />
                        </div>
                        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                          <button
                            type="button"
                            onClick={runAgentCommit}
                            disabled={busy || !commitRegistered}
                            className="rounded-lg bg-[#b7f34a] px-3 py-3 text-xs font-bold text-[#171713] disabled:opacity-50"
                          >
                            {busy ? "Committing…" : "Let agent commit once"}
                          </button>
                          <button
                            type="button"
                            onClick={revokeApproval}
                            className="rounded-lg border border-white/15 px-3 py-3 text-xs font-semibold text-white/65 hover:bg-white/5"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {receipt && (
                  <div>
                    <div
                      className={
                        "rounded-2xl border p-5 " +
                        (receipt.status === "committed"
                          ? "border-[#b7f34a]/35 bg-[#b7f34a]/9"
                          : "border-[#79d9e8]/30 bg-[#79d9e8]/8")
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b7f34a] text-lg font-bold text-[#171713]">
                          {receipt.status === "committed" ? "✓" : "↶"}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                          {receipt.status}
                        </span>
                      </div>
                      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                        {receipt.status === "committed"
                          ? "Approved plan landed."
                          : "Commit safely undone."}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        {receipt.operations.length} operations · v
                        {receipt.beforeVersion} → v{receipt.afterVersion}
                      </p>

                      <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 font-mono text-[10px]">
                        <div className="flex justify-between gap-4">
                          <dt className="text-white/30">receipt</dt>
                          <dd className="text-white/75">{receipt.id}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-white/30">before</dt>
                          <dd className="text-white/75">{receipt.beforeHash.slice(0, 16)}…</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-white/30">after</dt>
                          <dd className="text-white/75">{receipt.afterHash.slice(0, 16)}…</dd>
                        </div>
                      </dl>
                    </div>

                    {receipt.status === "committed" && (
                      <div className="mt-4 rounded-xl border border-white/10 p-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <code className="text-[11px] text-white/75">undo_commit</code>
                            <p className="mt-1 text-[10px] text-white/35">
                              Exposed while receipt still matches
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={runUndo}
                            disabled={busy || !undoRegistered}
                            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/5 disabled:opacity-40"
                          >
                            {busy ? "Verifying…" : "Undo"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-black/15 px-5 py-3.5 sm:px-6">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b7f34a]" />
                  <p className="font-mono text-[9px] leading-4 text-white/40">
                    {activity}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-[#171713]/10 bg-[#e9e5da]">
        <div className="mx-auto grid max-w-[1500px] divide-y divide-[#171713]/10 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {[
            ["01", "Agent drafts", "The agent can explore and stage a bounded plan, but production state stays unchanged."],
            ["02", "Human edits", "One semantic diff replaces a pile of low-context approval popups."],
            ["03", "Capability appears", "Approval creates an exact, expiring, one-use WebMCP tool with a receipt and safe undo."],
          ].map(([number, title, copy]) => (
            <div key={number} className="py-8 md:px-7 md:first:pl-0 md:last:pr-0">
              <span className="font-mono text-[10px] text-[#77776e]">{number}</span>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em]">{title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#66665e]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-8 text-xs text-[#77776e] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>Staged · Git-style control for agent actions</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em]">
          Built for the OpenAI WebMCP Challenge
        </p>
      </footer>
    </main>
  );
}
