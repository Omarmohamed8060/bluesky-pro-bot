import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BlueskyService } from '../bluesky/bluesky.service';

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);

  constructor(private readonly blueskyService: BlueskyService) {}

  async followUser(handle: string) {
    this.ensureHandle(handle);
    this.logger.log(`Following ${handle} using shared Bluesky agent`);
    return this.blueskyService.followUser(handle);
  }

  async getFollowers(handle: string) {
    this.ensureHandle(handle);
    this.logger.log(`Fetching followers for ${handle} using shared Bluesky agent`);
    return this.blueskyService.getFollowers(handle);
  }

  private ensureHandle(handle: string) {
    if (!handle) {
      throw new HttpException(
        { error: 'handle is required' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
