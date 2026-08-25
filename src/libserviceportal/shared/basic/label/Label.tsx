
import '../../allcss/basic/Label.css';
import { DefaultStylesLabel } from '../../alldefaultprops/basic/DefaultPropsLabel.ts';
import { ILabel } from '../../allinterface/basic/ILabel.ts'

const Label = (labelProps: ILabel) => {
    const dynamicStyleLabel = {
        fontSize: labelProps.fontSize || DefaultStylesLabel.FontSize,
        fontStyle: labelProps.fontStyle || DefaultStylesLabel.FontStyle,
        fontWeight: labelProps.fontWeight || DefaultStylesLabel.FontWeight,
        color: labelProps.color || DefaultStylesLabel.Color
    }
    return (
        <div key={labelProps.uniqueName} className='nz-label-container' title={labelProps.tooltip} style={dynamicStyleLabel} >
            <span>{labelProps.label}</span>
        </div>
    )
}

export { Label }