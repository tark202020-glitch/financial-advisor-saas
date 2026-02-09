export class RateLimiter {
    private queue: { task: () => Promise<any>; resolve: (value: any) => void; reject: (reason: any) => void }[] = [];
    private activeCount = 0;
    private lastRequestTime = 0;
    private readonly maxConcurrency: number;
    private readonly minInterval: number;
    private isProcessing = false;

    constructor(maxConcurrency = 5, minInterval = 200) {
        this.maxConcurrency = maxConcurrency;
        this.minInterval = minInterval;
    }

    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    private async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            while (this.queue.length > 0) {
                if (this.activeCount >= this.maxConcurrency) {
                    break;
                }

                const now = Date.now();
                const timeSinceLast = now - this.lastRequestTime;

                if (timeSinceLast < this.minInterval) {
                    const delay = this.minInterval - timeSinceLast;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    // Re-evaluate time after delay
                    continue;
                }

                const item = this.queue.shift();
                if (!item) break;

                this.activeCount++;
                this.lastRequestTime = Date.now();

                // Run task without awaiting it here (to allow concurrency)
                item.task()
                    .then(item.resolve)
                    .catch(item.reject)
                    .finally(() => {
                        this.activeCount--;
                        this.process(); // Trigger next item when one finishes
                    });
            }
        } finally {
            this.isProcessing = false;
        }
    }
}

// Global instance
// Using 10 concurrent, 50ms interval => ~20 req/sec (KIS Standard limit)
export const kisRateLimiter = new RateLimiter(10, 50);
