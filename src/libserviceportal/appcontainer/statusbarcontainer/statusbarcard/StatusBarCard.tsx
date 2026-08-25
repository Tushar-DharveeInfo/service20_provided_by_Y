

import { JSX, useEffect, useState } from 'react';
import MarkdownIt from 'markdown-it';
import parse from 'html-react-parser';
import ReactDOMServer from "react-dom/server";
import { Close24x24, Copy24x24, Warning, Critical } from '@n20a/libicon';
import '../../allcss/StatusBarCard.css';
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable.ts';
import { FnCopyToClipboard } from '../../../shared/allcommon/basic/FnCopyToClipboard.ts';
import { IStatusBarCard } from '../../allinterface/IStatusBarContainer.ts';
import { Label } from '../../../shared/basic/label/Label.tsx';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage.tsx';
import { IImage } from '../../../shared/allinterface/basic/IImage.ts';
import { Image } from '../../../shared/basic/image/Image.tsx';

const StatusBarCard = (statusBarCardProps: IStatusBarCard) => {
    const [titleContent, setTitleContent] = useState<JSX.Element>();
    const [content, setContent] = useState<JSX.Element>();
    const [contentToCopy, setContentToCopy] = useState<string>();
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    });

    function formatMarkdownToHTML(text: string) {
        return parse(md.render(text));
    }

    useEffect(() => {
        if (typeof statusBarCardProps.titleData === "string") {

            const title = `${statusBarCardProps.titleData}${statusBarCardProps?.messageSource ? ` from ${statusBarCardProps?.messageSource}` : ""}${statusBarCardProps?.lastDelivered ? ` delivered at ${statusBarCardProps.lastDelivered}` : ""}${statusBarCardProps?.lastUpdated ? ` updated on ${statusBarCardProps.lastUpdated}` : ""}`
            setTitleContent(<Label fontWeight='bold' uniqueName={`${statusBarCardProps.uniqueName}-header`} label={title} />)
            if (!statusBarCardProps.contentData)
                setContentToCopy(title)
        }
        else if (Array.isArray(statusBarCardProps.titleData)) {
            setTitleContent(<>
                {statusBarCardProps.titleData.map((str, idx) => (
                    <span key={idx}>
                        {str}
                        {idx < statusBarCardProps.titleData.length - 1 && (
                            <span style={{ color: "var(--bgexplorer)", padding: "0 4px" }}>|</span>
                        )}
                    </span>
                ))}</>
            );
            if (!statusBarCardProps.contentData)
                setContentToCopy(statusBarCardProps.titleData.join('|'))
        }
        if (statusBarCardProps.contentData) {

            if (typeof statusBarCardProps.contentData === "string") {
                setContent(<>{formatMarkdownToHTML(statusBarCardProps.contentData)}</>)
                setContentToCopy(statusBarCardProps.contentData)
            }
            else {
                setContent(statusBarCardProps.contentData);
                setContentToCopy(
                    ReactDOMServer.renderToStaticMarkup(
                        <>{statusBarCardProps.contentData}</>
                    )
                );
            }
        }
        else {
            if (!statusBarCardProps.titleData)
                setContentToCopy(undefined)
            setContent(undefined)
        }
    }, [statusBarCardProps.titleData, statusBarCardProps.uniqueName,
    statusBarCardProps.contentData, statusBarCardProps?.messageSource
        , statusBarCardProps?.lastDelivered, statusBarCardProps?.lastUpdated
    ]);

    useEffect(() => {
        let timeoutId: any = null;

        if (statusBarCardProps.duration && statusBarCardProps.severity !== "Critical") {
            timeoutId = setTimeout(() => {
                statusBarCardProps.handleCloseClick(statusBarCardProps.id);
            }, statusBarCardProps.duration);
        }

        return () => {
            clearTimeout(timeoutId); // cleanup when dependencies change
        };
    }, [
        statusBarCardProps.duration,
        statusBarCardProps.severity,
        statusBarCardProps.id
    ]);

    const imageProps: IImage = {
        source: statusBarCardProps.severity === "Warning" ? <Warning
            size={FnGetCssVariable('--image-size-1')}
            id="warning"
            fill='none'
            strokeWidth={1} /> : statusBarCardProps.severity === "Critical" ?
            <Critical
                size={FnGetCssVariable('--image-size-1')}
                fill='none'
                id="Error"
                strokeWidth={1} /> : "",
        uniqueName: `${statusBarCardProps.uniqueName}-image`,
        w: 'var(--image-size-1)',
        tooltip: statusBarCardProps.severity,
        type: 'svg'
    }

    return (
        <div
            title={statusBarCardProps.severity}
            key={statusBarCardProps.uniqueName}
            className={`nz-statusbar-card`}
        >
            <div className='nz-card-title'>
                <span className='nz-card-title-content'>{titleContent}</span>
                <div className='nz-card-title-action'>
                    {contentToCopy ? <ActionImage
                        image={{
                            uniqueName: "copy",
                            source: <Copy24x24
                                size={FnGetCssVariable('--image-size-1')}
                                fill='none'
                                strokeWidth={1} />,
                            type: "svg",
                            w: "var(--image-size-1)",
                            h: "var(--image-size-1)",
                            tooltip: "Copy Data"
                        }}
                        uniqueName='copy'
                        w='var(--node_height)'
                        h='var(--node_height)'
                        actionCode={'copymdstring'}
                        handleMouse={() => {
                            if (contentToCopy)
                                FnCopyToClipboard(contentToCopy)
                        }}
                    /> : <></>}
                    <div className='nz-statusbar-card-close-error'>
                        <div className={statusBarCardProps.severity === "Critical" ? ' nz-pulse' : ""}>
                            <ActionImage uniqueName={`${statusBarCardProps.uniqueName}-close-error`}
                                image={{
                                    uniqueName: `${statusBarCardProps.uniqueName}-close-image`,
                                    source: <Close24x24
                                        size={FnGetCssVariable('--image-size-1')}
                                        fill='none'
                                        strokeWidth={1} />,
                                    type: "svg",
                                    w: 'var(--node_height)',
                                    h: 'var(--node_height)',
                                    tooltip: "Close notification",
                                }
                                } w='var(--node_height)' actionCode={'close'} handleMouse={(event: any, actionCode?: string, payload?: any) => {
                                    if (statusBarCardProps.handleCloseClick) {
                                        statusBarCardProps.handleCloseClick(statusBarCardProps.id)
                                    }
                                }} />
                        </div></div>
                </div>

            </div>
            {content && <div className="nz-card-content">
                {statusBarCardProps.severity !== "Normal" && <Image {...imageProps} />}
                <div className='nz-d-flex'>

                    {content}
                </div>
            </div>}
        </div>
    )
}
export { StatusBarCard }