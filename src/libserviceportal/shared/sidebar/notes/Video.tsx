

import { Close24x24 } from "@n20a/libicon"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import { IImage } from "../../allinterface/basic/IImage"
import { IVideo } from "../../allinterface/sidebar/IVideo"
import { ActionImage } from "../../basic/actionimage/ActionImage"
import { Label } from "../../basic/label/Label"
import { Notes } from "@n20a/libavnotes"

const Video = (props: IVideo) => {
    const deleteImage: IImage = {
        uniqueName: `close-icon`,
        source: <Close24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to close"
    }


    return (
        <div className="nz-video-container">
            <div className="nz-sub-header">
                <Label uniqueName='video-header' label={`Video`} fontWeight="bold" />
                <ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
                    uniqueName={`deleteicon`}
                    actionCode={'delete'}
                    disabled={false}
                    handleMouse={() => props.handleClose()} />
            </div>
            <div className="nz-selected-video-view-container">
                {props.noteProps && <Notes {...props.noteProps} sendNote={props.sendNotes} ReadOnly={true} />}
            </div>
        </div>
    )
}
export { Video }
