import { useEffect, useMemo, useState } from 'react';
import { Splitter } from 'primereact/splitter';
import { ServicesEnums } from '../../../constants/Feature';

import { Helptip } from '../../appqa/help/Help';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { type IRequestShape } from '../requestdevicemodels/RequestDeviceModels';

import { RequestShapeForm } from './RequestShapeForm';

import { AiMcpAiMcpRequestShapeClient } from '@n20a/libmcpclient';
import '@n20a/libmcpclient/style.css';

const DEFAULT_HELP_TIP =
    'Use the **Device Model** pane to browse and search the NetZoom device library for Visio stencil shapes. Request and Download panes will support stencil request workflows.';

const RequestShapeFormContainer = (props: IRequestShape) => {
    const [requestformData, setRequestFormData] = useState<IRequestShape | null>(props);
    useEffect(() => {
        setRequestFormData(props);
    }, [props.formData]);

    const uniqueName = 'request-visio-stencils';
    const featureId = props.featureId ?? ServicesEnums.RequestVisioStencils;
    const showHelptip = props.isShowHelptip !== false;
    const { onBack } = props;
    const helpTipsContext = useHelpTipContext();

    const helpTipText = useMemo(() => {
        if (props.helpTipText) {
            return props.helpTipText;
        }
        const tip = helpTipsContext.helpTipRecords?.find((item) =>
            item.featureid.startsWith(`${featureId}_`)
        );
        return tip?.tip ?? DEFAULT_HELP_TIP;
    }, [props.helpTipText, helpTipsContext.helpTipRecords, featureId]);

    return (
        <div className="nz-request-visio-stencils nz-wh-100 nz-d-flex-column" id={uniqueName}>
            {showHelptip && (
                <div className="nz-request-visio-helptip-div">
                    <Helptip
                        uniqueName={`${uniqueName}-helptip`}
                        mdString={helpTipText}
                    />
                </div>
            )}
            <div className="nz-request-visio-panes">
                <Splitter
                    tabIndex={-1}
                    className="nz-w-100 nz-h-100 nz-feature-container-splitter"
                    layout="horizontal"
                >
                    <div
                        tabIndex={-1}
                        style={{ flex: '0 0 40%', minHeight: '20%' }}
                        className="nz-d-flex-column nz-pane-1 nz-request-visio-pane"
                    >
                        <RequestShapeForm
                            {...props}
                        />
                    </div>

                    <div
                        tabIndex={-1}
                        style={{ flex: '1 1 auto', minHeight: '20%' }}
                        className="nz-d-flex-column nz-pane-2 nz-request-visio-pane"
                    >
                        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <AiMcpAiMcpRequestShapeClient
                                    searchText={requestformData?.formData.searchText ?? ''}
                                    Mfg={requestformData?.formData.mfg ?? 'DELL'}
                                    ProdNo={requestformData?.formData.ProdNo ?? '380'}
                                    EqType={requestformData?.formData.EqType ?? ''}
                                    MoreInfo={requestformData?.formData.MoreInfo ?? ''}
                                />
                            </div>
                        </div>
                    </div>
                </Splitter>
            </div>
            {onBack && (
                <div className="request-button-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', marginTop: 'auto', gap: '6px' }}>
                    <button className="request-back-btn" onClick={onBack} style={{ height: '24px', lineHeight: '1', padding: '0 8px' }}>← Back</button>
                </div>
            )}
        </div>
    );
};

// ---------- RequestShapePage ----------

function RequestShapePage() {
    const [lastSaved, setLastSaved] = useState<IRequestShape | null>(null);
    const prettyJson = useMemo(() => (lastSaved ? JSON.stringify(lastSaved, null, 2) : ''), [lastSaved]);

    const handleSave = (searchText?: string, AndOr?: "AND" | "OR", mfg?: string, eqtype?: string, pno?: string) => {
        const formdata: IRequestShape = {
            formData: {
                searchText: searchText ?? '',
                AndOr: AndOr ?? "AND",
                Mfg: mfg ?? '',
                EqType: eqtype ?? '',
                ProdNo: pno ?? '',
                MoreInfo: ''
            },
            onSearchClick: handleSave
        };
        console.log('RequestShapeForm save:', formdata);
        setLastSaved(formdata);
    };


    return (
        <div className="spa-page spa-page--scroll">
            <RequestShapeForm
                formData={{
                    searchText: lastSaved?.formData.searchText ?? '',
                    AndOr: lastSaved?.formData.AndOr ?? "AND",
                    Mfg: lastSaved?.formData?.mfg ?? '',
                    EqType: lastSaved?.formData.EqType ?? '',
                    ProdNo: lastSaved?.formData.ProdNo ?? '',
                    MoreInfo: lastSaved?.formData.MoreInfo ?? ''
                }}
                onSearchClick={handleSave}
            />
            {lastSaved ? (
                <section className="spa-diagnostics" style={{ marginTop: '12px' }}>
                    <div className="spa-diagnostics__header">
                        <span>Last Saved Request Shape</span>
                    </div>
                    <pre className="test-json-modal__viewer" style={{ maxHeight: '220px' }}>{prettyJson}</pre>
                </section>
            ) : null}
        </div>
    );
}


export { RequestShapeFormContainer, RequestShapePage };
export default RequestShapeFormContainer;
