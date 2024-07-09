import type { FormInstance } from '@pankod/refine-antd';
import { Button, Checkbox, DatePicker, DeleteButton, Form, Input, Modal, Select, useSelect } from '@pankod/refine-antd';
import { Fragment, useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import {
    DeleteOutlined,
    FrownOutlined,
    PlusSquareOutlined,
    RadarChartOutlined,
    SmileOutlined
} from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Rules } from '~/components/form';
import type {
    AccessRoleEntity,
    ArrivalEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolEntity,
    VolunteerRoleEntity
} from '~/interfaces';
import { formDateFormat, isActivatedStatus } from '~/shared/lib';
import { dataProvider } from '~/dataProvider';

import useCanAccess from './use-can-access';
import styles from './common.module.css';

import 'react-quill/dist/quill.snow.css';
import HorseIcon from '~/assets/icons/horse-icon';
import { getSorter } from '~/utils';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type UpdatedArrival = Partial<ArrivalEntity> & Pick<ArrivalEntity, 'id'>;

export function CommonEdit({ form }: { form: FormInstance }) {
    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
    const denyBadgeEdit = !useCanAccess({ action: 'badge_edit', resource: 'volunteers' });
    const canUnban = useCanAccess({ action: 'unban', resource: 'volunteers' });
    const canEditGroupBadge = useCanAccess({ action: 'edit', resource: 'group-badges' });
    const canDelete = useCanAccess({ action: 'delete', resource: 'volunteers' });
    const person = Form.useWatch('person');

    const { selectProps: directionSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name'
    });

    const { selectProps: kitchenSelectProps } = useSelect<KitchenEntity>({
        resource: 'kitchens',
        optionLabel: 'name'
    });

    const { selectProps: feedTypeSelectProps } = useSelect<FeedTypeEntity>({
        resource: 'feed-types',
        optionLabel: 'name'
    });

    const { selectProps: colorTypeSelectProps } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { selectProps: accessRoleSelectProps } = useSelect<AccessRoleEntity>({
        resource: 'access-roles',
        optionLabel: 'name'
    });

    const { selectProps: genderSelectProps } = useSelect<AccessRoleEntity>({
        resource: 'genders',
        optionLabel: 'name'
    });

    const { selectProps: rolesSelectProps } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name'
    });

    const { selectProps: groupBadgeSelectProps } = useSelect<GroupBadgeEntity>({
        resource: 'group-badges',
        optionLabel: 'name'
    });

    const { selectProps: transportsSelectProps } = useSelect<TransportEntity>({
        resource: 'transports',
        optionLabel: 'name'
    });

    const { selectProps: statusesSelectProps } = useSelect<StatusEntity>({
        resource: 'statuses',
        optionLabel: 'name'
    });

    const getDirectionIds = (direction) => {
        return {
            value: direction ? direction.map((d) => d.id || d) : direction
        };
    };

    const getDateValue = (value) => {
        return {
            value: value ? dayjs(value) : ''
        };
    };

    const onGroupBadgeClear = () => {
        setTimeout(() => {
            form.setFieldValue('group_badge', '');
        });
    };

    const onAccessRoleClear = () => {
        setTimeout(() => {
            form.setFieldValue('access_role', '');
        });
    };

    const activeFromValidationRules = useCallback(
        (index: number) => [
            {
                required: true
            },
            {
                validator: async (_, value) => {
                    const arrivalDates = form
                        .getFieldValue('updated_arrivals')
                        .slice()
                        .map((a) => dayjs(a.arrival_date).format('YYYY-MM-DD'));
                    arrivalDates.splice(index, 1);

                    if (arrivalDates.includes(dayjs(value).format('YYYY-MM-DD'))) {
                        return Promise.reject(new Error(`Дата заезда не должна повторяться`));
                    }

                    return Promise.resolve();
                }
            }
        ],
        [form]
    );

    const activeToValidationRules = useCallback(
        (index: number) => [
            {
                required: true
            },
            {
                validator: async (_, value) => {
                    if (new Date(value) >= new Date(form.getFieldValue(['updated_arrivals', index, 'arrival_date']))) {
                        return Promise.resolve();
                    }

                    return Promise.reject(new Error('Дата заезда не может быть раньше Даты отъезда'));
                }
            }
        ],
        [form]
    );

    const [qrDuplicateVolunteer, setQrDuplicateVolunteer] = useState<VolEntity | null>(null);

    const checkQRDuplication = async (qr) => {
        const list = await dataProvider.getList<VolEntity>({
            filters: [{ field: 'qr', value: qr, operator: 'eq' }],
            resource: 'volunteers'
        });
        if (list.data.length && list.data[0].id !== form.getFieldValue('id')) {
            setQrDuplicateVolunteer(list.data[0]);
        }
    };

    const onQRChange = (e) => {
        const qr = e.target.value;
        if (qr) {
            void checkQRDuplication(qr);
        }
    };

    const clearDuplicateQR = async () => {
        if (qrDuplicateVolunteer) {
            await dataProvider.update<VolEntity>({
                id: qrDuplicateVolunteer.id,
                resource: 'volunteers',
                variables: {
                    qr: null
                }
            });
            setQrDuplicateVolunteer(null);
        }
    };

    const handleClear = () => {
        void clearDuplicateQR();
    };

    const handleOpenVolunteer = () => {
        if (qrDuplicateVolunteer) {
            window.location.href = `${window.location.origin}/volunteers/edit/${qrDuplicateVolunteer.id}`;
        }
    };

    const handleCancel = () => {
        setQrDuplicateVolunteer(null);
    };

    useEffect(() => {
        // @ts-ignore
        function onHardwareScan({ detail: { scanCode } }): void {
            form.setFieldValue('qr', scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        // @ts-ignore
        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            // @ts-ignore
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [form]);

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const loadCustomFields = async () => {
        const { data } = await dataProvider.getList<CustomFieldEntity>({
            resource: 'volunteer-custom-fields'
        });

        setCustomFields(data);
    };

    useEffect(() => {
        void loadCustomFields();
    }, []);

    // отсюда мой код

    const [activeAnchor, setActiveAnchor] = useState('section1');
    const isBlocked = Form.useWatch('is_blocked', form);
    const [open, setOpen] = useState(false);
    const arrivals = Form.useWatch<Array<ArrivalEntity>>('arrivals');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const [updatedArrivals, setUpdatedArrivals] = useState<Array<UpdatedArrival>>([]);

    useEffect(() => {
        setUpdatedArrivals(
            arrivals
                ?.slice()
                .sort(getSorter('arrival_date'))
                .map((arrival) => ({ ...arrival })) ?? [
                {
                    id: uuidv4(),
                    arrival_transport: 'UNDEFINED',
                    departure_transport: 'UNDEFINED'
                }
            ]
        );
    }, [arrivals]);

    useEffect(() => {
        form.setFieldValue('updated_arrivals', updatedArrivals);
    }, [updatedArrivals, form]);

    const handleToggleBlocked = () => {
        const isBlocked = form.getFieldValue('is_blocked');
        form.setFieldsValue({ is_blocked: !isBlocked });
        setOpen(false);
    };

    useEffect(() => {
        const formWrap = document.querySelector(`.${styles.formWrap}`);
        const handleAnchorClick = (id) => {
            const targetSection = document.getElementById(id);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        };

        const handleScroll = () => {
            const formWrap = document.querySelector(`.${styles.formWrap}`);
            if (!formWrap) return;

            const formWrapRect = formWrap.getBoundingClientRect();
            const sections = formWrap.querySelectorAll(`.${styles.formSection}`);

            let closestSectionId = '';
            let minDistance = Infinity;

            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();

                const topDistance = Math.abs(rect.top - formWrapRect.top);
                const bottomDistance = Math.abs(rect.bottom - formWrapRect.top);

                const distance = Math.min(topDistance, bottomDistance);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestSectionId = section.id;
                }
            });

            if (closestSectionId) {
                setActiveAnchor(closestSectionId);
            }
        };

        const handleNavItemClick = (e) => {
            const id = e.target.getAttribute('data-id');
            handleAnchorClick(id);
        };

        formWrap?.addEventListener('scroll', handleScroll);
        document.querySelectorAll(`.${styles.navList__item}`).forEach((item) => {
            item.addEventListener('click', handleNavItemClick);
        });

        return () => {
            document.removeEventListener('scroll', handleScroll);
            document.querySelectorAll(`.${styles.navList__item}`).forEach((item) => {
                item.removeEventListener('click', handleNavItemClick);
            });
        };
    }, [setActiveAnchor]);

    function returnEngagementsLayout() {
        if (!person) return null;
        const engagementsArray = person.engagements;
        if (engagementsArray.length) {
            return engagementsArray.map((item) => {
                return (
                    <div key={item.id}>
                        <span className={styles.engagementsDescr}>{`${item.year} год`}</span>
                        <RadarChartOutlined style={{ marginRight: '3px' }} />
                        <span className={styles.engagementsDescr}>{item.direction.name}</span>
                        <span className={styles.engagementsDescr}>{`(${item.role.name})`}</span>
                    </div>
                );
            });
        } else {
            return null;
        }
    }

    const addArrival = () => {
        setUpdatedArrivals([
            ...updatedArrivals,
            {
                id: uuidv4(),
                arrival_transport: 'UNDEFINED',
                departure_transport: 'UNDEFINED'
            }
        ]);
    };

    return (
        <div className={styles.edit}>
            <div className={styles.edit__nav}>
                <ul className={styles.navList}>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section1' ? styles.active : ''}`}
                        data-id='section1'
                    >
                        Персональная информация
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section2' ? styles.active : ''}`}
                        data-id='section2'
                    >
                        HR информация
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section3' ? styles.active : ''}`}
                        data-id='section3'
                    >
                        Даты на поле
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section4' ? styles.active : ''}`}
                        data-id='section4'
                        style={{ display: denyBadgeEdit ? 'none' : '' }}
                    >
                        Бейдж
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section5' ? styles.active : ''}`}
                        data-id='section5'
                        style={{ display: denyBadgeEdit ? 'none' : '' }}
                    >
                        Кастомные Поля
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section6' ? styles.active : ''}`}
                        data-id='section6'
                    >
                        Дополнительно
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section7' ? styles.active : ''}`}
                        data-id='section7'
                    >
                        Участие в прошлых годах
                    </li>
                </ul>
            </div>
            <div className={styles.formWrap}>
                <div id='section1' className={styles.formSection}>
                    <div className={styles.formSection__title}>
                        Персональная информация
                        {isBlocked && (
                            <div className={styles.bannedWrap}>
                                <span className={styles.bannedDescr}>Забанен</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.personalWrap}>
                        <div className={styles.photoWrap}>
                            <HorseIcon />
                        </div>
                        <div className={styles.personalInfoWrap}>
                            <div className={styles.nickNameLastnameWrap}>
                                <div className={`${styles.nameInput} ${styles.padInp}`}>
                                    <Form.Item label='Имя на бейдже' name='name' rules={Rules.required}>
                                        <Input readOnly={denyBadgeEdit} />
                                    </Form.Item>
                                </div>
                                <div className={`${styles.nameInput} ${styles.padInp}`}>
                                    <Form.Item label='Имя' name='first_name'>
                                        <Input readOnly={denyBadgeEdit} />
                                    </Form.Item>
                                </div>
                                <div className={styles.nameInput}>
                                    <Form.Item label='Фамилия' name='last_name'>
                                        <Input readOnly={denyBadgeEdit} />
                                    </Form.Item>
                                </div>
                            </div>
                            <div className={styles.nickNameLastnameWrap}>
                                <div className={styles.phoneInput}>
                                    <Form.Item label='Телефон' name='phone'>
                                        <Input type='phone' />
                                    </Form.Item>
                                </div>
                                <div className={styles.genderSelect}>
                                    <Form.Item label='Пол волонтера' name='gender'>
                                        <Select disabled={denyBadgeEdit} {...genderSelectProps} />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.kitchenTypeWrap}>
                        <div className={styles.kitchenSelect}>
                            <Form.Item label='Кухня' name='kitchen' rules={Rules.required}>
                                <Select {...kitchenSelectProps} />
                            </Form.Item>
                        </div>
                        <div className={styles.typeMeal}>
                            <Form.Item label='Тип питания' name='feed_type' rules={Rules.required}>
                                <Select disabled={denyBadgeEdit} {...feedTypeSelectProps} />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.isActiveCheckboxWrap}>
                        <div className={styles.isActiveCheckbox}>
                            <Form.Item name='is_vegan' valuePropName='checked'>
                                <Checkbox>Веган</Checkbox>
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div id='section2' className={styles.formSection}>
                    <p className={styles.formSection__title}>HR информация</p>
                    <div className={styles.hrInputsWrap}>
                        <div className={styles.hrInput}>
                            <Form.Item label='Право доступа' name='access_role'>
                                <Select
                                    allowClear
                                    disabled={!canFullEditing}
                                    {...accessRoleSelectProps}
                                    onClear={onAccessRoleClear}
                                />
                            </Form.Item>
                        </div>
                        <div className={styles.hrInput}>
                            <Form.Item label='Роль' name='main_role' rules={Rules.required}>
                                <Select disabled={!allowRoleEdit && !!person} {...rolesSelectProps} />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.hrInputsWrap}>
                        <div className={styles.hrInput}>
                            <Form.Item
                                label='Служба / Локация'
                                getValueProps={getDirectionIds}
                                name='directions'
                                rules={Rules.required}
                            >
                                <Select
                                    disabled={!allowRoleEdit && !!person}
                                    mode='multiple'
                                    {...directionSelectProps}
                                />
                            </Form.Item>
                        </div>
                        <div className={styles.hrInput}>
                            <Form.Item label='Должность' name='position'>
                                <Input disabled={denyBadgeEdit} />
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div id='section3' className={styles.formSection}>
                    <p className={styles.formSection__title}>Даты на поле</p>
                    <Form.Item name='arrivals' hidden />
                    {updatedArrivals?.map((arrival, index) => {
                        const createChange = (fieldName) => (value) => {
                            const newUpdaterdArrivals = updatedArrivals.slice();
                            newUpdaterdArrivals[index] = { ...arrival, [fieldName]: value };
                            setUpdatedArrivals(newUpdaterdArrivals);
                        };

                        const deleteArrival = () => {
                            const newUpdatedArrivals = updatedArrivals.filter(({ id }) => id !== arrival.id);
                            setUpdatedArrivals(newUpdatedArrivals);
                        };
                        return (
                            <Fragment key={arrival.id}>
                                <div className={index !== 0 ? `${styles.dateWrapper}` : ''}>
                                    <div className={styles.dateWrap}>
                                        <div className={styles.dateLabel}>
                                            <div>Заезд {index + 1}</div>
                                            <Button
                                                className={styles.deleteButton}
                                                danger
                                                type='link'
                                                icon={<DeleteOutlined />}
                                                onClick={deleteArrival}
                                                style={{
                                                    visibility: updatedArrivals.length === 1 ? 'hidden' : undefined
                                                }}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                        <div className={styles.dateInput}>
                                            <Form.Item
                                                label='Статус заезда'
                                                name={['updated_arrivals', index, 'status']}
                                                rules={Rules.required}
                                            >
                                                <Select
                                                    {...statusesSelectProps}
                                                    style={{ width: '100%' }}
                                                    onChange={createChange('status')}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                    <div className={styles.dateWrap}>
                                        <div
                                            className={`${styles.dateLabel} ${styles.dateLabelEmpty}`}
                                            style={{ visibility: 'hidden' }}
                                        >
                                            <div>Заезд {index + 1}</div>
                                            <Button
                                                className={styles.deleteButton}
                                                danger
                                                type='link'
                                                icon={<DeleteOutlined />}
                                                onClick={deleteArrival}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                        <div className={styles.dateInput}>
                                            <Form.Item
                                                label='Дата заезда'
                                                name={['updated_arrivals', index, 'arrival_date']}
                                                getValueProps={getDateValue}
                                                rules={activeFromValidationRules(index)}
                                            >
                                                <DatePicker
                                                    format={formDateFormat}
                                                    style={{ width: '100%' }}
                                                    onChange={createChange('arrival_date')}
                                                />
                                            </Form.Item>
                                        </div>
                                        <div className={styles.dateInput}>
                                            <Form.Item
                                                label='Как добрался?'
                                                name={['updated_arrivals', index, 'arrival_transport']}
                                                rules={Rules.required}
                                            >
                                                <Select
                                                    {...transportsSelectProps}
                                                    style={{ width: '100%' }}
                                                    onChange={createChange('arrival_transport')}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                    <div className={styles.dateWrap}>
                                        <div
                                            className={`${styles.dateLabel} ${styles.dateLabelEmpty}`}
                                            style={{ visibility: 'hidden' }}
                                        >
                                            <div>Заезд {index + 1}</div>
                                            <Button
                                                className={styles.deleteButton}
                                                danger
                                                type='link'
                                                icon={<DeleteOutlined />}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                        <div className={styles.dateInput}>
                                            <Form.Item
                                                label='Дата отъезда'
                                                name={['updated_arrivals', index, 'departure_date']}
                                                getValueProps={getDateValue}
                                                rules={activeToValidationRules(index)}
                                            >
                                                <DatePicker
                                                    format={formDateFormat}
                                                    style={{ width: '100%' }}
                                                    onChange={createChange('departure_date')}
                                                />
                                            </Form.Item>
                                        </div>
                                        <div className={styles.dateInput}>
                                            <Form.Item
                                                label='Как уехал?'
                                                name={['updated_arrivals', index, 'departure_transport']}
                                                rules={Rules.required}
                                            >
                                                <Select
                                                    {...transportsSelectProps}
                                                    style={{ width: '100%' }}
                                                    onChange={createChange('departure_transport')}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })}
                    <Button
                        className={styles.addArrivalButton}
                        type='primary'
                        icon={<PlusSquareOutlined />}
                        onClick={addArrival}
                    >
                        Добавить заезд
                    </Button>
                </div>
                <div id='section4' className={styles.formSection} style={{ display: denyBadgeEdit ? 'none' : '' }}>
                    <p className={styles.formSection__title}>Бейдж</p>
                    <div className={styles.badgeInfoWrap}>
                        <div className={styles.badgeInfo}>
                            <Form.Item label='QR бейджа' name='qr' rules={Rules.required}>
                                <Input disabled={denyBadgeEdit} onChange={onQRChange} />
                            </Form.Item>
                        </div>
                        <div className={styles.badgeInfo}>
                            <Form.Item label='Групповой бейдж' name='group_badge'>
                                <Select
                                    disabled={!canEditGroupBadge}
                                    allowClear
                                    {...groupBadgeSelectProps}
                                    onClear={onGroupBadgeClear}
                                />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.badgeInfoWrap}>
                        <div className={styles.badgeInfo}>
                            <div className={styles.badgeInfoPart}>
                                <Form.Item
                                    label='Партия бейджа'
                                    name='printing_batch'
                                    className={styles.badgeInfoPartItem}
                                >
                                    <Input readOnly disabled={denyBadgeEdit} />
                                </Form.Item>
                                <Form.Item
                                    label='Номер бейджа'
                                    name='badge_number'
                                    className={styles.badgeInfoPartItem}
                                >
                                    <Input disabled={denyBadgeEdit} />
                                </Form.Item>
                            </div>
                        </div>
                        <div className={styles.badgeInfo}>
                            <Form.Item label='Цвет бейджа' name='color_type'>
                                <Select disabled={denyBadgeEdit} {...colorTypeSelectProps} />
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div id='section5' className={styles.formSection} style={{ display: denyBadgeEdit ? 'none' : '' }}>
                    <p className={styles.formSection__title}>Кастомные Поля</p>
                    {customFields.map(({ id, name, type }) => {
                        const handleChange = (e) => {
                            const value = e.target[type === 'boolean' ? 'checked' : 'value'];
                            form.setFieldValue(['updated_custom_fields', id.toString()], value);
                        };
                        const customFieldValues = form.getFieldValue('custom_field_values');
                        if (!customFieldValues) return null;
                        const customFieldValue = customFieldValues.find(({ custom_field }) => custom_field === id);
                        return (
                            <Form.Item key={name} label={name}>
                                {type === 'boolean' && (
                                    <Checkbox
                                        defaultChecked={customFieldValue ? customFieldValue.value === 'true' : false}
                                        onChange={handleChange}
                                    />
                                )}
                                {type === 'string' && (
                                    <Input
                                        defaultValue={customFieldValue ? customFieldValue.value : ''}
                                        onChange={handleChange}
                                    />
                                )}
                            </Form.Item>
                        );
                    })}
                </div>
                <div id='section6' className={styles.formSection}>
                    <p className={styles.formSection__title}>Дополнительно</p>
                    <div className='commentArea'>
                        <Form.Item label='Комментарий' name={denyBadgeEdit ? 'direction_head_comment' : 'comment'}>
                            <ReactQuill className={styles.reactQuill} modules={{ toolbar: false }} />
                        </Form.Item>
                    </div>
                    <div className={styles.blockDeleteWrap}>
                        {!denyBadgeEdit && (
                            <Button
                                className={styles.blockButton}
                                type='default'
                                onClick={() => setOpen(true)}
                                disabled={isBlocked ? !canUnban : false}
                            >
                                {isBlocked ? <SmileOutlined /> : <FrownOutlined />}
                                {`${isBlocked ? `Разблокировать волонтера` : `Заблокировать Волонтера`}`}
                            </Button>
                        )}
                        <Modal
                            closable={false}
                            centered
                            open={open}
                            okText={'Оставить'}
                            cancelText={`${isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}`}
                            onOk={() => setOpen(false)}
                            onCancel={handleToggleBlocked}
                            width={420}
                            footer={null}
                        >
                            <div className={styles.modalWindow}>
                                <span className={styles.carefulIcon}>
                                    <span className={styles.carefulDescr}>!</span>
                                </span>
                                <p className={styles.modalTitle}>
                                    {isBlocked ? 'Разблокировать волонтера?' : 'Заблокировать Волонтера?'}
                                </p>
                                <p className={styles.modalDescr}>
                                    {isBlocked
                                        ? 'Бейдж Волонтера активируется: Волонтер сможет питаться на кухнях и получит доступ ко всем плюшкам. Волонтера можно будет заблокировать'
                                        : 'Бейдж Волонтера деактивируется: Волонтер не сможет питаться на кухнях и потеряет доступ ко всем плюшкам. Волонтера можно будет разблокировать'}
                                </p>
                                <div className={styles.modalButtonWrap}>
                                    <Button className={styles.onCancelButton} onClick={handleToggleBlocked}>
                                        {`${isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}`}
                                    </Button>
                                    <Button type='primary' onClick={() => setOpen(false)}>
                                        {'Оставить'}
                                    </Button>
                                </div>
                            </div>
                        </Modal>
                        {canDelete && (
                            <DeleteButton
                                type='primary'
                                icon={false}
                                size='middle'
                                recordItemId={qrDuplicateVolunteer?.id}
                                confirmTitle='Вы действительно хотите удалить волонтера?'
                                confirmOkText='Да'
                                confirmCancelText='Нет'
                                onSuccess={handleBack}
                            >
                                Удалить волонтера
                            </DeleteButton>
                        )}
                    </div>
                    <div className={styles.visuallyHidden}>
                        <Form.Item name='is_blocked' valuePropName='checked' style={{ marginBottom: '0' }}>
                            <Checkbox disabled={!canFullEditing}>Заблокирован</Checkbox>
                        </Form.Item>
                        <Form.Item name='person' hidden></Form.Item>
                    </div>
                </div>
                <div id='section7' className={styles.formSection}>
                    <p className={styles.formSection__title}>Участие во все года</p>
                    <div className={styles.engagementsWrap}>{returnEngagementsLayout()}</div>
                </div>
            </div>
            <Modal
                title='Дублирование QR'
                open={
                    qrDuplicateVolunteer !== null &&
                    !qrDuplicateVolunteer.arrivals.some(({ status }) => isActivatedStatus(status))
                }
                onOk={handleClear}
                onCancel={handleCancel}
                okText='Освободить'
            >
                <p>Этот QR уже привязан к другому волонтеру.</p>
                <p>Освободить этот QR код?</p>
            </Modal>
            <Modal
                title='Дублирование QR'
                open={
                    qrDuplicateVolunteer !== null &&
                    qrDuplicateVolunteer.arrivals.some(({ status }) => isActivatedStatus(status))
                }
                onOk={handleOpenVolunteer}
                onCancel={handleCancel}
                okText='Открыть'
            >
                <p>Этот QR уже привязан к активированному волонтеру.</p>
                <p>Открыть карточку этого волонтера?</p>
            </Modal>
        </div>
    );
}
