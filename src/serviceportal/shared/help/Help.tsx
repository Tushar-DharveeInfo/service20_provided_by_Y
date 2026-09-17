
import { prepareToc } from '@n20a/libflippdf'
import './Help.css'
import { handleContainerKeyDown } from "../allcommon/basic/FnHandleContainerKeyDown.ts";
import { RenderPdf } from './RenderPdf.tsx';

import MarkdownIt from 'markdown-it';
import parse from 'html-react-parser';
import { useEffect, useState } from 'react';
import { ActionImage } from '../basic/actionimage/ActionImage.tsx';
import { Close24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../allcommon/FnGetCssVariable.ts';
import { Label } from '../basic/label/Label.tsx';
import { PdfDownloadOverlay } from './pdfviewer/PdfDownloadOverlay.tsx';

interface IHelp {
    uniqueName: string;
    pdfUrl?: string;      // "/privatehelp/docs-service.pdf" 
    featureName?: string;
    featureId?: string;
    mdString?: string;  // markdown string to render helptip
    helpTitle?: string;
    isGroupSelected?: boolean;  // for settings and entities page
    selectedGroup?: string;     // for settings and entities page
    headerText?: string;        // for settings and entities page
    hideCloseBtn?: boolean;
    hideDownloadIcon?: boolean;
    handleShowUserMessage?: (messageText: string, container?: HTMLDivElement) => void;
}

const md = new MarkdownIt({ html: false });

function formatMarkdownToHTML(text: string) {
    return parse(md.render(text));
}
const Helptip = (helpProps: IHelp) => {
    const [isHelptipVisible, setIsHelptipVisible] = useState(true);

    if (!isHelptipVisible || !helpProps.mdString) {
        return null;
    }

    return (
        <div className='nz-feature-helptip-container'>
            <div className='nz-feature-helptip-content'>
                <div className='nz-feature-helptip-close'>
                    {!helpProps.hideCloseBtn && <ActionImage
                        image={{
                            uniqueName: "cancel",
                            source: <Close24x24
                                size={18}
                                fill='none'
                                stroke={FnGetCssVariable('--textprimary') || '#333333'}
                                strokeWidth={2} />,
                            type: "svg",
                            w: "var(--image-size-2)",
                            h: "var(--image-size-2)",
                        }}
                        uniqueName='cancelIcon'
                        actionCode='cancel'
                        w="var(--image-size-2)"
                        tooltip="Hide Helptip"
                        handleMouse={() => {
                            setIsHelptipVisible(false)
                        }}
                    />}
                </div>
                <div className='nz-feature-helptip-body'>
                    {formatMarkdownToHTML(helpProps.mdString ?? '')}
                </div>
            </div>
        </div>
    )
}

const Help = (helpProps: IHelp) => {
    const [displayFeatureName, setDisplayFeatureName] = useState<string>("Help")
    const localPdfUrl = helpProps.pdfUrl ?? "/privatehelp/docs-service.pdf";

    useEffect(() => {
        if (helpProps.featureName) {
            setDisplayFeatureName(helpProps.featureName)
        }
        else if (helpProps.helpTitle) {
            setDisplayFeatureName(prepareToc(helpProps.helpTitle))
        }
        else {
            setDisplayFeatureName("Help")
        }
    }, [helpProps.featureName, helpProps.helpTitle])

    // useEffect(() => {
    //     if (import.meta.env.DEV)
    //         // console.log('displayFeatureName :', displayFeatureName);
    // }, [displayFeatureName])

    const helpDownloadUrl = localPdfUrl;
    const helpDownloadFileName = helpDownloadUrl.split(/[\\/]/).pop() ?? 'help.pdf';

    const helpContent = (
        <RenderPdf
            bucketName="n20-bucket-01"
            baseFolder="sm"
            fileName="/help/docs-service.pdf"
            documentTitle={helpProps.helpTitle?.length ? helpProps.helpTitle : "NetZoom Documentation"}
            tocWidthPercent={20}
            initialTocItem={helpProps.selectedGroup?.length ? helpProps.selectedGroup : displayFeatureName}
        />
    );

    const contentClassName = helpProps.selectedGroup?.length
        ? "nz-setting-page-md"
        : "nz-appqa-help-content";

    return (
        <div
            className={helpProps.headerText ? `nz-help-container ${contentClassName}` : contentClassName}
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
        >
            {helpProps.headerText && (
                <div className='nz-help-header'>
                    {!helpProps.hideDownloadIcon ? (
                        <PdfDownloadOverlay
                            uniqueName={`${helpProps.uniqueName}-help-download`}
                            headerText={helpProps.headerText}
                            pdfUrl={helpDownloadUrl}
                            downloadFileName={helpDownloadFileName} />
                    ) : (
                        <div className='nz-sub-header'>
                            <Label
                                uniqueName={`${helpProps.uniqueName}-header`}
                                label={helpProps.headerText}
                                fontWeight='bold'
                            />
                        </div>
                    )}
                </div>
            )}
            <div className='nz-help-body'>
                {helpContent}
            </div>
        </div>
    )
}


export { Help, type IHelp, Helptip }
export default Help
