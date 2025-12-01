type QueueType = 'dm' | 'post';
export declare class QueueService {
    addJob(type: QueueType, data: any): Promise<string | undefined>;
}
export {};
