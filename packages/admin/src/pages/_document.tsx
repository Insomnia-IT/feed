import type { DocumentContext, DocumentInitialProps } from 'next/document';
import Document from 'next/document';

class CustomDocument extends Document {
    static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
        const initialProps = await Document.getInitialProps(ctx);

        return initialProps;
    }
}

export default CustomDocument;
