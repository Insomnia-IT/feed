import type { FormInstance } from '@pankod/refine-antd';
import { Button, Checkbox, DatePicker, Form, Icon, Input, Modal, Select, useSelect } from '@pankod/refine-antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Rules } from '~/components/form';
import { SmileOutlined, FrownOutlined, RadarChartOutlined } from '@ant-design/icons';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DepartmentEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    VolEntity
} from '~/interfaces';
import { formDateFormat } from '~/shared/lib';
import { dataProvider } from '~/dataProvider';

import useCanAccess from './use-can-access';
import styles from './common.module.css';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export const CreateEdit = ({ form }: { form: FormInstance }) => {
    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });
    const canEditGroupBadge = useCanAccess({ action: 'edit', resource: 'group-badges' });
    const person = Form.useWatch('person');

    const { selectProps: departmentSelectProps } = useSelect<DepartmentEntity>({
        resource: 'departments',
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

    const { selectProps: groupBadgeSelectProps } = useSelect<GroupBadgeEntity>({
        resource: 'group-badges',
        optionLabel: 'name'
    });

    const getDepartmentIds = (department) => {
        return {
            value: department ? department.map((d) => d.id || d) : department
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

    const activeToValidationRules = useMemo(
        () => [
            {
                required: true
            },
            {
                validator: async (_, value) => {
                    if (new Date(value) >= new Date(form.getFieldValue('active_from'))) {
                        return Promise.resolve();
                    }

                    return Promise.reject(new Error("Дата 'До' не может быть меньше даты 'От'"));
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

    const generateRandomString = () => {
        return Math.random().toString(36).substring(2, 15);
    }

    function returnParticipationLayout() {
        if (!person) return null;
        console.log(person.engagements)
        const participationArray = person.engagements;
        if (participationArray.length) {
            return participationArray.map((item) => {
                return (
                    <div key={generateRandomString()}>
                        <span className={styles.participationDescr}>
                            {`${item.year} год`}
                        </span>
                        <RadarChartOutlined style={{ marginRight: '3px' }} />
                        <span className={styles.participationDescr}>
                            {item.direction.name}
                        </span>
                        <span className={styles.participationDescr}>
                            {`(${item.role.name})`}
                        </span>
                    </div>
                )
            })
        } else {
            return null;
        }
    }

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
                    >
                        Бейдж
                    </li>
                    <li
                        className={`${styles.navList__item} ${activeAnchor === 'section5' ? styles.active : ''}`}
                        data-id='section5'
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
                    <p className={styles.formSection__title}>
                        Персональная информация
                        {isBlocked && (
                            <div className={styles.bannedWrap}>
                                <span className={styles.bannedDescr}>Забанен</span>
                            </div>
                        )}
                    </p>
                    <div className={styles.personalWrap}>
                        <div className={styles.photoWrap}>
                            {/* <img className={styles.photo} src='' alt='Photo' /> */}
                            <svg width="112" height="112" viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M78.2754 52.9777C81.4165 52.9777 83.9629 49.8954 83.9629 46.0932C83.9629 42.291 81.4165 39.2087 78.2754 39.2087C75.1343 39.2087 72.5879 42.291 72.5879 46.0932C72.5879 49.8954 75.1343 52.9777 78.2754 52.9777Z" fill="black" />
                                <path d="M69.2944 81.2769C66.7779 79.5899 63.2184 82.6384 61.3389 88.0809C59.4594 93.5304 59.9861 99.3159 62.5061 101.001C65.0261 102.693 68.5909 99.6484 70.4634 94.1989C72.3341 88.7547 71.8144 82.9674 69.2944 81.2769Z" fill="black" />
                                <path d="M42.6496 81.2771C40.1278 82.9694 39.6028 88.7531 41.4806 94.1991C43.3548 99.6469 46.9178 102.694 49.4396 101.003C51.9561 99.3161 52.4793 93.5306 50.6033 88.0846C48.7291 82.6403 45.1696 79.5919 42.6496 81.2771Z" fill="black" />
                                <path d="M101.463 3.52089C91.9557 3.31089 84.2854 4.70914 79.8299 7.43564C78.7292 9.05264 77.8507 11.0774 77.1979 13.4364C67.8372 5.35839 48.9109 4.55514 34.7289 12.9079C34.0762 10.7974 33.2554 8.96864 32.2509 7.51964C27.6309 4.74414 19.9169 3.47364 10.5212 3.73614C10.2972 12.6734 11.7794 19.8834 14.6844 24.0729C16.4694 25.1439 18.7269 25.9874 21.3554 26.6104C18.5292 31.8429 16.8352 38.1726 16.8352 45.6976C16.8352 45.6976 18.7654 43.2826 22.3284 40.1116C22.0362 52.9094 17.3829 61.8081 17.3829 61.8081C17.3829 61.8081 21.0684 60.9961 25.4382 57.6431C23.2087 68.8116 16.7144 77.0296 16.7144 77.0296C16.7144 77.0296 22.5069 75.4844 28.5654 71.0236C26.4147 84.4654 15.1482 95.9191 15.1482 95.9191C15.1482 95.9191 24.4144 93.2066 32.5047 86.7981C31.8484 89.4914 31.8414 92.2284 31.8414 94.5226C31.8414 106.122 41.4892 108.498 55.9704 108.498C70.4517 108.498 80.0994 106.122 80.0994 94.5226C80.0994 92.3649 80.0977 89.8169 79.5517 87.2794C79.5692 81.9611 81.7602 73.1061 84.1962 65.4516C85.4877 67.3889 85.9514 70.0366 85.9514 70.0366C85.9514 70.0366 97.9634 53.5289 94.1712 34.2999C93.5132 30.9714 92.3827 28.4286 91.0089 26.4739C93.5674 25.8369 95.7374 24.9916 97.4367 23.9539C100.385 19.6121 101.745 12.3584 101.463 3.52089ZM24.1712 22.2441C21.8664 21.8976 19.9309 21.3079 18.5204 20.4609C16.8807 18.0984 16.0494 14.0366 16.1702 8.99839C21.4692 8.84789 25.8144 9.56539 28.4167 11.1316C29.2514 12.3356 29.8762 13.9859 30.2752 15.9756C27.9873 17.8027 25.9367 19.9085 24.1712 22.2441ZM55.9687 105.056C38.7154 105.056 35.3414 101.194 35.3414 94.5226C35.3414 89.6034 35.6109 85.2896 38.9394 82.2954L39.4067 81.8771L39.4924 81.2611C39.8442 78.7481 40.7349 76.8686 41.9337 76.1056C42.3362 75.8501 42.7544 75.7259 43.2129 75.7259C44.3907 75.7259 45.7959 76.5274 47.1732 77.9834L47.7979 78.6414L48.7044 78.5119C50.8569 78.2056 53.3017 78.0516 55.9704 78.0516C58.6427 78.0516 61.0874 78.2056 63.2399 78.5119L64.1464 78.6414L64.7712 77.9834C66.6892 75.9621 68.5862 75.2009 70.0072 76.1056C71.2077 76.8686 72.0949 78.7464 72.4467 81.2576L72.5342 81.8754L72.9997 82.2936C76.3282 85.2861 76.5994 89.6034 76.5994 94.5226C76.5977 101.194 73.2237 105.056 55.9687 105.056ZM75.8189 80.1866C75.2502 76.8896 73.9027 74.4851 71.9077 73.2146C69.2652 71.5329 65.8509 72.1874 62.8584 74.9926C58.6759 74.4851 53.2702 74.4851 49.0859 74.9926C46.0952 72.1874 42.6827 71.5311 40.0297 73.2164C38.0347 74.4921 36.6889 76.8949 36.1184 80.1884C35.285 81.0158 34.57 81.9545 33.9939 82.9779C32.4014 72.2819 26.9082 55.3261 26.9082 49.9029C26.9082 45.4509 26.6667 40.8414 27.7587 35.7699C33.1417 31.9199 40.3692 27.9789 49.1419 26.0626C49.1419 26.0626 43.0204 32.9524 35.1542 39.4834C34.6719 39.3112 34.1647 39.219 33.6527 39.2104C30.5097 39.2104 27.9652 42.2921 27.9652 46.0966C27.9652 49.9011 30.5097 52.9811 33.6527 52.9811C36.7904 52.9811 39.3402 49.9011 39.3402 46.0966C39.3402 43.8706 38.4547 41.9124 37.1019 40.6559C43.8552 38.3756 55.3912 33.6996 63.5532 26.2254C63.5532 26.2254 64.9812 34.2666 48.6379 39.5954C48.6379 39.5954 77.4972 38.8429 82.4654 27.9946C85.5997 35.1486 85.0257 41.7531 85.0257 49.9064C85.0257 50.9984 84.7999 52.5734 84.4447 54.4546C81.7007 61.0609 78.0729 72.4604 76.6554 81.1054C76.3911 80.7862 76.112 80.4796 75.8189 80.1866ZM93.5552 20.3121C91.8997 21.3271 89.4374 22.0044 86.4169 22.3141C85.187 21.6517 83.851 21.2088 82.4689 21.0051C82.2036 20.2844 81.8866 19.5838 81.5204 18.9086C81.7514 15.6011 82.4847 12.8904 83.7114 11.0791C86.2087 9.55139 90.4927 8.77439 95.8039 8.89339C95.9632 13.8266 95.2019 17.8849 93.5552 20.3121Z" fill="black" />
                            </svg>
                        </div>
                        <div className={styles.personalInfoWrap}>
                            <div className={styles.nickNameLastnameWrap}>
                                <div className={styles.nameInput}>
                                    <Form.Item label='Имя на бейдже' name='name' rules={Rules.required}>
                                        <Input />
                                    </Form.Item>
                                </div>
                                <div className={styles.nameInput}>
                                    <Form.Item label='Имя' name='first_name'>
                                        <Input />
                                    </Form.Item>
                                </div>
                                <div className={styles.nameInput}>
                                    <Form.Item label='Фамилия' name='last_name'>
                                        <Input />
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
                                        <Select {...genderSelectProps} />
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
                                <Select {...feedTypeSelectProps} />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.isActiveCheckboxWrap}>
                        <div className={styles.isActiveCheckbox}>
                            <Form.Item name='is_vegan' valuePropName='checked'>
                                <Checkbox>Веган</Checkbox>
                            </Form.Item>
                        </div>
                        <div className={styles.isActiveCheckbox}>
                            <Form.Item name='is_active' valuePropName='checked'>
                                <Checkbox>Активирован</Checkbox>
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
                            <Form.Item label='Роль' name='role'>
                                <Input />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.hrInputsWrap}>
                        <div className={styles.hrInput}>
                            <Form.Item
                                label='Служба / Локация'
                                getValueProps={getDepartmentIds}
                                name='departments'
                                rules={Rules.required}
                            >
                                <Select disabled={!canFullEditing} mode='multiple' {...departmentSelectProps} />
                            </Form.Item>
                        </div>
                        <div className={styles.hrInput}>
                            <Form.Item label='Должность' name='position'>
                                <Input />
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div id='section3' className={styles.formSection}>
                    <p className={styles.formSection__title}>Даты на поле</p>
                    <div className={styles.fieldsDates}>
                        <div className={styles.dateInput}>
                            <Form.Item
                                label='Дата заезда'
                                name='active_from'
                                getValueProps={getDateValue}
                                rules={Rules.required}
                            >
                                <DatePicker format={formDateFormat} style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                        <div className={styles.dateInput}>
                            <Form.Item
                                label='Дата отъезда'
                                name='active_to'
                                getValueProps={getDateValue}
                                rules={activeToValidationRules}
                            >
                                <DatePicker format={formDateFormat} style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div id='section4' className={styles.formSection}>
                    <p className={styles.formSection__title}>Бейдж</p>
                    <div className={styles.badgeInfoWrap}>
                        <div className={styles.badgeInfo}>
                            <Form.Item label='QR бейджа' name='qr' rules={Rules.required}>
                                <Input onChange={onQRChange} />
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
                            <Form.Item label='Номер бейджа' name='badge_number'>
                                <Input readOnly />
                            </Form.Item>
                        </div>
                        <div className={styles.badgeInfo}>
                            <Form.Item label='Цвет бейджа' name='color_type'>
                                <Select {...colorTypeSelectProps} />
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div id='section5' className={styles.formSection}>
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
                        <Form.Item label='Комментарий' name='comment'>
                            <ReactQuill className={styles.reactQuill} modules={{ toolbar: false }} />
                        </Form.Item>
                    </div>
                    <div>
                        <Button className={styles.blockButton} type='default' onClick={() => setOpen(true)}>
                            {isBlocked ? <SmileOutlined /> : <FrownOutlined />}
                            {`${isBlocked ? `Разблокировать волонтера` : `Заблокировать Волонтера`}`}
                        </Button>
                        <Modal
                            closable={false}
                            centered
                            open={open}
                            okText={'Оставить'}
                            cancelText={`${isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}`}
                            onOk={() => setOpen(false)}
                            onCancel={handleToggleBlocked}
                            width={420}
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
                            </div>
                        </Modal>
                    </div>
                    <div className={styles.visuallyHidden}>
                        <Form.Item name='is_blocked' valuePropName='checked' style={{ marginBottom: '0' }}>
                            <Checkbox disabled={!canFullEditing}>Заблокирован</Checkbox>
                        </Form.Item>
                        <Form.Item name='person' hidden></Form.Item>
                    </div>
                </div>
                <div id='section7' className={styles.formSection}>
                    <p className={styles.formSection__title}>Участие в прошлых годах</p>
                    <div className={styles.ParticipateWrap}>
                        {returnParticipationLayout()}
                    </div>
                </div>
            </div>
            <Modal
                title='Дублирование QR'
                open={qrDuplicateVolunteer !== null && !qrDuplicateVolunteer.is_active}
                onOk={handleClear}
                onCancel={handleCancel}
                okText='Освободить'
            >
                <p>Этот QR уже привязан к другому волонтеру.</p>
                <p>Освободить этот QR код?</p>
            </Modal>
            <Modal
                title='Дублирование QR'
                open={qrDuplicateVolunteer !== null && qrDuplicateVolunteer.is_active}
                onOk={handleOpenVolunteer}
                onCancel={handleCancel}
                okText='Открыть'
            >
                <p>Этот QR уже привязан к активированному волонтеру.</p>
                <p>Открыть карточку этого волонтера?</p>
            </Modal>
        </div>
    );
};
