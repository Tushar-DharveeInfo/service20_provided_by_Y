
import { Close24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IAudio } from "../../allinterface/sidebar/IAudio";
import { IImage } from "../../allinterface/basic/IImage";
import { ActionImage } from "../../basic/actionimage/ActionImage"
import { Label } from "../../basic/label/Label"
import { Notes } from "@n20a/libavnotes";

const Audio = (props: IAudio) => {
    const deleteImage: IImage = {
        uniqueName: `close-icon`,
        source: <Close24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        type: "svg",
        w: 'var(--image-size-2)',
        tooltip: "Click to close"
    }

    return (
        <div className="nz-audio-container">
            <div className="nz-sub-header">
                <Label uniqueName='Audio-header' label={`Audio`} fontWeight="bold" />
                <ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
                    uniqueName={`deleteicon`}
                    actionCode={'delete'}
                    disabled={false}

                    handleMouse={() => props.handleClose()} />
            </div>
            <div className="nz-selected-audio-view-container">
                {props.noteProps && <Notes {...props.noteProps} ReadOnly={true} />}
            </div>
        </div>
    )
}

export { Audio }