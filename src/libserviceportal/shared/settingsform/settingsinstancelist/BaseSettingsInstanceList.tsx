
import React from 'react'
import { Cross, Edit24x24, Plus, Preflight24x24, TestAPI24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable.ts';
import { IImage } from '../../allinterface/basic/IImage.ts';
import { IActionLabel } from '../../allinterface/basic/IActionLabel.ts';
import { IActionLabelStrip } from '../../allinterface/basic/IActionLabelStrip.ts';
import { ActionLabelStrip } from '../../basic/actionlabelstrip/ActionLabelStrip.tsx';
import { ActionImage } from '../../basic/actionimage/ActionImage.tsx';

interface IBaseSettingsInstanceList {
    uniqueName: string; // A unique name used for generating unique keys and identifiers
    actionLabels: IActionLabel[]; // Array of action labels with associated actions
    isAddMode: boolean;
    allowAdd: boolean; // Optional flag to show the Add button
    showEditButton: boolean; // Optional flag to show the Edit button
    allowDelete: boolean; // Optional flag to show the Delete button
    allowTestApi: boolean; // to allow test api icon for NetZoom Api
    allowPreflight: boolean; // to allow test all api call for NetZoom Api
    disableAdd: boolean; // to disable action image 
    disableEdit: boolean; // to disable action image 
    disableDelete: boolean; // to disable action image 
    disableTestApi: boolean; // to disable action image
    recordLabel?: string;
    handleSelectListItem: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void; // Callback function for handling label strip actions
    handleMouseClick: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void; // Callback function for handling add, edit, and delete actions
}

const BaseSettingsInstanceList = (baseSettingsInstanceListProps: IBaseSettingsInstanceList) => {
    // --- Images ---
    const addImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-iadd`,
        source: <Plus
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        type: "svg",
        w: 'var(--image-size-2)',
        tooltip: "Click to Add"
    }
    const editImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-iedit`,
        source: <Edit24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Edit"
    }
    const deleteImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-idelete`,
        source: <Cross
            size={FnGetCssVariable('--image-size-2')}
            fill='red' />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Delete"
    }
    const testApiImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-itestapi`,
        source: <TestAPI24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Test selected API"
    }
    const preflightImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-ipreflight`,
        source: <Preflight24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Preflight all"
    }

    const actionLabelStrip: IActionLabelStrip = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-als`,
        actionLabels: baseSettingsInstanceListProps.actionLabels,
        h: '100%',
        border: 'none',
        isVertical: true,
        // bgColor: 'var(--bgexplorer)',
        handleMouse: baseSettingsInstanceListProps.handleSelectListItem,
        w: '100%',
        tabIndex: -1,
    }

    const actions: { allow: boolean; image: IImage; code: string; disabled?: boolean }[] = [
        { allow: baseSettingsInstanceListProps.allowAdd, image: addImage, code: 'add', disabled: baseSettingsInstanceListProps.disableAdd },
        { allow: baseSettingsInstanceListProps.showEditButton, image: editImage, code: 'edit', disabled: baseSettingsInstanceListProps.disableEdit },
        { allow: baseSettingsInstanceListProps.allowDelete, image: deleteImage, code: 'delete', disabled: baseSettingsInstanceListProps.disableDelete },
        { allow: baseSettingsInstanceListProps.allowTestApi, image: testApiImage, code: 'testapi', disabled: baseSettingsInstanceListProps.disableTestApi },
        { allow: baseSettingsInstanceListProps.allowPreflight, image: preflightImage, code: 'preflightall', disabled: false },
    ];

    return (
        <>
            <div className='nz-list-data'>
                <ActionLabelStrip {...actionLabelStrip} isAddMode={baseSettingsInstanceListProps.isAddMode} />
            </div>

            {actions.some(a => a.allow) && (
                <div className='nz-action-panel'>
                    <div className='nz-action-panel-actions'>
                        {actions.map((a, index) =>
                            a.allow && (
                                <div
                                    key={a.code}
                                    tabIndex={-1}
                                    data-action-code={a.code}
                                    style={{ display: "inline-block" }}
                                >
                                    <ActionImage
                                        image={a.image}
                                        w={'var(--node_height)'}
                                        h={'var(--node_height)'}
                                        uniqueName={`${baseSettingsInstanceListProps.uniqueName}-ai${a.code}`}
                                        actionCode={a.code}
                                        disabled={a.disabled}
                                        handleMouse={baseSettingsInstanceListProps.handleMouseClick}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    {baseSettingsInstanceListProps.recordLabel ? <div className='nz-action-panel-count'>
                        {baseSettingsInstanceListProps.recordLabel}
                    </div> : <></>}
                </div>
            )}
        </>
    )
}

export { BaseSettingsInstanceList };
export type { IBaseSettingsInstanceList };
