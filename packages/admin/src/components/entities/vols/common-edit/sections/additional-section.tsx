import { useState } from 'react';
import { Divider, Form, Input, Button, Checkbox } from 'antd';
import { FrownOutlined, SmileOutlined } from '@ant-design/icons';
import { DeleteButton } from '@refinedev/antd';
import { useNavigate } from 'react-router-dom';

import BanModal from './ban-modal';
import useCanAccess from '../../use-can-access';

import styles from '../../common.module.css';

export const AdditionalSection = ({
    isBlocked,
    canUnban,
    canDelete,
    volunteerId
}: {
    isBlocked: boolean;
    canUnban: boolean;
    canDelete: boolean;
    volunteerId: number;
}) => {
    const form = Form.useFormInstance();
    const [isBanModalVisible, setBanModalVisible] = useState(false);
    const navigate = useNavigate();

    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });

    const canAccessBadgeEdit = useCanAccess({ action: 'badge_edit', resource: 'volunteers' });

    const isDirectionHead = !canAccessBadgeEdit;

    const currentComment = form.getFieldValue('comment') || '';

    const handleBanSuccess = (updatedData: any) => {
        form.setFieldsValue(updatedData);
        setBanModalVisible(false);
    };

    const handleBack = () => {
        navigate('..');
    };
    
    return (
        <>
            <p className={styles.formSection__title}>Дополнительно</p>
            <div className="commentArea">
                <Form.Item label="Комментарий" name={'comment'}>
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} disabled={isDirectionHead} />
                </Form.Item>
                <Form.Item label="Заметка" name="direction_head_comment">
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} disabled={!isDirectionHead} />
                </Form.Item>
            </div>
            <Divider />

            <div className={styles.blockDeleteWrap}>
                <Button
                    className={styles.blockButton}
                    type="default"
                    onClick={() => setBanModalVisible(true)}
                    disabled={isBlocked ? !canUnban : false}
                >
                    {isBlocked ? <SmileOutlined /> : <FrownOutlined />}
                    {`${isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}`}
                </Button>

                <BanModal
                    isBlocked={isBlocked}
                    visible={isBanModalVisible}
                    onCancel={() => setBanModalVisible(false)}
                    volunteerId={volunteerId}
                    currentComment={currentComment}
                    onSuccess={handleBanSuccess}
                />

                {canDelete && (
                    <DeleteButton
                        type="primary"
                        icon={false}
                        size="middle"
                        recordItemId={volunteerId}
                        confirmTitle="Вы действительно хотите удалить волонтера?"
                        confirmOkText="Да"
                        confirmCancelText="Нет"
                        onSuccess={handleBack}
                    >
                        Удалить волонтера
                    </DeleteButton>
                )}
            </div>
            <div className={styles.visuallyHidden}>
                <Form.Item name="is_blocked" valuePropName="checked" style={{ marginBottom: '0' }}>
                    <Checkbox disabled={!canFullEditing}>Заблокирован</Checkbox>
                </Form.Item>
                <Form.Item name="person" hidden />
            </div>
        </>
    );
};
