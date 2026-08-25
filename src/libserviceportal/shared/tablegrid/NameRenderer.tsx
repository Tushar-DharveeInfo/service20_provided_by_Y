// 1. Import Dependencies:
//    - Import React, `useState`, `useEffect` from the Material-UI library.
//    - Import the `iNameRendererProps` interface from a specified location.

// 2. Props Interface:
//    - Define the `iNameRendererProps` interface to specify the expected props structure for the component.

// 3. Functional Component:
//    - Create a functional component named `NameRenderer` using the `React.FC` type.
//    - Destructure and access the required props from the provided `iNameRendererProps`.
//    - Use state to manage the visibility of the success message.

// 4. Effect for IsSaved Property:
//    - Implement an effect that listens for changes in the `IsSaved` property of the `data` prop.
//    - If `IsSaved` is true, set `showSuccess` to true to display the success message.
//    - Utilize `setTimeout` to automatically hide the success message after 5 seconds.

// 5. Render Component:
//    - Render a span element with a title attribute based on the `NameDesc` or `Description` properties of `data`.
//    - Display the combined value of `value` and an optional "(Required)" text based on the `IsRequired` property of `data`.
//    - Show a success icon (`CheckCircle`) within a span if `showSuccess` is true.

// 6. Export Component:
//    - Export the `NameRenderer` component as the default export.

// This workflow outlines the structure and functionality of the `NameRenderer` component, emphasizing the usage of TypeScript, state management, and effects for handling asynchronous operations.

import React, { useState, useEffect } from 'react';
import { INameRenderer } from '../allinterface/tablegrid/INameRenderer';
import { Check } from '@n20a/libicon';
import { Image } from '../basic/image/Image';
import { DisplayControlEnums } from '../alldefaultprops/basic/DefaultPropsFormContainer';

const NameRenderer: React.FC<INameRenderer> = (props) => {
    const [showSuccess, setShowSuccess] = useState(false);
    const [data, setData] = useState<any>(null)
    const [isFunctionAvailable, setIsFunctionAvailable] = useState(false);


    useEffect(() => {
        // Effect to handle changes in IsSaved property of data.
        if (props.data.IsSaved) {
            // If data is saved, show success message.
            setShowSuccess(true);

            // Hide success message after 5 seconds.
            setTimeout(() => {
                setShowSuccess(false);
                props.data.IsSaved = false;
            }, 5000);
        }
    }, [props.data.IsSaved, props.data?.Value]);

    useEffect(() => {
        if (props.data && props.EmPgTableContext && props.context?.tableName) {
            const tableName = props.context.tableName?.toLowerCase();
            const pName = (props.data._AP as string)?.toLowerCase();
            const emPgTableRecords = props.EmPgTableContext.find(
                (item: any) =>
                    item.TableName?.toLowerCase() === tableName
                    && item.PName?.toLowerCase() === pName
                    // && item.DefaultValue?.toLowerCase().includes('fn')
                    // && item.Description?.toLowerCase().includes('fn')
                    && item.DefaultValue && item.DefaultValue?.toLowerCase().includes('nzf_')
                // && !item.RequiredToAddRecord
                // && !item.RequiredToUpdateRecord
            );
            if (emPgTableRecords) {
                setIsFunctionAvailable(true)
            } else {
                setIsFunctionAvailable(false)
            }
        }
    }, [props.data, props.context, props.empgTableData])
    useEffect(() => {
        if (props.data) {
            setData(props.data)
        }
    }, [props.data])

    return (
        <> {data && (<span className={`d-flex align-items-center justify-content-between w-100 ${isFunctionAvailable ? 'nz-cell-function-available' : ""}`} title={`${data.DisplayControl === DisplayControlEnums.TextControl ||
            data.DisplayControl === DisplayControlEnums.HyperlinkControl ? "(Read-only) " : ""}${data.NameDesc ? (data.NameDesc + (data.IsRequired ? " (Required)" : "")) : (data.Description ? data.Description : "")}`}>
            <div><span>{`${props.value}`}</span>
                {data.IsRequired ? <span title="">*</span> : <></>}
            </div>
            {showSuccess && <span className='d-flex align-items-center po-ab' title="saved successfully" >
                <div className="nz-misc-icon-success">
                    <Image uniqueName="CheckCircle" source={<Check
                        size={'17px'}
                        fill='none' />} type="svg" w="var(--image-size-2)" h="var(--image-size-2)" />
                </div>
            </span>}

        </span>)}
        </>
    );
};

export { NameRenderer }