
import './JsonViewer.css';
import { ActionImage } from '../../actionimage/ActionImage';
import { Copy24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../allcommon/FnGetCssVariable';
import { FnParseJsonSafely } from '../../../../appcontainer/allcommon/FnParseJsonSafely';

interface IJsonViewer {
    uniqueName: string;
    jsonData: { [key: string]: any } | string;
    showAsDiv?: boolean;
    width?: string;
    height?: string;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
}

const JsonViewer = (props: IJsonViewer) => {
    const formattedJson =
        typeof props.jsonData === 'string'
            ? FnParseJsonSafely(props.jsonData)
            : props.jsonData;

    const jsonObject =
        formattedJson && typeof formattedJson === 'object' && !Array.isArray(formattedJson)
            ? formattedJson as Record<string, unknown>
            : null;

    const hasUrlAndPayload = Boolean(
        jsonObject &&
        typeof jsonObject.url === 'string' &&
        jsonObject.url.trim().length > 0 &&
        Object.prototype.hasOwnProperty.call(jsonObject, 'payload') &&
        jsonObject.payload !== undefined &&
        jsonObject.payload !== null
    );

    const handleCopy = async () => {
        const text =
            typeof formattedJson === 'string'
                ? formattedJson
                : JSON.stringify(formattedJson, null, 2);
        await navigator.clipboard.writeText(text);
    };

    const handleCopyUrlAndPayload = async () => {
        if (!jsonObject || !hasUrlAndPayload) {
            return;
        }

        const url = String(jsonObject.url).trim();
        const payloadText =
            typeof jsonObject.payload === 'string'
                ? jsonObject.payload
                : JSON.stringify(jsonObject.payload, null, 2);

        await navigator.clipboard.writeText(`${url}\n${payloadText}`);
    };

    return (
        <div
            className="nz-json-viewer-container"
            style={{
                width: props.width ?? '100%',
                height: props.height ?? '100%',
            }}
        >
            <div className="nz-json-toolbar">
                {hasUrlAndPayload && (
                    <ActionImage
                        image={{
                            uniqueName: "copy-url-payload",
                            source: <Copy24x24
                                size={FnGetCssVariable('--image-size-1')}
                                fill='none'
                                strokeWidth={1} />,
                            type: "svg",
                            w: "var(--image-size-1)",
                            h: "var(--image-size-1)"
                        }}
                        uniqueName='copy-url-payload'
                        w="var(--node_height)"
                        h="var(--node_height)"
                        actionCode={'copyurlpayload'}
                        tooltip='Copy URL and Payload'
                        handleMouse={() => {
                            handleCopyUrlAndPayload();
                        }}
                    />
                )}
                <ActionImage
                    image={{
                        uniqueName: "copy",
                        source: <Copy24x24
                            size={FnGetCssVariable('--image-size-1')}
                            fill='none'
                            strokeWidth={1} />,
                        type: "svg",
                        w: "var(--image-size-1)",
                        h: "var(--image-size-1)"
                    }}
                    uniqueName='copy'
                    w="var(--node_height)"
                    h="var(--node_height)"
                    tooltip='Copy Json'
                    actionCode={'copymdstring'}
                    handleMouse={() => {
                        handleCopy();
                    }}
                />

            </div>
        </div>
    );
};

export { JsonViewer };
export type { IJsonViewer };
