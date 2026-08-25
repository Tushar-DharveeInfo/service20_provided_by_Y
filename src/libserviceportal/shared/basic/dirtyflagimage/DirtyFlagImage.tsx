
import React from 'react';
import '../../allcss/basic/DirtyFlagImage.css';
import { DefaultPropsDirtyFlagImage } from '../../alldefaultprops/basic/DefaultPropsDirtyFlagImage.ts';
import { IDirtyFlagImage } from '../../allinterface/basic/IDirtyFlagImage.ts';
import { Image } from '../image/Image.tsx';

const DirtyFlagImage = (dirtyFlagImageProps: IDirtyFlagImage) => {
    const imageProps = dirtyFlagImageProps.image;
    const dynamicStyleContainer = {
        width: (typeof dirtyFlagImageProps.w === "string" ? dirtyFlagImageProps.w : `${dirtyFlagImageProps.w}px`) || DefaultPropsDirtyFlagImage.Width,
        height: (typeof dirtyFlagImageProps.h === "string" ? dirtyFlagImageProps.h : `${dirtyFlagImageProps.h}px`) || DefaultPropsDirtyFlagImage.Height,
        border: dirtyFlagImageProps.allowBorder ? DefaultPropsDirtyFlagImage.Border : "none",
        cursor: dirtyFlagImageProps.handleMouse ? dirtyFlagImageProps.disabled ? "not-allowed" : "pointer" : DefaultPropsDirtyFlagImage.Cursor,
        PointerEvent: dirtyFlagImageProps.isDirty ? "auto" : "none",
        background: dirtyFlagImageProps.isDirty ? dirtyFlagImageProps.bgColor : undefined,
        opacity: dirtyFlagImageProps.disabled ? 0.3 : 1
    }
    return (
        <div style={dynamicStyleContainer} className={`nz-dirtyFlag-image-container ${dirtyFlagImageProps.isDirty ? 'nz-is-dirty' : ''} `}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                if (dirtyFlagImageProps.handleMouse) {
                    dirtyFlagImageProps.handleMouse(event);
                }
            }} key={dirtyFlagImageProps.uniqueName}>
            <div className='nz-image-container' title={imageProps.tooltip}>
                <Image {...imageProps} />
            </div>
        </div>
    )
}

export { DirtyFlagImage }