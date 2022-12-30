import { EventRegistryBase } from "@nersent/event-emitter";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ICancelTokenSource {
  getToken(): ICancelToken;
  cancel(reason?: any): void;
}

export type ICancelTokenEvents = {
  requested: (reason?: string) => void;
};

export type ICancelTokenEventRegistry = EventRegistryBase<ICancelTokenEvents>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ICancelToken extends ICancelTokenEventRegistry {
  getId(): string;
  isRequested(): boolean;
  throwIfRequested(): void;
}
