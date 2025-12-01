import { FollowService } from './follow.service';
export declare class FollowController {
    private readonly followService;
    private readonly logger;
    constructor(followService: FollowService);
    followUser(body: {
        handle: string;
        accountId?: string;
    }): Promise<{
        success: boolean;
        handle: string;
        detail: string;
    }>;
    getFollowers(handle: string): Promise<{
        success: boolean;
        handle: string;
        followers: import("../bluesky/bluesky.service").FollowerInfo[];
        count: number;
    }>;
}
