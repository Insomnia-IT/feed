import { Form, Modal } from 'antd';
import { useSelect } from '@refinedev/core';
import { useEffect, useRef } from 'react';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity
} from 'interfaces';
import { isActivatedStatus } from 'shared/lib';
import useCanAccess from '../use-can-access';
import { useAnchorNavigation, useQrDuplicationCheck } from './hooks';
import {
    AdditionalSection,
    ArrivalsSection,
    PersonalInfoSection,
    CustomFieldsSection,
    HrInfoSection,
    VolInfoSection,
    PreviousYearsSection,
    SidebarNavigation
} from './sections';

//TODO: разнести стили по секциям
import styles from '../common.module.css';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import { useLocation } from 'react-router-dom';

export const CommonEdit = () => {
    const form = Form.useFormInstance();

    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });
    const denyBadgeEdit = !useCanAccess({ action: 'badge_edit', resource: 'volunteers' });
    const denyFeedTypeEdit = !useCanAccess({ action: 'feed_type_edit', resource: 'volunteers' });
    const canBadgeEdit = useCanAccess({ action: 'badge_edit', resource: 'volunteers' });
    const canUnban = useCanAccess({ action: 'unban', resource: 'volunteers' });
    const canEditGroupBadge = useCanAccess({ action: 'edit', resource: 'group-badges' });
    const canDelete = useCanAccess({ action: 'delete', resource: 'volunteers' });

    const person = Form.useWatch('person', form);

    const loadPerson = async () => {
        const personId = new URLSearchParams(search).get('person_id');
        if (!personId) return;

        try {
            const { data } = await axios.get(`${NEW_API_URL}/persons/${personId}`);

            form.setFieldValue('person_id', personId);
            form.setFieldValue('person', data);
            ['first_name', 'last_name', 'name', 'is_vegan', 'gender'].forEach((fieldName) => {
                form.setFieldValue(fieldName, data[fieldName]);
            })

        } catch (e) {
            console.error(e);
        }
    }
    const { search } = useLocation();

    useEffect(() => {
        loadPerson();
    }, [search, form]);

    const volunteerId = form.getFieldValue('id');
    const isBlocked = Form.useWatch('is_blocked', form);

    const { options: kitchenOptions } = useSelect<KitchenEntity>({ resource: 'kitchens', optionLabel: 'name' });
    const { options: feedTypeOptions } = useSelect<FeedTypeEntity>({ resource: 'feed-types', optionLabel: 'name' });
    const { options: colorTypeOptions } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { options: genderOptions } = useSelect<AccessRoleEntity>({ resource: 'genders', optionLabel: 'name' });

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

    return (
        <div className={styles.edit}>
            <SidebarNavigation activeAnchor={activeAnchor} denyBadgeEdit={denyBadgeEdit} />

            <div className={styles.formWrap} ref={containerRef}>
                <section id="section1" className={styles.formSection}>
                    <VolInfoSection
                        denyBadgeEdit={denyBadgeEdit}
                        feedTypeOptions={feedTypeOptions}
                        kitchenOptions={kitchenOptions}
                        genderOptions={genderOptions}
                        denyFeedTypeEdit={denyFeedTypeEdit}
                        canEditGroupBadge={canEditGroupBadge}
                        colorTypeOptions={colorTypeOptions}
                        groupBadgeOptions={groupBadgeOptions}
                        handleQRChange={handleQRChange}
                        person={person}
                    />
                </section>
                <section id="section2" className={styles.formSection}>
                    <ArrivalsSection statusesOptions={statusesOptions} transportsOptions={transportsOptions} />
                </section>
                <section id="section3" className={styles.formSection} style={{ display: denyBadgeEdit ? 'none' : '' }}>
                    <PersonalInfoSection
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
                    <CustomFieldsSection canBadgeEdit={canBadgeEdit} />
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
