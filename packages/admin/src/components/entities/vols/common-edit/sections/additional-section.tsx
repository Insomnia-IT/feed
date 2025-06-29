import { useState } from 'react';
import { Divider, Form, Input, Button, Checkbox, Tooltip } from 'antd';
import { FrownOutlined, SmileOutlined, InfoCircleOutlined } from '@ant-design/icons';
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

    const canEditBureauComment = useCanAccess({ action: 'bureau_comment_edit', resource: 'volunteers' });

    const canAccessBadgeEdit = useCanAccess({ action: 'badge_edit', resource: 'volunteers' });

    const isDirectionHead = !canAccessBadgeEdit;

    const currentComment = form.getFieldValue('comment') || '';

    const handleBanSuccess = (updatedData: Record<string, unknown>) => {
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
                <Form.Item
                    label={
                        <>
                            <span>Комментарий бюро</span>
                            <Tooltip title="заполняется в бюро, виден руководителю">
                                <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                        </>
                    }
                    name="comment"
                >
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} disabled={!canEditBureauComment} />
                </Form.Item>

                <Form.Item
                    label={
                        <>
                            <span>Комментарий руководителя службы</span>
                            <Tooltip title="заполняется руководителем, виден в бюро">
                                <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                        </>
                    }
                    name="direction_head_comment"
                >
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} disabled={!isDirectionHead} />
                </Form.Item>

                <Form.Item
                    label={
                        <>
                            <span>Сообщение для волонтера</span>
                            <Tooltip title="будет видно в кормителе">
                                <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                        </>
                    }
                    name="scanner_comment"
                >
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} disabled={isDirectionHead} maxLength={255} />
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
                    {isBlocked ? 'Разблокировать волонтера' : 'Заблокировать волонтера'}
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
                <Form.Item name="is_blocked" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox disabled={!canFullEditing}>Заблокирован</Checkbox>
                </Form.Item>
                <Form.Item name="person" hidden />
                <Form.Item name="person_id" hidden />
            </div>
        </>
    );
};
