import { Module } from '@nestjs/common';
import { PlacementController } from './placement.controller.js';
import { PlacementRepository } from './placement.repository.js';
import { PlacementService } from './placement.service.js';

@Module({
  controllers: [PlacementController],
  providers: [PlacementRepository, PlacementService],
  exports: [PlacementService, PlacementRepository],
})
export class PlacementModule {}
