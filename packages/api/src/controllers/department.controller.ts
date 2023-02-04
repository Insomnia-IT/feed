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

import { DepartmentEntity } from '@feed/api/src/entities/department.entity';
import { DepartmentService } from '@feed/api/src/services/department.service';

import { DepartmentCreateDto } from './dto/department/department-create.dto';
import { DepartmentGetManyDto } from './dto/department/department-get-many.dto';
import { DepartmentUpdateDto } from './dto/department/department-update.dto';
import { DepartmentDto } from './dto/department/department.dto';

@ApiTags('departments')
@ApiBearerAuth()
@Crud({
    model: {
        type: DepartmentEntity,
    },
    dto: {
        create: DepartmentCreateDto,
        update: DepartmentUpdateDto,
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
            lead: {
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
        getMany: DepartmentGetManyDto,
        create: DepartmentDto,
        update: DepartmentDto,
        get: DepartmentDto,
    },
    routes: {
        exclude: ['createManyBase', 'replaceOneBase'],
    },
})
@UseGuards(JwtAuthGuard, ACGuard)
@Controller('departments')
export class DepartmentController implements CrudController<DepartmentEntity> {
    constructor(public service: DepartmentService) {}

    get base(): CrudController<DepartmentEntity> {
        return this;
    }

    @Override()
    @UseRoles({
        resource: 'departments',
        action: 'create',
    })
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: DepartmentCreateDto,
    ) {
        console.log('create-dto', dto);
        // @ts-ignore
        return this.base.createOneBase(req, <DepartmentEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'departments',
        action: 'update',
    })
    updateOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: DepartmentUpdateDto,
    ) {
        // @ts-ignore
        return this.base.updateOneBase(req, <DepartmentEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'departments',
        action: 'delete',
    })
    deleteOne(req: CrudRequest) {
        return this.base.deleteOneBase(req);
    }
}
