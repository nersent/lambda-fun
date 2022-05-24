export interface AsyncQueueSnapshot {
  stage: AsyncQueueSnapshotStage;
  time: Date;
  id?: string;
  threadId?: string;
  data?: any;
  threads: any;
  queueLengh: number;
  error?: any;
}

export type AsyncQueueSnapshotStage =
  | "tick"
  | "done"
  | "before-execution"
  | "after-execution"
  | "empty-queue"
  | "no-free-thread"
  | "delete-from-queue"
  | "task-resolved"
  | "thread-resolved"
  | "thread-resolved-canceled"
  | "cancel-request"
  | "cancel-callback-resolved";

export class AsyncQueueSnapshotController {
  public readonly list: AsyncQueueSnapshot[] = [];

  constructor(
    private readonly getData: () => Partial<AsyncQueueSnapshot>,
    private readonly printWhenCreate?: boolean,
  ) {}

  public create(
    stage: AsyncQueueSnapshotStage,
    data?: Partial<AsyncQueueSnapshot>,
  ) {
    const item = JSON.parse(
      JSON.stringify({
        stage,
        time: data?.time ?? new Date(),
        ...this.getData(),
        ...data,
      }),
    );
    if (this.printWhenCreate) {
      console.log(item);
    }
    this.list.push(item);
  }

  public print() {
    console.log("%j", this.list);
  }
}
