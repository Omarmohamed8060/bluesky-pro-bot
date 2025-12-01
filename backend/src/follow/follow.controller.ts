import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FollowService } from './follow.service';

@Controller('follow')
export class FollowController {
  private readonly logger = new Logger(FollowController.name);

  constructor(private readonly followService: FollowService) {}

  @Post('follow')
  async followUser(@Body() body: { handle: string; accountId?: string }) {
    try {
      const { handle } = body;
      
      const result = await this.followService.followUser(handle);

      return {
        success: true,
        handle: result.handle,
        detail: result.detail,
      };
    } catch (error: any) {
      this.logger.error(`Error following user: ${error.message}`);
      throw new HttpException(
        { 
          error: 'Failed to follow user',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('followers/:handle')
  async getFollowers(@Param('handle') handle: string) {
    try {
      const followers = await this.followService.getFollowers(handle);

      return {
        success: true,
        handle,
        followers,
        count: followers.length,
      };
    } catch (error: any) {
      this.logger.error(`Error getting followers: ${error.message}`);
      throw new HttpException(
        { 
          error: 'Failed to get followers',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
