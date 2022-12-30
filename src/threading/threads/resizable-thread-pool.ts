import { ThreadManager } from "./thread-manager";
import { IThread } from "./thread-types";

export type ResizableThreadPoolCreateThreadDelegate<T> = () => IThread<T>;

export class ResizableThreadPool<T> extends ThreadManager<T> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _currentSize = 0;

  constructor(
    private readonly createThreadDelegate: ResizableThreadPoolCreateThreadDelegate<T>,
  ) {
    super();
  }

  public getSize(): number {
    return this.getAll().length;
  }

  /**
   * Creates additional threads and initializes them or kills existing threads to match the desired size.
   */
  public async resize(newSize: number): Promise<void> {
    const currentAliveThreads = this.getAll().filter((thread) =>
      thread.isAlive(),
    );
    if (currentAliveThreads.length === newSize) return;

    const prevSize = this._currentSize;
    this._currentSize = newSize;

    if (newSize <= 0) {
      await Promise.all(
        currentAliveThreads.map(async (thread) => {
          await thread.kill();
          this.remove(thread);
        }),
      );
      return;
    }

    if (currentAliveThreads.length < newSize) {
      const additionalSize = newSize - currentAliveThreads.length;

      const createdThreads = await Promise.all(
        Array.from({ length: additionalSize }, async () => {
          const thread = this.createThreadDelegate();
          await thread.initialize();
          this.add(thread);
        }),
      );
      return;
    }

    const removalSize = currentAliveThreads.length - newSize;
    const threadsToKill = currentAliveThreads.slice(0, removalSize);

    await Promise.all(
      threadsToKill.map(async (thread) => {
        await thread.kill();
        this.remove(thread);
      }),
    );
  }
}
