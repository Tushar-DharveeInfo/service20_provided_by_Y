import { useEffect, useRef, useState } from 'react'
import '../../allcss/basic/ActionLabelStrip.css';
import { DefaultStylesActionLabelStrip } from '../../alldefaultprops/basic/DefaultPropsActionLabelStrip.ts';
import { IActionLabelStrip } from '../../allinterface/basic/IActionLabelStrip.ts';
import { IActionLabel } from '../../allinterface/basic/IActionLabel.ts';
import { ActionLabel } from '../actionlabel/ActionLabel.tsx';

const ActionLabelStrip = (actionLabelStripProps: IActionLabelStrip) => {
    const initialIndex = (() => {
        if (actionLabelStripProps.actionLabels) {
            if (actionLabelStripProps.isAddMode) {
                return -1; // no selection in add mode
            } else {
                const preSelectedIndex = actionLabelStripProps.actionLabels.findIndex((a) => a.selected);
                return preSelectedIndex >= 0 ? preSelectedIndex : 0;
            }
        }
        return -1;
    })();

    const [actionLabels, setActionLabels] = useState<IActionLabel[]>(actionLabelStripProps.actionLabels ?? []);
    const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

    const containerRef = useRef<HTMLDivElement | null>(null);

    const dynamicStyle = {
        width: (typeof actionLabelStripProps.w === "string" ? actionLabelStripProps.w : `${actionLabelStripProps.w}px`) || DefaultStylesActionLabelStrip.Width,
        height: (typeof actionLabelStripProps.h === "string" ? actionLabelStripProps.h : `${actionLabelStripProps.h}px`) || DefaultStylesActionLabelStrip.Height,
        backgroundColor: actionLabelStripProps.bgColor ?? DefaultStylesActionLabelStrip.BGColor,
        border: actionLabelStripProps.border ?? DefaultStylesActionLabelStrip.Border,
        padding: actionLabelStripProps.spacing ?? "0px",
    };

    useEffect(() => {
        if (actionLabelStripProps.actionLabels) {
            setActionLabels(actionLabelStripProps.actionLabels);

            // when props change, recompute active index
            if (actionLabelStripProps.isAddMode) {
                setActiveIndex(-1);
            } else {
                const preSelectedIndex = actionLabelStripProps.actionLabels.findIndex((a) => a.selected);
                setActiveIndex(preSelectedIndex >= 0 ? preSelectedIndex : 0);
            }
        }
    }, [actionLabelStripProps]);

    const handleMouse = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, index?: number) => {
        if (index != null) {
            setActiveIndex(index);
        }
        actionLabelStripProps.handleMouse?.(event, actionCode);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!actionLabels.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => {
                const next = (prev + 1) % actionLabels.length;
                return next;
            });
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => {
                const next = (prev - 1 + actionLabels.length) % actionLabels.length;
                return next;
            });
        } else if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            if (activeIndex >= 0) {
                const actionCode = actionLabels[activeIndex]?.actionCode;
                handleMouse(event, actionCode, activeIndex);
            }
        }
    };

    const stripTabIndex = actionLabelStripProps.tabIndex ?? 1;

    return (
        <div
            ref={containerRef}
            key={actionLabelStripProps.uniqueName}
            onKeyDown={stripTabIndex >= 0 ? handleKeyDown : undefined}
            tabIndex={stripTabIndex}
            style={dynamicStyle}
            className={`nz-label-strip-container${actionLabelStripProps.isVertical ? " nz-strip-vertical" : ""}`}
        >
            {actionLabels.length > 0 &&
                actionLabels.map((actionLabelProps: IActionLabel, index: number) => (
                    <ActionLabel
                        key={index}
                        {...actionLabelProps}
                        tabIndex={-1}
                        selected={activeIndex === index && !actionLabelStripProps.isAddMode} // ✅ prevent highlight in add mode
                        handleMouse={(e, code) => handleMouse(e, code, index)}
                    />
                ))}
        </div>
    );
};

export { ActionLabelStrip };
