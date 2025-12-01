import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { CreateTargetListDto } from './dto/create-target-list.dto';
import { AddTargetsDto } from './dto/add-targets.dto';

@Controller('targets')
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Post('lists')
  async createTargetList(@Body() createTargetListDto: CreateTargetListDto) {
    try {
      console.log('[TargetsController] Creating target list:', createTargetListDto);
      const result = await this.targetsService.createTargetList(createTargetListDto);
      console.log('[TargetsController] Target list created successfully:', result.id);
      return result;
    } catch (error: any) {
      console.error('[TargetsController] Failed to create target list:', error);
      throw new HttpException(
        { 
          error: 'Failed to create target list', 
          details: error.message,
          stack: error.stack 
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('lists')
  async getTargetLists() {
    return await this.targetsService.getTargetLists();
  }

  @Get('lists/:id')
  async getTargetList(@Param('id') id: string) {
    try {
      return await this.targetsService.getTargetList(id);
    } catch (error: any) {
      throw new HttpException(
        { error: 'Target list not found', details: error.message },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post('lists/:id/targets')
  async addTargets(@Param('id') id: string, @Body() addTargetsDto: AddTargetsDto) {
    try {
      return await this.targetsService.addTargets(id, addTargetsDto.targets);
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to add targets', details: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('lists/:id/targets')
  async getTargets(@Param('id') id: string) {
    try {
      return await this.targetsService.getTargets(id);
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to get targets', details: error.message },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Delete('lists/:id')
  async deleteTargetList(@Param('id') id: string) {
    try {
      await this.targetsService.deleteTargetList(id);
      return { message: 'Target list deleted successfully' };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to delete target list', details: error.message },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Delete('targets/:id')
  async deleteTarget(@Param('id') id: string) {
    try {
      await this.targetsService.deleteTarget(id);
      return { message: 'Target deleted successfully' };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to delete target', details: error.message },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post('import')
  async importTargets(@Body() body: { targetListId: string; targetsText: string }) {
    try {
      return await this.targetsService.importTargets(body.targetListId, body.targetsText);
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to import targets', details: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('lists/:id/add-followers')
  async addFollowers(@Param('id') id: string, @Body() body: { followers: Array<{ handle: string; did: string; displayName?: string }> }) {
    try {
      // Convert followers to target format (strings as expected by addTargets)
      const targets = body.followers.map(follower => follower.handle);

      return await this.targetsService.addTargets(id, targets);
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to add followers to target list', details: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
