
import React from 'react';
import '../../allcss/basic/ActionImage.css';
import { DefaultStylesActionImage } from '../../alldefaultprops/basic/DefaultPropsActionImage.ts';
import { IActionImage } from '../../allinterface/basic/IActionImage.ts';
import { Image } from '../image/Image.tsx';
import { Label } from '../label/Label.tsx';

const ActionImage = (actionImageProps: IActionImage) => {
    const imageProps = actionImageProps.image;
    const labelProps = actionImageProps.label || null;
    const dynamicStyleContainer = {
        width: (typeof actionImageProps.w === "string" ? actionImageProps.w : `${actionImageProps.w}px`) || DefaultStylesActionImage.Width,
        height: (typeof actionImageProps.h === "string" ? actionImageProps.h : `${actionImageProps.h}px`) || DefaultStylesActionImage.Height,
        border: actionImageProps.border ? actionImageProps.border : DefaultStylesActionImage.Border,
    }
    return (
        <div
            key={actionImageProps.uniqueName}
            // Tooltips live on image.tooltip in most callers; children have pointer-events:none
            // so the title must be on this container (the actual hover target).
            title={actionImageProps.tooltip ?? imageProps.tooltip ?? actionImageProps.labeltooltip}
            draggable={false}
            style={dynamicStyleContainer}
            className={`nz-action-image-container${actionImageProps?.labelAlign === "top" ? " flex-at" : ""}${actionImageProps.selected ? " nz-selected" : ""}${actionImageProps?.disabled ? " nz-disabled" : ""}`}

            onMouseEnter={(event: React.MouseEvent<HTMLDivElement>) => {
                actionImageProps.handleMouseEnter && actionImageProps.handleMouseEnter(event, actionImageProps.actionCode, actionImageProps.payload)
            }}
            onMouseLeave={(event: React.MouseEvent<HTMLDivElement>) => {
                actionImageProps.handleMouseLeave?.(event, actionImageProps.actionCode, actionImageProps.payload);
            }}
            onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
                if (actionImageProps.allowEventPropagation) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                if (actionImageProps.uniqueName !== "calender-icon") {
                    actionImageProps.handleMouse(
                        event,
                        actionImageProps.actionCode,
                        actionImageProps.payload
                    );
                }
            }}

            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                if (actionImageProps.allowEventPropagation) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                if (actionImageProps.uniqueName === "calender-icon") {
                    actionImageProps.handleMouse(
                        event,
                        actionImageProps.actionCode,
                        actionImageProps.payload
                    );
                }
            }}

            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                if (actionImageProps.allowEventPropagation) {
                    event.stopPropagation();
                }
                if (event.key === "Enter" || event.key === " ") {
                    actionImageProps.handleMouse(
                        event,
                        actionImageProps.actionCode,
                        actionImageProps.payload
                    );
                }
            }}
        >
            <Image {...imageProps} tooltip={undefined} />
            {labelProps?.label && <Label {...labelProps} />}
        </div>
    )
}

export { ActionImage }