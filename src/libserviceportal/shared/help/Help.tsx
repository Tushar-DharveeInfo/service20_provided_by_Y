
import { FlipPdf, prepareToc } from '@n20a/libflippdf'
import './Help.css'
import '@n20a/libflippdf/style.css'
import { useMainAppContext } from "../context/hooks/MainAppHooks.ts";
import { handleContainerKeyDown } from "../allcommon/basic/FnHandleContainerKeyDown.ts";
import { FnGetEnvVariableByKey } from "../../appcontainer/allcommon/FnGetEnvVariableByKey.ts";
import { envVarEnums } from "../../appcontainer/alldefaultprops/DefaultPropsAppContainer.ts";

import MarkdownIt from 'markdown-it';
import parse from 'html-react-parser';
import { useEffect, useMemo, useState } from 'react';
import { ActionImage } from '../basic/actionimage/ActionImage.tsx';
import { Close24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable.ts';
import { Label } from '../basic/label/Label.tsx';
import { OverlayTab } from '../basic/overlaytab/OverlayTab.tsx';
import { PdfDownloadOverlay } from './pdfviewer/PdfDownloadOverlay.tsx';

interface IHelp {
    uniqueName: string;
    pdfUrl?: string;      // "/privatedocs/docs.pdf" || "/privatedocs/api.pdf"
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
    const [isUserGuideAvailable, setIsUserGuideAvailable] = useState<boolean>(false);
    const [isUserGuideUrlValidated, setIsUserGuideUrlValidated] = useState<boolean>(false);
    const localPdfUrl = helpProps.pdfUrl ?? "/privatedocs/docs.pdf";
    const mainAppContext = useMainAppContext();
    const USER_GUIDE_URL = FnGetEnvVariableByKey(envVarEnums.USER_GUIDE_URL);

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

    useEffect(() => {
        if (import.meta.env.DEV)
            console.log('displayFeatureName :', displayFeatureName);
    }, [displayFeatureName])

    useEffect(() => {
        const validateUserGuideUrl = async () => {
            setIsUserGuideUrlValidated(false);

            if (
                !mainAppContext.isInternetAvailable ||
                !USER_GUIDE_URL?.trim()
            ) {
                setIsUserGuideAvailable(false);
                setIsUserGuideUrlValidated(true);
                return;
            }

            try {
                const response = await fetch(USER_GUIDE_URL, { method: "HEAD" });
                const isReachable = response.ok;

                setIsUserGuideAvailable(isReachable);
                setIsUserGuideUrlValidated(true);

                if (!isReachable) {
                    console.error(
                        "Remote Help Documentation is not available.",
                        response.statusText
                    );
                }

            } catch (error) {

                console.error(
                    "Failed to validate User Guide URL.",
                    error
                );

                setIsUserGuideAvailable(false);
                setIsUserGuideUrlValidated(true);

                helpProps.handleShowUserMessage?.(
                    `Remote Help Documentation is not available!\n\n${USER_GUIDE_URL}`
                );
            }
        };

        void validateUserGuideUrl();

    }, [
        USER_GUIDE_URL,
        mainAppContext.isInternetAvailable
    ]);

    const useRemoteUserGuide =
        mainAppContext.isInternetAvailable &&
        isUserGuideAvailable &&
        !!USER_GUIDE_URL?.trim();

    const helpDocumentSource = useMemo(() => {
        if (!isUserGuideUrlValidated) {
            return {
                label: 'Loading...',
                tooltip: 'Validating remote help documentation availability.',
            };
        }

        if (!useRemoteUserGuide) {
            return {
                label: 'Local',
                tooltip: `Help is loaded from the local PDF (${localPdfUrl}).`,
            };
        }


    }, [
        isUserGuideUrlValidated,
        useRemoteUserGuide,
        USER_GUIDE_URL,
        localPdfUrl,
    ]);

    const helpDownloadUrl = useRemoteUserGuide && USER_GUIDE_URL ? USER_GUIDE_URL : localPdfUrl;
    const helpDownloadFileName = helpDownloadUrl.split(/[\\/]/).pop() ?? 'help.pdf';

    const helpContent = useRemoteUserGuide && USER_GUIDE_URL ? (
        <iframe
            src={USER_GUIDE_URL}
            title={helpProps.helpTitle?.length ? helpProps.helpTitle : "User Guide"}
            style={{
                width: "100%",
                height: "100%",
                border: "none"
            }}
        />
    ) : (
        <FlipPdf
            documentTitle={
                helpProps.helpTitle?.length
                    ? helpProps.helpTitle
                    : "NetZoom Documentation"
            }
            pdfUrl={localPdfUrl}
            tocWidthPercent={20}
            initialTocItem={
                helpProps.selectedGroup?.length
                    ? helpProps.selectedGroup
                    : displayFeatureName
            }
            initialPageNumber={undefined}
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
                    {helpDocumentSource && <div className='nz-help-overlay-pane' title={helpDocumentSource.tooltip}>
                        <OverlayTab
                            uniqueName={`${helpProps.uniqueName}-help-source-overlay`}
                            tabs={[]}
                            selectedTabName=''
                            tabAlignment='horizontal'
                            headerText={helpDocumentSource.label}
                            hideDrager={true}
                        />
                    </div>}
                </div>
            )}
            <div className='nz-help-body'>
                {helpContent}
            </div>
        </div>
    )
}


export { type IHelp, Helptip }
export default Help
