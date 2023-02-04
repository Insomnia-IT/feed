import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';

import { VolEntity } from '@feed/api/src/entities/vol.entity';
import { VolRepository } from '@feed/api/src/repositories/vol.repository';

@Injectable()
export class VolService extends TypeOrmCrudService<VolEntity> {
    constructor(
        @InjectRepository(VolRepository)
        public readonly repo: Repository<VolEntity>,
    ) {
        super(repo);
    }
}
