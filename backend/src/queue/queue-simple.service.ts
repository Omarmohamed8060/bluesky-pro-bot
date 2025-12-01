import { Injectable } from '@nestjs/common';

type QueueType = 'dm' | 'post';

@Injectable()
export class QueueService {
  async addJob(type: QueueType, data: any): Promise<string | undefined> {
    // Simplified implementation - just return a mock job ID
    console.log(`Queue: Adding ${type} job with data:`, data);
    return `mock-job-${Date.now()}`;
  }
}
