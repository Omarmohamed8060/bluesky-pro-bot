import { BlueskyService } from '../bluesky/bluesky.service';
export declare class FollowService {
    private readonly blueskyService;
    private readonly logger;
    constructor(blueskyService: BlueskyService);
    followUser(handle: string): Promise<import("../bluesky/bluesky.service").FollowResult>;
    getFollowers(handle: string): Promise<import("../bluesky/bluesky.service").FollowerInfo[]>;
    private ensureHandle;
}
