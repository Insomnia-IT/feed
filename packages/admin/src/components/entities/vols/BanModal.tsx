import { Modal, Form, Input, Button, Row, Col, notification } from '@pankod/refine-antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { dataProvider } from '~/dataProvider';

interface BanModalProps {
    isBlocked: boolean;
    visible: boolean;
    onCancel: () => void;
    volunteerId: string | number;
    currentComment: string;
    onSuccess: (updatedData: any) => void;
}

const BanModal: React.FC<BanModalProps> = ({
    isBlocked,
    visible,
    onCancel,
    volunteerId,
    currentComment,
    onSuccess
}) => {
    const [form] = Form.useForm();

    const handleFinish = async () => {
        try {
            const values = await form.validateFields();
            const reason = values.reason;
            const currentDate = new Date();
            const formattedDate = `${currentDate.toLocaleDateString('ru')} ${currentDate.toLocaleTimeString('ru', {
                timeStyle: 'short'
            })}`;

            const action = isBlocked ? 'разблокировки' : 'блокировки';
            const updatedReason = `${formattedDate} Причина ${action}: "${reason}"`;
            const updatedComment = `${updatedReason}\n${currentComment}`.trim();

            const updatedData = {
                is_blocked: !isBlocked,
                comment: updatedComment
            };

            await dataProvider.update({
                id: volunteerId,
                resource: 'volunteers',
                variables: updatedData
            });

            notification.success({
                message: `Волонтёр ${!isBlocked ? 'заблокирован' : 'разблокирован'} успешно`
            });

            onSuccess(updatedData);
            form.resetFields();
        } catch (error) {
            notification.error({
                message: 'Ошибка при обновлении волонтёра'
            });
        }
    };

    return (
        <Modal
            title={
                <Row align='middle' gutter={8}>
                    <Col>
                        <ExclamationCircleOutlined style={{ fontSize: 24, color: 'orange' }} />
                    </Col>
                    <Col>{isBlocked ? 'Разблокировка Волонтера' : 'Блокировка Волонтера'}</Col>
                </Row>
            }
            closable={true}
            footer={null}
            centered
            open={visible}
            onCancel={onCancel}
        >
            <p>
                {isBlocked
                    ? `Бейдж Волонтера активируется: Волонтер сможет питаться на кухнях и получит доступ ко всем плюшкам. Волонтера можно будет заблокировать`
                    : `Бейдж Волонтера деактивируется: Волонтер не сможет питаться на кухнях и потеряет доступ ко всем плюшкам. Волонтера можно будет разблокировать`}
            </p>
            <Form form={form} name='form-block' onFinish={handleFinish} layout='vertical'>
                <Form.Item
                    label={`${isBlocked ? 'Причина разблокировки' : 'Причина блокировки'}`}
                    name='reason'
                    rules={[
                        {
                            required: true,
                            message: isBlocked ? 'Укажите причину разблокировки' : 'Укажите причину блокировки',
                            min: 3
                        }
                    ]}
                >
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
                </Form.Item>
                <div style={{ textAlign: 'right' }}>
                    <Button type={isBlocked ? 'primary' : 'default'} danger={!isBlocked} htmlType='submit'>
                        {isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default BanModal;
