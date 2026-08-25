
import { Close24x24 } from "@n20a/libicon"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import { IImage } from "../../allinterface/basic/IImage"
import { IInfoMessage } from "../../allinterface/sidebar/IInfoMessage"
import { ActionImage } from "../../basic/actionimage/ActionImage"
import { Label } from "../../basic/label/Label"

const InfoMessage = (props: IInfoMessage) => {
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
        <div className="nz-audio-container">
            <div className="nz-sub-header">
                <Label uniqueName='Audio-header' label={`Message`} fontWeight="bold" />
                <ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
                    uniqueName={`deleteicon`}
                    actionCode={'delete'}
                    disabled={false}
                    handleMouse={() => props.handleClose()} />
            </div>
            <div className="nz-info-message-full-view">
                <Label uniqueName='message' label={props.message} />
            </div>
        </div>
    )
}
export { InfoMessage }
