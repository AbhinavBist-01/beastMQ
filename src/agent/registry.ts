import type { AgentTaskHandler } from "./context.js";

export class TaskRegistry {
  private handlers = new Map<string, AgentTaskHandler>();

  register<TIn = any, TOut = any>(
    type: string,
    handler: AgentTaskHandler<TIn, TOut>,
  ): this {
    this.handlers.set(type, handler as AgentTaskHandler);
    return this;
  }

  get(type: string): AgentTaskHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  listTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const taskRegistry = new TaskRegistry();

export function registerTaskHandler<TIn = any, TOut = any>(
  type: string,
  handler: AgentTaskHandler<TIn, TOut>,
): void {
  taskRegistry.register(type, handler);
}
