import React, { Fragment, useState } from 'react';
import dynamic from 'next/dynamic';
import { useList } from '@pankod/refine-core';
import { VolEntity } from '~/interfaces';
import { DatePicker } from 'antd';
const { RangePicker } = DatePicker;
const Line = dynamic(() => import('@ant-design/plots').then(({ Line }) => Line), { ssr: false });

export function PublicStats() {
    const { data } = useList<VolEntity>({
        resource: 'vols',
        config: {
            filters: [
                {
                    field: 'isActive',
                    operator: 'eq',
                    value: true
                },
                {
                    field: 'isBlocked',
                    operator: 'eq',
                    value: false
                }
            ]
        }
    });
    const [timePeriod, setTimePeriod] = useState({
        start: new Date('07.01.2023'),
        end: new Date('07.30.2023')
    });
    const timeDataArr: Array<{}> = [];
    for (let start = timePeriod.start.getTime(); start <= timePeriod.end.getTime(); start += 1000 * 60 * 60 * 24) {
        const date = new Date(start);
        const feedCount = data?.data.filter((volData) => {
            const activeToDate = new Date(volData.activeTo ? volData.activeTo : '');
            if (activeToDate > date) return true;
            return false;
        }).length;
        timeDataArr.push({ date: date, value: feedCount, category: 'Необходимо накормить, чел' });
    }
    timeDataArr.push(
        {
            date: new Date('07.01.2023'),
            value: 8,
            category: 'Фактически накормлено, чел'
        },
        {
            date: new Date('07.02.2023'),
            value: 8,
            category: 'Фактически накормлено, чел'
        },
        {
            date: new Date('07.03.2023'),
            value: 6,
            category: 'Фактически накормлено, чел'
        },
        {
            date: new Date('07.04.2023'),
            value: 6,
            category: 'Фактически накормлено, чел'
        },
        {
            date: new Date('07.05.2023'),
            value: 6,
            category: 'Фактически накормлено, чел'
        },
        {
            date: new Date('07.06.2023'),
            value: 6,
            category: 'Фактически накормлено, чел'
        }
    );
    const config = {
        data: timeDataArr,
        xField: 'date',
        yField: 'value',
        seriesField: 'category',
        xAxis: {
            type: 'time'
        }
    };
    console.log(timeDataArr);
    return (
        <Fragment>
            <RangePicker
                onChange={(_, range) => {
                    console.log(range);
                    setTimePeriod({
                        start: new Date(range[0]),
                        end: new Date(range[1])
                    });
                }}
            />
            <Line {...config} />
        </Fragment>
    );
}
