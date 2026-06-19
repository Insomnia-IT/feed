import { useEffect } from 'react';
import { Form } from 'antd';

type VolunteerPersonBannedSyncProps = {
    onBannedChange: (banned: boolean) => void;
};

/**
 * Registers hidden person fields and keeps the page title in sync with person.banned.
 * The fields are prefilled via setFieldsValue in CommonEdit without visible Form.Items.
 */
export const VolunteerPersonBannedSync = ({ onBannedChange }: VolunteerPersonBannedSyncProps) => {
    const form = Form.useFormInstance();
    const personBanned = Form.useWatch((values) => values?.person?.banned === true, form);

    useEffect(() => {
        onBannedChange(Boolean(personBanned));
    }, [onBannedChange, personBanned]);

    return (
        <>
            <Form.Item name="person_id" hidden noStyle preserve>
                <span aria-hidden="true" />
            </Form.Item>
            <Form.Item name="person" hidden noStyle preserve>
                <span aria-hidden="true" />
            </Form.Item>
        </>
    );
};
