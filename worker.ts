// Minimal, locally-scoped types for the two Cloudflare Workers primitives we
// touch here — intentionally not using @cloudflare/workers-types, since its
// ambient global declarations override lib.dom's Response/fetch types for
// the *entire* program (tsc compiles all included files together), breaking
// typecheck across the rest of the app.
interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

import handler from "./.open-next/worker.js";
import { runSyncForAllIntegrations } from "@/lib/sync/orchestrator";

const worker = {
  fetch: handler.fetch,
  async scheduled(
    _event: ScheduledController,
    _env: unknown,
    ctx: WorkerExecutionContext,
  ) {
    ctx.waitUntil(
      runSyncForAllIntegrations().catch((err) => {
        console.error("[cron] sync run failed", err);
      }),
    );
  },
};

export default worker;
