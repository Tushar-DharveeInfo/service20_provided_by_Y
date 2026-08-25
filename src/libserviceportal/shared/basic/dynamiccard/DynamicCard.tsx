
import { IDynamicCard } from '../../allinterface/basic/IDynamicCard';
import { Cross, Edit24x24 } from "@n20a/libicon";
import '../../allcss/basic/DynamicCard.css'
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IActionImageForSubMenu } from "../../allinterface/basic/IActionImageList";
import { NodeMenu } from "../../menu/nodemenu/NodeMenu";
import { Image } from "../image/Image";
import { ActionImage } from "../actionimage/ActionImage";

const DynamicCard = (dynamiccardprops: IDynamicCard) => {

    const hasAction = !!(dynamiccardprops.allowEditButton || dynamiccardprops.allowDeleteButton)
    return (
        <div
            className={`nz-dynamic-card ${dynamiccardprops.className} ${dynamiccardprops.isSelected ? "nz-dynamic-selected-card" : ""}`}
            onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
                const target = event.target as HTMLElement;
                if (!target.closest(".nz-dynamic-card")) {
                    return;
                }

                event.preventDefault();
                if (dynamiccardprops.onClick) {
                    dynamiccardprops.onClick(event, dynamiccardprops.data);
                }
                dynamiccardprops.handleMouseForEdit && dynamiccardprops.handleMouseForEdit(dynamiccardprops.data)
            }}
            key={dynamiccardprops.uniqueName}
            tabIndex={1}
            role={dynamiccardprops.role}
            aria-selected={dynamiccardprops.ariaSelected}
            onKeyDown={dynamiccardprops.onKeyDown}
        >
            {!dynamiccardprops.hideRightMouseMenu &&
                <div className="nz-dynamic-card-node-menu" style={{ width: 20 }}>
                    <NodeMenu
                        uniqueName='basic-grid'
                        container={'reminder_grid'}
                        featureId={dynamiccardprops.featureId}
                        selectedRow={dynamiccardprops.data as Record<string, any>}
                        handleSelect={(value: IActionImageForSubMenu) => {
                            dynamiccardprops.handleNodeMenuOnClick && dynamiccardprops.handleNodeMenuOnClick(value, dynamiccardprops.data, dynamiccardprops.containerName || "dynamicCard-nodemenu")
                        }}
                        showIcon={true}
                        featureData={dynamiccardprops?.featureData || []}
                        allowAddCopyIconInOverlay={false}
                    />
                </div>
            }
            <div className="nz-dynamic-card-content">
                {dynamiccardprops.ContentImage &&
                    <div className="nz-dynamic-card-icon">
                        <Image {...dynamiccardprops.ContentImage} />
                    </div>
                }
                <div className="nz-dynamic-card-main-content">{dynamiccardprops.Content}</div>
            </div>
            {hasAction && <div className="nz-dynamic-card-action">
                <div style={{ display: 'flex', width: '40px' }}>
                    {dynamiccardprops.allowEditButton &&
                        <ActionImage
                            image={{
                                uniqueName: "edit",
                                source: <Edit24x24
                                    size={FnGetCssVariable('--image-size-2')}
                                    fill='none'
                                    strokeWidth={1} />,
                                type: "svg",
                                w: "var(--image-size-2)",
                                h: "var(--image-size-2)",
                                tooltip: "Click to edit"
                            }}
                            w='var(--node_height)'
                            uniqueName='editicon'
                            actionCode='edit click'
                            disabled={dynamiccardprops.isEditDisabled}
                            h='var(--node_height)'
                            handleMouse={(event) => {
                                event.preventDefault();
                                if (dynamiccardprops.handleMouseForEdit) { dynamiccardprops.handleMouseForEdit(dynamiccardprops.data) }
                            }}
                        />}
                    {
                        dynamiccardprops.allowDeleteButton &&
                        <ActionImage
                            image={{
                                uniqueName: "cancel",
                                source: <Cross
                                    size={FnGetCssVariable('--image-size-2')}
                                    fill='red' />,
                                type: "svg",
                                w: "var(--image-size-2)",
                                h: "var(--image-size-2)",
                                tooltip: "Click to Delete"
                            }}
                            w='var(--node_height)'
                            actionCode='delete click'
                            uniqueName='deleteicon'
                            disabled={dynamiccardprops.isDeleteDisabled}
                            h='var(--node_height)'
                            handleMouse={() => {
                                if (dynamiccardprops.handleMouseForDelete) { dynamiccardprops.handleMouseForDelete(dynamiccardprops.data) }
                            }}
                        />
                    }
                </div>
            </div>}
        </div >
    );
};

export default DynamicCard;