
import { useState } from 'react';
import '../../allcss/basic/Image.css';
import { DefaultStylesImage } from '../../alldefaultprops/basic/DefaultPropsImage.ts';
import { FnCheckImageSourceType } from '../../allcommon/basic/FnCheckImageSourceType.ts';
import { FnCreateDisplayUri } from '../../allcommon/basic/FnCreateDisplayUri.ts';
import { IImage } from '../../allinterface/basic/IImage.ts';

const Image = (imageProps: IImage) => {
    const [errorHandled, setErrorHandled] = useState(false);
    const dynamicStyleImage = {
        width: imageProps.w || DefaultStylesImage.Width,
        height: imageProps.h || imageProps.w,
        minWidth: imageProps.w || DefaultStylesImage.Width,
        minHeight: imageProps.h || imageProps.w,
        maxWidth: 'unset',
        maxHeight: 'unset'
    };
    const imageType = imageProps.type ? imageProps.type : "svg";
    //check image source type 
    const sourceType = typeof imageProps.source === "string" ? FnCheckImageSourceType(imageProps.source) : "jsx";
    const encryptedUri = sourceType === "encrypted" && typeof imageProps.source === "string" ? FnCreateDisplayUri(imageProps.source, imageProps.type) : null;
    return (
        <div key={imageProps.uniqueName} className='nz-image-container' draggable={false} title={imageProps.tooltip} style={dynamicStyleImage}>
            {/* render png/encrypted file */}
            {sourceType === "jsx" ? <>{imageProps.source}</> : (((imageType === "png" || imageType === 'svg') && sourceType === "uri") || (sourceType === "encrypted" && encryptedUri))
                && <img draggable={false} className='nz-feature-icon' style={dynamicStyleImage} src={encryptedUri ? encryptedUri : imageProps.source as string} alt={imageProps.altSource}
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        if (!errorHandled) {
                            const target = e.currentTarget;
                            target.onerror = null; // Prevent infinite loop if the fallback image also fails
                            target.src = imageProps.altSource ? imageProps.altSource : ""; // Set your alternative image path
                            setErrorHandled(true);
                        }

                    }}
                />}


            {/* show svg content as html */}
            {imageType === "svg" && sourceType === "svg"
                && <div draggable={false} className="nz-feature-icon" style={dynamicStyleImage}
                    dangerouslySetInnerHTML={{ __html: typeof imageProps.source === "string" ? imageProps.source : "" }}></div>}
        </div>
    )
}

export { Image }