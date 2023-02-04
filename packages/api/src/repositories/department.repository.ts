import { Repository } from 'typeorm';

import { DepartmentEntity } from '@feed/api/src/entities/department.entity';
import { CustomRepository } from '@feed/api/src/database/typeorm-ex.decorator';

@CustomRepository(DepartmentEntity)
export class DepartmentRepository extends Repository<DepartmentEntity> {}
