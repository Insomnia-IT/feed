import { Form } from 'antd';
import { SupervisorField } from './supervisor-field';
import { ResponsibleOne } from './responsible-one';
import ResponsibleFor from './responsible-for';

const Connections = () => {
    const form = Form.useFormInstance();

    return (
        <div>
            <SupervisorField form={form} />
            <ResponsibleOne form={form} />
            <ResponsibleFor />
        </div>
    );
};

export default Connections;
