

import { useEffect, useState } from "react"
import '../../allcss/basic/JsonViewerControl.css'
import { IJsonViewerControl } from "../../allinterface/basic/IJsonViewerControl.ts"
import { JsonViewer } from "../../jsonviewer/JsonViewer.tsx"
import { Label } from "../label/Label.tsx"

const JsonViewerControl = (jsonViewerControlProps: IJsonViewerControl) => {
    const [jsonData, setJsonData] = useState<{ [key: string]: any }>();

    useEffect(() => {
        if (jsonViewerControlProps.uniqueName) {
            if (jsonViewerControlProps.uniqueName === "EnvVariables") {
                if (jsonViewerControlProps.value) {
                    try {
                        let parsedJson = JSON.parse(jsonViewerControlProps.value);
                        setJsonData(parsedJson);
                        if (jsonViewerControlProps.handleValueChange && parsedJson) {
                            jsonViewerControlProps.handleValueChange(parsedJson, jsonViewerControlProps.uniqueName, true)
                        }
                    } catch (error) {
                        console.error('Error in parse json string :', error);
                        setJsonData(undefined)
                    }
                }
                else {
                    setJsonData(undefined)
                    if (jsonViewerControlProps.handleValueChange) {
                        jsonViewerControlProps.handleValueChange("", jsonViewerControlProps.uniqueName, true);
                    }
                }

            }
            else if (jsonViewerControlProps.uniqueName === "EnvPropMapVariables" && jsonViewerControlProps.containerName) {
                if (jsonViewerControlProps.containerName.includes("service-now")) {

                    setJsonData([
                        { "SN": "prop1", "NZ": "Prop1", default: "Default1" },
                        { "SN": "prop2", "NZ": "Prop2", default: "Default1" },
                        { "SN": "prop3", "NZ": "Prop3" },
                        { "SN": "prop4", "NZ": "Prop4", default: "Default1" },
                    ])
                } else {
                    setJsonData([
                        { "WD": "prop1", "NZ": "Prop1", default: "Default1" },
                        { "WD": "prop2", "NZ": "Prop2", default: "Default1" },
                        { "WD": "prop3", "NZ": "Prop3" },
                        { "WD": "prop4", "NZ": "Prop4", default: "Default1" },
                    ])
                }
            }
            else {
                try {
                    let parsedJson = JSON.parse(jsonViewerControlProps.value);
                    setJsonData(parsedJson);

                } catch (error) {
                    console.error('Error in parse json string :', error);
                    setJsonData(undefined)
                }
            }
        }

    }, [jsonViewerControlProps.uniqueName, jsonViewerControlProps.value
        , jsonViewerControlProps.containerName, jsonViewerControlProps.handleValueChange])


    return (
        <div key={jsonViewerControlProps.uniqueName} className="nz-form-control-labeled nz-fc-jsonviewer">
            {jsonData ?
                <>
                    {jsonViewerControlProps.isRenderAsForm &&
                        <Label uniqueName={`${jsonViewerControlProps.uniqueName}-label`} tooltip={jsonViewerControlProps.nameDesc ? jsonViewerControlProps.nameDesc : ""}
                            label={`${jsonViewerControlProps.label || ""}${jsonViewerControlProps.isRequired ? " (Required)" : ""}`} />}
                    <JsonViewer
                        jsonData={jsonData ?? {}}
                        showAsDiv={jsonViewerControlProps.showAsDiv ? true : false}
                        uniqueName={`${jsonViewerControlProps.uniqueName}-viewer`}

                    />
                    {jsonViewerControlProps.isRenderAsForm && jsonViewerControlProps.valueDesc &&
                        <Label uniqueName={`${jsonViewerControlProps.uniqueName}-desc`} label={jsonViewerControlProps.valueDesc} fontSize={"8px"} fontStyle={"italic"} />
                    }
                </>
                :
                <></>
            }
        </div>
    )
}


export { JsonViewerControl }