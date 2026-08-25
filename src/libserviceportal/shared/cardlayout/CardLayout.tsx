
import { ReactNode, KeyboardEvent, MouseEvent } from "react";
import { IImage } from "../allinterface/basic/IImage";
import { IActionImageForSubMenu } from "../allinterface/basic/IActionImageList";
import React, { useMemo } from 'react';
import { YesNoControl } from '@n20a/libform';
import DynamicCard from '../basic/dynamiccard/DynamicCard';
import { Label } from '../basic/label/Label';

import { createCardKeyboardHandler, isCardKeyboardInteractiveTarget } from './CardLayoutKeyboard';
import './CardLayout.css';
import { IMenuItem } from "../allinterface/menu/IMainMenu";


interface ICardLayoutField {
    Name: string;
    Value: string;
    ValueContent?: ReactNode;
    Header?: number | boolean;
    Group?: string;
    Row?: 'space-between' | 'inline';
    disabledCheckbox?: boolean;
}

interface ICardLayout {
    uniqueName: string;
    data: unknown;
    fields: ICardLayoutField[];
    showCheckboxInHeader?: boolean;
    checkboxName?: string;
    checkboxValue?: boolean;
    onCheckboxChange?: (checked: boolean) => void;
    featureId?: string;
    ContentImage?: IImage;
    className?: string;
    hideRightMouseMenu?: boolean;
    tabIndex?: number;
    keyboardNavigationOrientation?: 'vertical' | 'horizontal';
    isSelected?: boolean;
    onClick?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown) => void;
    containerName?: string;
    featureData?: IMenuItem[];
    allowEditButton?: boolean;
    allowDeleteButton?: boolean;
    isEditDisabled?: boolean;
    isDeleteDisabled?: boolean;
    handleMouseForEdit?: (data: unknown) => void;
    handleMouseForDelete?: (data: unknown) => void;
    handleNodeMenuOnClick?: (
        menu: IActionImageForSubMenu,
        selectedRow: unknown,
        containerName: string
    ) => void;
    renderForm?: ReactNode;
}
export type { ICardLayout, ICardLayoutField };

/* Max detail items shown side-by-side in one row when space is available. */
const DETAIL_ROW_MAX_ITEMS = 3;

/* Returns true when field should render in the card header row. */
const isHeaderField = (field: ICardLayoutField): boolean =>
    field.Header === true || (typeof field.Header === 'number' && field.Header > 0);

/* Sort order for header slots (Header: true treated as 1). */
const getHeaderOrder = (field: ICardLayoutField): number => {
    if (field.Header === true) {
        return 1;
    }
    if (typeof field.Header === 'number') {
        return field.Header;
    }
    return 0;
};

/* Primary header (Header: 1) renders bold; other header slots render normal weight. */
const isPrimaryHeaderField = (field: ICardLayoutField): boolean =>
    getHeaderOrder(field) === 1;

/* Formats a detail row label as "Name: Value" or Value when Name is empty. */
const formatFieldLabel = (field: ICardLayoutField): string =>
    field.Name?.trim() ? `${field.Name}: ${field.Value}` : field.Value;

/* Header label — primary (Header: 1) shows value only; other headers show "Name: Value". */
const formatHeaderLabel = (field: ICardLayoutField): string => {
    const value = field.Value?.trim() || '—';
    if (isPrimaryHeaderField(field)) {
        return value;
    }
    return field.Name?.trim() ? `${field.Name}: ${value}` : value;
};

/* Groups detail fields by optional Group key for inline rows. */
const groupDetailFields = (
    fields: ICardLayoutField[]
): ICardLayoutField[][] => {
    const groups: ICardLayoutField[][] = [];
    const groupMap = new Map<string, ICardLayoutField[]>();

    for (const field of fields) {
        if (!field.Group) {
            groups.push([field]);
            continue;
        }

        const existing = groupMap.get(field.Group);
        if (existing) {
            existing.push(field);
        } else {
            const nextGroup = [field];
            groupMap.set(field.Group, nextGroup);
            groups.push(nextGroup);
        }
    }

    return groups;
};

/* Splits a detail group into render rows (up to 3 items per row when space allows). */
const chunkDetailRows = (
    fields: ICardLayoutField[],
    maxItemsPerRow = DETAIL_ROW_MAX_ITEMS
): ICardLayoutField[][] => {
    if (fields.length <= maxItemsPerRow) {
        return [fields];
    }

    const rows: ICardLayoutField[][] = [];
    for (let index = 0; index < fields.length; index += maxItemsPerRow) {
        rows.push(fields.slice(index, index + maxItemsPerRow));
    }
    return rows;
};

/* Resolves header row layout class from header field count. */
const getHeaderRowClassName = (headerCount: number): string => {
    if (headerCount === 2) {
        return 'nz-cardlayout-header-row nz-cardlayout-header-row--space-between';
    }
    if (headerCount > 2) {
        return 'nz-cardlayout-header-row nz-cardlayout-header-row--multi';
    }
    return 'nz-cardlayout-header-row';
};

/* Resolves row layout from explicit Row prop; email-row defaults to space-between. */
const getDetailRowLayout = (row: ICardLayoutField[]): 'space-between' | 'inline' => {
    if (row.some((field) => field.Row === 'space-between')) {
        return 'space-between';
    }
    if (row.some((field) => field.Row === 'inline')) {
        return 'inline';
    }
    return row[0]?.Group === 'email-row' ? 'space-between' : 'inline';
};

/* Resolves response-detail row layout class from row fields. */
const getDetailRowClassName = (row: ICardLayoutField[]): string => {
    if (row.length === 2) {
        return getDetailRowLayout(row) === 'space-between'
            ? 'nz-cardlayout-detail-row nz-cardlayout-detail-row--two nz-cardlayout-detail-row--space-between'
            : 'nz-cardlayout-detail-row nz-cardlayout-detail-row--two nz-cardlayout-detail-row--inline';
    }
    if (row.length >= 3) {
        return 'nz-cardlayout-detail-row nz-cardlayout-detail-row--three nz-cardlayout-detail-row--inline';
    }
    return 'nz-cardlayout-detail-row nz-cardlayout-detail-row--one';
};

/* Returns true when card data is flagged as NetZoom (isnz / isNZ / IsNZ). */
const isNzCardData = (data: unknown): boolean => {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const record = data as Record<string, unknown>;
    const isnzValue = record.isnz ?? record.isNZ ?? record.IsNZ;

    if (typeof isnzValue === 'boolean') {
        return isnzValue;
    }
    if (typeof isnzValue === 'number') {
        return isnzValue === 1;
    }
    if (typeof isnzValue === 'string') {
        const normalized = isnzValue.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
};

/* Renders dynamic name/value rows inside a DynamicCard shell. */
const CardLayout = (props: ICardLayout) => {
    const headerFields = useMemo(
        () =>
            props.fields
                .filter(isHeaderField)
                .sort((left, right) => getHeaderOrder(left) - getHeaderOrder(right)),
        [props.fields]
    );
    const detailFields = props.fields.filter((field) => !isHeaderField(field));
    const groupedDetails = useMemo(() => groupDetailFields(detailFields), [detailFields]);
    const detailRows = useMemo(
        () =>
            groupedDetails.flatMap((group) =>
                group.length >= DETAIL_ROW_MAX_ITEMS
                    ? chunkDetailRows(group, DETAIL_ROW_MAX_ITEMS)
                    : [group]
            ),
        [groupedDetails]
    );

    const renderHeaderField = (field: ICardLayoutField, index: number) => {
        if (field.ValueContent) {
            return (
                <div
                    key={`${props.uniqueName}-header-${index}`}
                    className="nz-cardlayout-header-field-with-content"
                >
                    {field.Name?.trim() && !isPrimaryHeaderField(field) ? (
                        <Label
                            uniqueName={`${props.uniqueName}-header-name-${index}`}
                            label={`${field.Name}: `}
                            fontSize='11px'
                        />
                    ) : null}
                    {field.ValueContent}
                </div>
            );
        }

        return (
            <Label
                key={`${props.uniqueName}-header-${index}`}
                uniqueName={`${props.uniqueName}-header-${index}`}
                label={formatHeaderLabel(field)}
                fontSize='13px'
                fontWeight='500'
            // fontWeight={isPrimaryHeaderField(field) ? 'bold' : undefined}
            />
        );
    };

    const renderDetailField = (
        field: ICardLayoutField,
        rowIndex: number,
        fieldIndex: number
    ) => (
        <div
            key={`${props.uniqueName}-detail-${rowIndex}-${fieldIndex}`}
            className="nz-cardlayout-field-item"
        >
            {field.ValueContent ? (
                <>
                    {field.Name?.trim() ? (
                        <Label
                            uniqueName={`${props.uniqueName}-field-name-${rowIndex}-${fieldIndex}`}
                            label={`${field.Name}: `}
                            fontSize='11px'
                        />
                    ) : null}
                    {field.ValueContent}
                </>
            ) : (
                <Label
                    uniqueName={`${props.uniqueName}-field-${rowIndex}-${fieldIndex}`}
                    label={formatFieldLabel(field)}
                    fontSize='11px'
                />
            )}
        </div>
    );

    const renderDetailRow = (row: ICardLayoutField[], rowIndex: number) => (
        <div
            key={`${props.uniqueName}-detail-row-${rowIndex}`}
            className={getDetailRowClassName(row)}
        >
            {row.map((field, fieldIndex) =>
                renderDetailField(field, rowIndex, fieldIndex)
            )}
        </div>
    );

    const renderHeaderRow = () => {
        if (!headerFields.length) {
            return null;
        }
        const mainHeader = headerFields.find((field) => field.Header === 1);
        const checkbox = props.showCheckboxInHeader ? (
            <div
                className="nz-cardlayout-header-checkbox"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <YesNoControl
                    name={props.checkboxName ?? `${props.uniqueName}-checkbox`}
                    value={!!props.checkboxValue}
                    disabled={mainHeader ? mainHeader.disabledCheckbox : false}
                    onChange={(checked) => props.onCheckboxChange?.(checked)}
                />
            </div>
        ) : null;

        if (headerFields.length === 2) {
            const [primaryHeader, secondaryHeader] = headerFields;
            return (
                <div className={getHeaderRowClassName(headerFields.length)}>
                    <div className="nz-cardlayout-header-start">
                        {checkbox}
                        {renderHeaderField(primaryHeader, 0)}
                    </div>
                    {renderHeaderField(secondaryHeader, 1)}
                </div>
            );
        }

        if (headerFields.length > 2) {
            return (
                <div className={getHeaderRowClassName(headerFields.length)}>
                    {checkbox}
                    {headerFields.map((field, index) => renderHeaderField(field, index))}
                </div>
            );
        }

        return (
            <div className={getHeaderRowClassName(headerFields.length)}>
                {checkbox}
                {renderHeaderField(headerFields[0], 0)}
            </div>
        );
    };

    const cardClassName = [
        props.className,
        isNzCardData(props.data) ? 'nz-cardlayout-isnz' : '',
    ].filter(Boolean).join(' ');

    const handleCardContentMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    const handleCardContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        const selection = window.getSelection();
        if (selection?.toString().trim()) {
            return;
        }

        const target = event.target as HTMLElement;
        if (isCardKeyboardInteractiveTarget(target)) {
            return;
        }

        props.onClick?.(event, props.data);
        props.handleMouseForEdit?.(props.data);
    };

    const isKeyboardFocusable =
        props.keyboardNavigationOrientation !== undefined ||
        props.onClick !== undefined ||
        props.handleMouseForEdit !== undefined;

    const handleCardKeyDown = createCardKeyboardHandler({
        orientation: props.keyboardNavigationOrientation,
        onActivate: (event) => {
            props.onClick?.(event, props.data);
            props.handleMouseForEdit?.(props.data);
        },
    });

    return (
        <DynamicCard
            uniqueName={props.uniqueName}
            data={props.data}
            featureId={props.featureId}
            ContentImage={props.ContentImage}
            className={cardClassName}
            hideRightMouseMenu={props.hideRightMouseMenu}
            role={isKeyboardFocusable ? 'option' : undefined}
            ariaSelected={isKeyboardFocusable ? !!props.isSelected : undefined}
            onKeyDown={isKeyboardFocusable ? handleCardKeyDown : undefined}
            isSelected={props.isSelected}
            onClick={props.onClick}
            containerName={props.containerName}
            featureData={props.featureData}
            allowEditButton={props.allowEditButton}
            allowDeleteButton={props.allowDeleteButton}
            isEditDisabled={props.isEditDisabled}
            isDeleteDisabled={props.isDeleteDisabled}
            handleMouseForEdit={props.handleMouseForEdit}
            handleMouseForDelete={props.handleMouseForDelete}
            handleNodeMenuOnClick={props.handleNodeMenuOnClick}
            Content={
                <div
                    className="nz-cardlayout-content"
                    onMouseDown={handleCardContentMouseDown}
                    onClick={handleCardContentClick}
                >
                    {renderHeaderRow()}

                    {detailRows.length ? (
                        <div className="nz-cardlayout-response-details">
                            {detailRows.map((row, rowIndex) =>
                                renderDetailRow(row, rowIndex)
                            )}
                        </div>
                    ) : null}

                    {props.renderForm ? (
                        <div
                            className="nz-cardlayout-form"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            {props.renderForm}
                        </div>
                    ) : null}
                </div>
            }
        />
    );
};

export {
    CardLayout,
    chunkDetailRows,
    groupDetailFields,
    formatFieldLabel,
    formatHeaderLabel,
    getDetailRowClassName,
    getDetailRowLayout,
    getHeaderOrder,
    isHeaderField,
    isPrimaryHeaderField,
};
