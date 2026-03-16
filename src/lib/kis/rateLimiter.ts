export class RateLimiter {
    private queue: { task: () => Promise<any>; resolve: (value: any) => void; reject: (reason: any) => void }[] = [];
    private activeCount = 0;
    private lastRequestTime = 0;
    private readonly maxConcurrency: number;
    private readonly minInterval: number;

    constructor(maxConcurrency = 5, minInterval = 200) {
        this.maxConcurrency = maxConcurrency;
        this.minInterval = minInterval;
    }

    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processNext();
        });
    }

    private async processNext() {
        // 동시 실행 한도 초과 시 대기 (기존 작업 완료 시 자동 재호출)
        if (this.activeCount >= this.maxConcurrency) {
            return;
        }

        const item = this.queue.shift();
        if (!item) return;

        // Rate limit: 최소 간격 대기
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.minInterval) {
            const delay = this.minInterval - timeSinceLast;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.activeCount++;
        this.lastRequestTime = Date.now();

        try {
            const result = await item.task();
            item.resolve(result);
        } catch (e) {
            item.reject(e);
        } finally {
            this.activeCount--;
            // 작업 완료 후 큐에 대기 중인 다음 작업 처리
            if (this.queue.length > 0) {
                this.processNext();
            }
        }
    }
}

// Global instance
// maxConcurrency 5, minInterval 200ms => ~5 req/sec (KIS API 안정 범위)
export const kisRateLimiter = new RateLimiter(5, 200);

