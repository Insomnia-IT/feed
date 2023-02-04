import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
    Crud,
    CrudController,
    CrudRequest,
    Override,
    ParsedBody,
    ParsedRequest,
} from '@nestjsx/crud';
import { ACGuard, UseRoles } from 'nest-access-control';
import { JwtAuthGuard } from '~/guards/jwt-auth.guard';

import { VolEntity } from '@feed/api/src/entities/vol.entity';
import { VolService } from '@feed/api/src/services/vol.service';

import { VolCreateDto } from './dto/vol/vol-create.dto';
import { VolGetManyDto } from './dto/vol/vol-getMany.dto';
import { VolUpdateDto } from './dto/vol/vol-update.dto';
import { VolDto } from './dto/vol/vol.dto';

@ApiTags('vols')
@ApiBearerAuth()
@Crud({
    model: {
        type: VolEntity,
    },
    dto: {
        create: VolCreateDto,
        update: VolUpdateDto,
    },
    params: {
        id: {
            field: 'id',
            type: 'uuid',
            primary: true,
        },
    },
    query: {
        alwaysPaginate: true,
        join: {
            vol: {
                eager: true,
            },
        },
        sort: [
            {
                field: 'id',
                order: 'DESC',
            },
        ],
    },
    serialize: {
        getMany: VolGetManyDto,
        create: VolDto,
        update: VolDto,
        get: VolDto,
    },
    routes: {
        exclude: ['createManyBase', 'replaceOneBase'],
    },
})
@UseGuards(JwtAuthGuard, ACGuard)
@Controller('vols')
export class VolController implements CrudController<VolEntity> {
    constructor(public service: VolService) {}

    get base(): CrudController<VolEntity> {
        return this;
    }

    @Override()
    @UseRoles({
        resource: 'vols',
        action: 'create',
    })
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: VolCreateDto,
    ) {
        console.log('create-dto', dto);
        // @ts-ignore
        return this.base.createOneBase(req, <VolEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'vols',
        action: 'update',
    })
    updateOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: VolUpdateDto,
    ) {
        return this.base.updateOneBase(req, <VolEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'vols',
        action: 'delete',
    })
    deleteOne(req: CrudRequest) {
        return this.base.deleteOneBase(req);
    }
}
