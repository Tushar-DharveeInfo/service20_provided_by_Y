
import { useState } from "react";
import { Modal, Box } from "@mui/material";
import { ActionImage } from "../../basic/actionimage/ActionImage";
import { Label } from "../../basic/label/Label";
import { Close24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IImage } from "../../allinterface/basic/IImage";
import { IUploadAudio } from "../../allinterface/sidebar/IUploadAudio";

const UploadAudio = (props: IUploadAudio) => {
    const [open, setOpen] = useState(true);
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

    function handleMouse(event: any, actionCode?: string | undefined): void {
        setOpen(false)
        props.handleClose()
    }

    return (
        <div>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        height: 400,
                        bgcolor: "white",
                        border: 'none',
                        boxShadow: 24,
                    }}
                >

                    <div className="nz-audio-container">
                        <div className="nz-sub-header">
                            <Label uniqueName='Audio-header' label={`Audio Upload`} fontWeight="bold" />
                            <ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
                                uniqueName={`deleteicon`}
                                actionCode={'delete'}
                                disabled={false}
                                handleMouse={handleMouse} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                            Audio is Selected
                        </div>
                    </div>

                </Box>
            </Modal>
        </div>
    );
};

export { UploadAudio };
