import { useEffect, useState } from 'react';
import { TextareaControl, EditTextControl } from '@n20a/libform';

import type { IRequestShape } from '../requestdevicemodels/RequestDeviceModels';

export function RequestShapeForm(props: IRequestShape) {
 console.log('RequestShapeForm data:', props.formData); 
  const [requestFormData, setRequestFormData] = useState<IRequestShape>(props);

  useEffect(() => {
    setRequestFormData(props);
  }, [props.formData?.searchText, props.formData?.mfg, props.formData?.EqType, props.formData?.ProdNo, props.formData?.MoreInfo]);

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
          value={requestFormData.formData.mfg}
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
        <button type="button" className="request-shape-form__save-btn" onClick={() => props.onSearchClick(JSON.stringify(requestFormData))} style={{ backgroundColor: '#ffff99', color: '#333333' }}>
          Submit Request
        </button>
      </div>
    </section>
  );
}
