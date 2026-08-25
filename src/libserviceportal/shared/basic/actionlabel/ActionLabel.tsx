
import React from 'react'
import { Check, Cross } from '@n20a/libicon';
import '../../allcss/basic/ActionLabel.css';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable.ts';
import { IActionLabel } from '../../allinterface/basic/IActionLabel.ts'
import { DefaultStylesActionLabel } from '../../alldefaultprops/basic/DefaultPropsActionLabel.ts';
import { Label } from '../label/Label.tsx'
import { Image } from '../image/Image.tsx';

const ActionLabel = (actionLabelProps: IActionLabel) => {
    const labelProps = actionLabelProps.label;
    const dynamicStyleContainer: React.CSSProperties = {
        width: (typeof actionLabelProps.w === "string" ? actionLabelProps.w : `${actionLabelProps.w}px`) || DefaultStylesActionLabel.Width,
        height: (typeof actionLabelProps.h === "string" ? actionLabelProps.h : `${actionLabelProps.h}px`) || DefaultStylesActionLabel.Height,
        lineHeight: (typeof actionLabelProps.h === "string" ? actionLabelProps.h : `${actionLabelProps.h}px`) || DefaultStylesActionLabel.Height,
        minHeight: (typeof actionLabelProps.h === "string" ? actionLabelProps.h : `${actionLabelProps.h}px`) || DefaultStylesActionLabel.Height,
        border: actionLabelProps.border || DefaultStylesActionLabel.Border,
        cursor: "pointer",
        justifyContent: actionLabelProps.allowIcon ? actionLabelProps.showIconLast ? "space-between" : "flex-start" : (actionLabelProps.align as React.CSSProperties['justifyContent']) || DefaultStylesActionLabel.Align,
        flexDirection: actionLabelProps.allowIcon ? actionLabelProps.showIconLast ? "row" : "row-reverse" : "row",
    };
    return (
        <div key={actionLabelProps.uniqueName} className={`nz-action-label-container${actionLabelProps.selected ? " nz-selected" : ""}`} style={dynamicStyleContainer}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => { actionLabelProps.handleMouse(event, actionLabelProps.actionCode) }} tabIndex={-1}>
            <Label {...labelProps} />
            {actionLabelProps.allowIcon && <Image
                uniqueName={`${actionLabelProps.uniqueName}-image`}
                source={actionLabelProps.iconSource ? actionLabelProps.iconSource : actionLabelProps.isSuccess ? <Check
                    size={FnGetCssVariable('--image-size-1')} /> : <Cross
                    size={FnGetCssVariable('--image-size-1')}
                    fill='red' />}
                w={'var(--image-size-1)'}
                h={'var(--image-size-1)'}
                tooltip={actionLabelProps.imageTooltip || ""}
                type='svg' />}
        </div>
    )
}

export { ActionLabel }