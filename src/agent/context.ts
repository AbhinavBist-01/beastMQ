export interface AgentTaskContext {
  jobId: string;
  type: string;
  traceId?: string | null;
  parentJobId?: string | null;
  agentRole?: string | null;
  attempts: number;
  startedAt?: Date | null;
  signal: AbortSignal;
}

export type AgentTaskHandler<TInput = any, TOutput = any> = (
  payload: TInput,
  context: AgentTaskContext,
) => Promise<TOutput> | TOutput;
