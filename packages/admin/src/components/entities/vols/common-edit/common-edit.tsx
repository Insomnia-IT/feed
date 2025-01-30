import { Form, Modal } from 'antd';
import { useSelect } from '@refinedev/core';
import { useEffect, useRef, useState } from 'react';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolunteerRoleEntity
} from 'interfaces';
import { isActivatedStatus } from 'shared/lib';
import { dataProvider } from 'dataProvider';
import useCanAccess from '../use-can-access';
import { useAnchorNavigation, useQrDuplicationCheck } from './hooks';
import {
    AdditionalSection,
    ArrivalsSection,
    BadgeSection,
    CustomFieldsSection,
    HrInfoSection,
    PersonalInfoSection,
    PreviousYearsSection,
    SidebarNavigation
} from './sections';

//TODO: разнести стили по секциям
import styles from '../common.module.css';

export const CommonEdit = () => {
    const form = Form.useFormInstance();

    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
    const denyBadgeEdit = !useCanAccess({ action: 'badge_edit', resource: 'volunteers' });
    const denyFeedTypeEdit = !useCanAccess({ action: 'feed_type_edit', resource: 'volunteers' });
    const canBadgeEdit = useCanAccess({ action: 'badge_edit', resource: 'volunteers' });
    const canUnban = useCanAccess({ action: 'unban', resource: 'volunteers' });
    const canEditGroupBadge = useCanAccess({ action: 'edit', resource: 'group-badges' });
    const canDelete = useCanAccess({ action: 'delete', resource: 'volunteers' });

    const person = Form.useWatch('person', form);
    const mainRole = Form.useWatch('main_role', form);
    const volunteerId = form.getFieldValue('id');
    const isBlocked = Form.useWatch('is_blocked', form);

    const { options: directionOptions } = useSelect<DirectionEntity>({ resource: 'directions', optionLabel: 'name' });
    const { options: kitchenOptions } = useSelect<KitchenEntity>({ resource: 'kitchens', optionLabel: 'name' });
    const { options: feedTypeOptions } = useSelect<FeedTypeEntity>({ resource: 'feed-types', optionLabel: 'name' });
    const { options: colorTypeOptions } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });
    const { options: accessRoleOptions } = useSelect<AccessRoleEntity>({
        resource: 'access-roles',
        optionLabel: 'name'
    });
    const { options: genderOptions } = useSelect<AccessRoleEntity>({ resource: 'genders', optionLabel: 'name' });
    const { options: rolesOptions } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name'
    });
    const { options: groupBadgeOptions } = useSelect<GroupBadgeEntity>({
        resource: 'group-badges',
        optionLabel: 'name'
    });
    const { options: transportsOptions } = useSelect<TransportEntity>({ resource: 'transports', optionLabel: 'name' });
    const { options: statusesOptions } = useSelect<StatusEntity>({ resource: 'statuses', optionLabel: 'name' });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const { qrDuplicateVolunteer, setQrDuplicateVolunteer, handleQRChange, clearDuplicateQR } =
        useQrDuplicationCheck(form);
    const { activeAnchor } = useAnchorNavigation(containerRef);

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

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    useEffect(() => {
        const loadCustomFields = async () => {
            const { data } = await dataProvider.getList<CustomFieldEntity>({
                resource: 'volunteer-custom-fields'
            });

            setCustomFields(data);
        };

        void loadCustomFields();
    }, []);

    return (
        <div className={styles.edit}>
            <SidebarNavigation activeAnchor={activeAnchor} denyBadgeEdit={denyBadgeEdit} />

            <div className={styles.formWrap} ref={containerRef}>
                <section id="section1" className={styles.formSection}>
                    <PersonalInfoSection
                        isBlocked={isBlocked}
                        denyBadgeEdit={denyBadgeEdit}
                        feedTypeOptions={feedTypeOptions}
                        kitchenOptions={kitchenOptions}
                        genderOptions={genderOptions}
                        denyFeedTypeEdit={denyFeedTypeEdit}
                    />
                </section>
                <section id="section2" className={styles.formSection}>
                    <HrInfoSection
                        canFullEditing={canFullEditing}
                        allowRoleEdit={allowRoleEdit}
                        denyBadgeEdit={denyBadgeEdit}
                        person={person}
                        mainRole={mainRole}
                        directionOptions={directionOptions}
                        rolesOptions={rolesOptions}
                        accessRoleOptions={accessRoleOptions}
                    />
                </section>
                <section id="section3" className={styles.formSection}>
                    <ArrivalsSection statusesOptions={statusesOptions} transportsOptions={transportsOptions} />
                </section>
                <section id="section4" className={styles.formSection} style={{ display: denyBadgeEdit ? 'none' : '' }}>
                    <BadgeSection
                        denyBadgeEdit={denyBadgeEdit}
                        canEditGroupBadge={canEditGroupBadge}
                        colorTypeOptions={colorTypeOptions}
                        groupBadgeOptions={groupBadgeOptions}
                        handleQRChange={handleQRChange}
                    />
                </section>
                <section id="section5" className={styles.formSection}>
                    <CustomFieldsSection customFields={customFields} canBadgeEdit={canBadgeEdit} />
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
                    !qrDuplicateVolunteer?.arrivals?.some(({ status }) => isActivatedStatus(status))
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
                    qrDuplicateVolunteer?.arrivals?.some(({ status }) => isActivatedStatus(status))
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
