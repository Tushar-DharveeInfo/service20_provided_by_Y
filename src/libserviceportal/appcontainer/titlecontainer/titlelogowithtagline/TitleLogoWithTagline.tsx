

import { Image } from "../../../shared/basic/image/Image";
import { Label } from "../../../shared/basic/label/Label";

interface ITitleLogoWithTagline {
    uniqueName: string;
    logoImageSource: string;
    logoFallbackSrc: string;
    logoImageTooltip?: string;
    redirectUrl?: string;
    tagLineContent?: string;
}

const TitleLogoWithTagline: React.FC<ITitleLogoWithTagline> = (titleLogoWithTaglineProps) => (
    <>
        <div style={{ cursor: "pointer" }} onClick={() => {
            if (titleLogoWithTaglineProps.redirectUrl) {

                window.open(titleLogoWithTaglineProps.redirectUrl, '_blank', 'noopener,noreferrer')
            }
        }}>
            <Image
                uniqueName={'testlogo'}
                source={titleLogoWithTaglineProps.logoImageSource}
                w={'auto'}
                h={'40px'}
                type="png"
                tooltip={titleLogoWithTaglineProps.logoImageTooltip}
                altSource={titleLogoWithTaglineProps.logoFallbackSrc}
            />
        </div>
        {titleLogoWithTaglineProps.tagLineContent ?
            <Label
                uniqueName={titleLogoWithTaglineProps.uniqueName + 'main-title'}
                label={titleLogoWithTaglineProps.tagLineContent}
                fontSize={'26px'}
                fontWeight="bold"
            />
            :
            <></>
        }
    </>
);

export { TitleLogoWithTagline }
