import { Form, Modal } from 'antd';
import { useList, useSelect } from '@refinedev/core';
import { type ChangeEvent, useEffect, useRef } from 'react';

import type {
    ColorTypeEntity,
    FeedTypeEntity,
    GenderEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity
} from 'interfaces';
import useCanAccess from '../use-can-access';
import { useAnchorNavigation, useQrDuplicationCheck } from './hooks';
import {
    AdditionalSection,
    ArrivalsSection,
    PersonalInfoSection,
    CustomFieldsSection,
    HrInfoSection,
    VolInfoSection,
    PaidArrivalsSection,
    PreviousYearsSection,
    SidebarNavigation
} from './sections';

//TODO: разнести стили по секциям
import styles from '../common.module.css';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import { useLocation, useParams } from 'react-router';
import { isVolunteerActivatedStatusValue } from 'shared/helpers/volunteer-status';

export const CommonEdit = () => {
    const form = Form.useFormInstance();

    const person = Form.useWatch('person', form);
    const { id: routeVolunteerId } = useParams<{ id: string }>();
    const { search, pathname } = useLocation();

    const isCreationProcess = pathname.includes('create');

    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });
    const denyBadgeEdit = !useCanAccess({ action: 'badge_edit', resource: 'volunteers' });

    // Во время создания нужно редактировать тип питания
    const denyFeedTypeEdit = !useCanAccess({ action: 'feed_type_edit', resource: 'volunteers' }) && !isCreationProcess;
    const canBadgeEdit = useCanAccess({ action: 'badge_edit', resource: 'volunteers' });
    const canUnban = useCanAccess({ action: 'unban', resource: 'volunteers' });
    const canEditGroupBadge = useCanAccess({ action: 'edit', resource: 'group-badges' });
    const canDelete = useCanAccess({ action: 'delete', resource: 'volunteers' });

    useEffect(() => {
        const loadPerson = async () => {
            const personId = new URLSearchParams(search).get('person_id');
            if (!personId) return;

            try {
                const { data } = await axios.get(`${NEW_API_URL}/persons/${personId}`);

                form.setFieldValue('person_id', personId);
                form.setFieldValue('person', data);
                ['first_name', 'last_name', 'name', 'is_vegan', 'gender'].forEach((fieldName) => {
                    form.setFieldValue(fieldName, data[fieldName]);
                });
            } catch (error) {
                console.error('<CommonEdit> loadPerson', error);
            }
        };

        loadPerson();
    }, [search, form]);

    const volunteerId = routeVolunteerId ?? form.getFieldValue('id');
    const isBlocked = Form.useWatch('is_blocked', form);
    const selectedFeedType = Form.useWatch('feed_type', form);

    const { options: kitchenOptions } = useSelect<KitchenEntity>({ resource: 'kitchens', optionLabel: 'name' });
    const { options: feedTypeOptions } = useSelect<FeedTypeEntity>({ resource: 'feed-types', optionLabel: 'name' });
    const { result: feedTypesResult } = useList<FeedTypeEntity>({
        resource: 'feed-types',
        pagination: { pageSize: 100 }
    });
    const { options: colorTypeOptions } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { options: genderOptions } = useSelect<GenderEntity>({ resource: 'genders', optionLabel: 'name' });

    const { options: groupBadgeOptions } = useSelect<GroupBadgeEntity>({
        resource: 'group-badges',
        optionLabel: 'name',
        optionValue: 'id',
        pagination: { mode: 'off' }
    });
    const { options: transportsOptions } = useSelect<TransportEntity>({ resource: 'transports', optionLabel: 'name' });
    const { options: statusesOptions } = useSelect<StatusEntity>({ resource: 'statuses', optionLabel: 'name' });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const { qrDuplicateVolunteer, setQrDuplicateVolunteer, handleDuplicateQRChange, clearDuplicateQR } =
        useQrDuplicationCheck(form);

    const handleQRChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleDuplicateQRChange(e);
        const { value } = e.target;
        if (value === '') {
            form.setFieldValue('qr', null);
        }
    };
    const { activeAnchor } = useAnchorNavigation(containerRef);
    const showPaidArrivals = (feedTypesResult.data ?? []).some(
        ({ id, code }: FeedTypeEntity) => id === selectedFeedType && (code === 'FREE' || code === 'PAID')
    );

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
        function onHardwareScan(e: CustomEvent<{ scanCode: string }>): void {
            const scanCode = e?.detail?.scanCode;
            if (scanCode) {
                form.setFieldValue('qr', scanCode.replace(/[^A-Za-z0-9]/g, ''));
            }
        }
        document.addEventListener('scan', onHardwareScan);
        return () => {
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [form]);

    // useEffect(() => {
    //     if (!person) {
    //         form.setFieldsValue({
    //             person: { banned: true }
    //         });
    //         return;
    //     }

    //     if (person.banned == null) {
    //         form.setFieldsValue({
    //             person: {
    //                 ...person,
    //                 banned: true
    //             }
    //         });
    //     }
    // }, [person]);

    return (
        <div className={styles.edit}>
            <SidebarNavigation
                activeAnchor={activeAnchor}
                denyBadgeEdit={denyBadgeEdit}
                showPaidArrivals={showPaidArrivals}
            />

            <div className={styles.formWrap} ref={containerRef}>
                <section id="section1" className={styles.formSection}>
                    <VolInfoSection
                        denyBadgeEdit={denyBadgeEdit}
                        canEditGroupBadge={canEditGroupBadge}
                        colorTypeOptions={colorTypeOptions}
                        groupBadgeOptions={groupBadgeOptions}
                        person={person}
                    />
                </section>
                <section id="section2" className={styles.formSection}>
                    <ArrivalsSection statusesOptions={statusesOptions} transportsOptions={transportsOptions} />
                </section>
                <section
                    id="section2paid"
                    className={styles.formSection}
                    style={{ display: showPaidArrivals ? undefined : 'none' }}
                >
                    <PaidArrivalsSection visible={showPaidArrivals} />
                </section>
                <section id="section3" className={styles.formSection}>
                    <PersonalInfoSection
                        canFullEditing={canFullEditing}
                        isCreationProcess={isCreationProcess}
                        denyBadgeEdit={denyBadgeEdit}
                        handleQRChange={handleQRChange}
                        feedTypeOptions={feedTypeOptions}
                        kitchenOptions={kitchenOptions}
                        denyFeedTypeEdit={denyFeedTypeEdit}
                        genderOptions={genderOptions}
                    />
                </section>
                <section id="section4" className={styles.formSection}>
                    <HrInfoSection canFullEditing={canFullEditing} denyBadgeEdit={denyBadgeEdit} person={person} />
                </section>
                <section id="section5" className={styles.formSection}>
                    <CustomFieldsSection canBadgeEdit={canBadgeEdit} volunteerId={volunteerId} />
                </section>
                <section id="section6" className={styles.formSection}>
                    <AdditionalSection
                        isBlocked={isBlocked}
                        canUnban={canUnban}
                        canDelete={canDelete}
                        volunteerId={volunteerId}
                    />
                </section>
                <section id="section7" className={styles.formSection}>
                    <PreviousYearsSection person={person} />
                </section>
            </div>

            <Modal
                title="Дублирование QR"
                open={
                    qrDuplicateVolunteer !== null &&
                    !qrDuplicateVolunteer?.arrivals?.some(({ status }) => isVolunteerActivatedStatusValue(status))
                }
                onOk={handleClear}
                onCancel={handleCancel}
                okText="Освободить"
            >
                <p>Этот QR уже привязан к другому волонтеру.</p>
                <p>Освободить этот QR код?</p>
            </Modal>

            <Modal
                title="Дублирование QR"
                open={
                    qrDuplicateVolunteer !== null &&
                    qrDuplicateVolunteer?.arrivals?.some(({ status }) => isVolunteerActivatedStatusValue(status))
                }
                onOk={handleOpenVolunteer}
                onCancel={handleCancel}
                okText="Открыть"
            >
                <p>Этот QR уже привязан к активированному волонтеру.</p>
                <p>Открыть карточку этого волонтера?</p>
            </Modal>
        </div>
    );
};
