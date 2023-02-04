import { Repository } from 'typeorm';

import { LocationEntity } from '@feed/api/src/entities/location.entity';
import { CustomRepository } from '@feed/api/src/database/typeorm-ex.decorator';

@CustomRepository(LocationEntity)
export class LocationRepository extends Repository<LocationEntity> {}
