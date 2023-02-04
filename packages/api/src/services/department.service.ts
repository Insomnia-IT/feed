import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';

import { DepartmentEntity } from '@feed/api/src/entities/department.entity';
import { DepartmentRepository } from '@feed/api/src/repositories/department.repository';

@Injectable()
export class DepartmentService extends TypeOrmCrudService<DepartmentEntity> {
    constructor(
        @InjectRepository(DepartmentRepository)
        public readonly repo: Repository<DepartmentEntity>,
    ) {
        super(repo);
    }
}
