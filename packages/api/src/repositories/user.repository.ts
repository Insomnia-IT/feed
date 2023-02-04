import { Repository } from 'typeorm';

import { UserEntity } from '@feed/api/src/entities/user.entity';
import { CustomRepository } from '@feed/api/src/database/typeorm-ex.decorator';

@CustomRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {}
