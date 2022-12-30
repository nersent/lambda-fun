import { EventEmitter, EventRegistry } from "@nersent/event-emitter";
import { makeId } from "../utils/string";
import {
  ICancelToken,
  ICancelTokenEvents,
  ICancelTokenSource,
} from "./cancel-token-types";

import {
  AlreadyCancelledError,
  CanceledException,
} from "./lifecycle-exceptions";

export class CancelTokenSource implements ICancelTokenSource {
  private readonly _token: CancelToken | undefined;

  protected readonly _tokenEventEmitter: EventEmitter<ICancelTokenEvents>;

  private _isRequested = false;

  private _reason?: string = undefined;

  constructor() {
    this._token = new CancelToken(makeId(8), {
      isRequested: () => this._isRequested,
      getReason: () => this._reason,
    });
    this._tokenEventEmitter = new EventEmitter<ICancelTokenEvents>(this._token);
  }

  public getToken() {
    return this._token!;
  }

  public cancel(reason?: any) {
    this._isRequested = true;
    this._reason = reason;
    this._tokenEventEmitter.emit("requested", reason);
  }
}

export interface CancelTokenDelegates {
  isRequested: () => boolean;
  getReason: () => string | undefined;
}

export class CancelToken
  extends EventRegistry<ICancelTokenEvents>
  implements ICancelToken
{
  constructor(
    private readonly id: string,
    private readonly delegates: CancelTokenDelegates,
  ) {
    super();
  }

  public throwIfRequested(): void {
    if (this.delegates.isRequested()) {
      const reason = this.delegates.getReason();
      throw new CanceledException(reason);
    }
  }

  public getId(): string {
    return this.id;
  }

  public isRequested(): boolean {
    return this.delegates.isRequested();
  }
}
