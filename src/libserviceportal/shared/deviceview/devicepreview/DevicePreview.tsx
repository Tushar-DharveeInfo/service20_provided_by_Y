
import React, { useState } from 'react'
import { TransformComponent, TransformWrapper, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import './DevicePreview.css'
import { IImage } from '../../allinterface/basic/IImage'
import { Image } from '../../basic/image/Image'
import { Label } from '../../basic/label/Label'

interface IDevicePreview {
    uniqueName: string; // uniqueName for the control and required
    image: IImage; // image data
    label: string; // display bottom label
    className?: string; // dynamic class name of preview device
    allowZoom?: boolean; // if passed true then allow zoom image else only display image zoom not works.
    handleMouse?: (event: React.MouseEvent, actionCode?: string) => void;
}

const DevicePreview = (props: IDevicePreview) => {
    const [panning, setPanning] = useState({
        disabled: true
    })

    const onZoomStartHandle = (element: ReactZoomPanPinchRef) => {
        if (element.state) {
            if (element.state.scale === 1 && element.state.positionY === 0 && element.state.positionX === 0) {
                setPanning({
                    disabled: true
                })
            } else {
                setPanning({
                    disabled: false
                })
            }
        }
    }

    return (
        <div className={`nz-devicePreview-div ${props.className ?? ''}`} key={props.uniqueName}>
            <TransformWrapper
                panning={panning}
                onZoomStart={(event: ReactZoomPanPinchRef) => onZoomStartHandle(event)}
                disabled={props.allowZoom}
            >
                <TransformComponent>
                    <Image {...props.image} />
                </TransformComponent>
            </TransformWrapper>
            <div className='nz-devicepreviw-label'>
                <Label uniqueName="devicePreView" label={props.label} />
            </div>
        </div>
    )
}

export { DevicePreview };
export type { IDevicePreview };
