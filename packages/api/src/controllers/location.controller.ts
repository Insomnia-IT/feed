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

import { LocationEntity } from '@feed/api/src/entities/location.entity';
import { LocationService } from '@feed/api/src/services/location.service';

import { LocationCreateDto } from './dto/location/location-create.dto';
import { LocationGetManyDto } from './dto/location/location-get-many.dto';
import { LocationUpdateDto } from './dto/location/location-update.dto';
import { LocationDto } from './dto/location/location.dto';

@ApiTags('locations')
@ApiBearerAuth()
@Crud({
    model: {
        type: LocationEntity,
    },
    dto: {
        create: LocationCreateDto,
        update: LocationUpdateDto,
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
        getMany: LocationGetManyDto,
        create: LocationDto,
        update: LocationDto,
        get: LocationDto,
    },
    routes: {
        exclude: ['createManyBase', 'replaceOneBase'],
    },
})
@UseGuards(JwtAuthGuard, ACGuard)
@Controller('locations')
export class LocationController implements CrudController<LocationEntity> {
    constructor(public service: LocationService) {}

    get base(): CrudController<LocationEntity> {
        return this;
    }

    @Override()
    @UseRoles({
        resource: 'locations',
        action: 'create',
    })
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: LocationCreateDto,
    ) {
        console.log('create-dto', dto);
        // @ts-ignore
        return this.base.createOneBase(req, <LocationEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'locations',
        action: 'update',
    })
    updateOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: LocationUpdateDto,
    ) {
        // @ts-ignore
        return this.base.updateOneBase(req, <LocationEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'locations',
        action: 'delete',
    })
    deleteOne(req: CrudRequest) {
        return this.base.deleteOneBase(req);
    }
}
