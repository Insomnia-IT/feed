import { Repository } from 'typeorm';

import { VolEntity } from '@feed/api/src/entities/vol.entity';
import { CustomRepository } from '@feed/api/src/database/typeorm-ex.decorator';

@CustomRepository(VolEntity)
export class VolRepository extends Repository<VolEntity> {}
