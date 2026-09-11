import { useEffect, useState } from 'react';
import { TextareaControl, EditTextControl } from '@n20a/libform';

import type { IRequestShape } from '../requestdevicemodels/RequestDeviceModels';

export function RequestShapeForm(props: IRequestShape) {
  const [requestFormData, setRequestFormData] = useState<IRequestShape>(() => ({
    ...props,
    formData: {
      searchText: props.formData?.searchText ?? '',
      AndOr: props.formData?.AndOr ?? 'AND',
      Mfg: props.formData?.Mfg ?? (props.formData as any)?.mfg ?? '',
      EqType: props.formData?.EqType ?? '',
      ProdNo: props.formData?.ProdNo ?? '',
      MoreInfo: props.formData?.MoreInfo ?? ''
    }
  }));

  const mfgValue = props.formData?.Mfg ?? (props.formData as any)?.mfg;

  useEffect(() => {
    setRequestFormData({
      ...props,
      formData: {
        searchText: props.formData?.searchText ?? '',
        AndOr: props.formData?.AndOr ?? 'AND',
        Mfg: mfgValue ?? '',
        EqType: props.formData?.EqType ?? '',
        ProdNo: props.formData?.ProdNo ?? '',
        MoreInfo: props.formData?.MoreInfo ?? ''
      }
    });
  }, [props.formData?.searchText, props.formData?.AndOr, mfgValue, props.formData?.EqType, props.formData?.ProdNo, props.formData?.MoreInfo]);

  const updateField = (key: keyof IRequestShape['formData'], value: string) => {
    setRequestFormData((prev) => ({ ...prev, formData: { ...prev.formData, [key]: value } }));
  };

  return (
    <section className="request-shape-form" aria-label="Request Shape Form">
      <h2 className="request-shape-form__title">Request Shape Form</h2>
      <div className="request-shape-form__fields">
        <EditTextControl
          id="request-shape-search-hint"
          name="searchText"
          label="searchText"
          value={requestFormData.formData.searchText}
          placeholder="Enter search hint"
          onChange={(value) => updateField('searchText', value)}
        />
        <EditTextControl
          id="request-shape-mfg"
          name="Mfg"
          label="Mfg"
          value={requestFormData.formData.Mfg}
          placeholder="Enter manufacturer"
          onChange={(value) => updateField('Mfg', value)}
        />
        <EditTextControl
          id="request-shape-eqtype"
          name="EqType"
          label="EqType"
          value={requestFormData.formData.EqType}
          placeholder="Enter equipment type"
          onChange={(value) => updateField('EqType', value)}
        />
        <EditTextControl
          id="request-shape-prodno"
          name="ProdNo"
          label="ProdNo"
          value={requestFormData.formData.ProdNo}
          placeholder="Enter product number"
          onChange={(value) => updateField('ProdNo', value)}
        />
        <TextareaControl
          id="request-shape-more-info"
          name="MoreInfo"
          label="MoreInfo"
          value={requestFormData.formData.MoreInfo}
          rows={7}
          placeholder="Enter more information"
          onChange={(value) => updateField('MoreInfo', value)}
        />
      </div>
      <div className="request-shape-form__actions" style={{ marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="request-shape-form__save-btn"
          onClick={() => {
            if (props.onSubmitRequest) {
              props.onSubmitRequest(requestFormData.formData);
            } else {
              props.onSearchClick(JSON.stringify(requestFormData));
            }
          }}
          style={{ backgroundColor: '#ffff99', color: '#333333' }}
        >
          Submit Request
        </button>
      </div>
    </section>
  );
}
