type GenericObject = Record<string, any>;

function FnExtractKeyObjects(data: GenericObject[], key: string): GenericObject[] {
    try {
        // Basic validation (does not change logic)
        if (!Array.isArray(data) || typeof key !== "string") {
            return [];
        }

        const seen = new Set<any>();
        const result: GenericObject[] = [];

        for (const item of data) {
            // Ensure item is a valid object
            if (item && typeof item === "object" && key in item) {
                const value = item[key];

                if (!seen.has(value)) {
                    seen.add(value);
                    result.push({ [key]: value });
                }
            }
        }

        return result;
    } catch (error) {
        console.error("FnExtractKeyObjects error:", error);
        return [];
    }
}
function FnGetEQIDByManufacturer(data: GenericObject[], manufacturerObj: any): GenericObject[] {
    try {
        const resultMap = new Map<any, GenericObject>();

        // Validate inputs (safe fallback)
        if (!Array.isArray(data) || !Array.isArray(manufacturerObj)) {
            return [];
        }

        if (manufacturerObj.length > 0) {
            for (const element of manufacturerObj) {
                // Ensure valid object structure
                if (!element || typeof element !== "object") continue;

                const filtered = data
                    .filter(item => item && typeof item === "object" && item.Manufacturer === element.Manufacturer)
                    .map(item => ({ EqType: item.MfgEQType }));

                for (const obj of filtered) {
                    if (!resultMap.has(obj.EqType)) {
                        resultMap.set(obj.EqType, obj);
                    }
                }
            }
        }

        const result = Array.from(resultMap.values());
        return result;

    } catch (error) {
        console.error("FnGetEQIDByManufacturer error:", error);
        return [];
    }
}
function FnGetProductNumberByEqType(
    data: GenericObject[],
    manufacturerObj: any,
    EqType: string
): GenericObject[] {
    try {
        const resultMap = new Map<any, GenericObject>();

        // Input validation
        if (!Array.isArray(data) || !Array.isArray(manufacturerObj) || typeof EqType !== "string") {
            return [];
        }

        if (manufacturerObj.length > 0) {
            for (let index = 0; index < manufacturerObj.length; index++) {
                const element = manufacturerObj[index];

                // Validate element
                if (!element || typeof element !== "object") continue;

                const filtered = data
                    .filter(
                        item =>
                            item &&
                            typeof item === "object" &&
                            item.Manufacturer === element.Manufacturer &&
                            item.MfgEQType === EqType
                    )
                    .map(item => ({ MfgProdNo: item.MfgProdNo }));

                for (const obj of filtered) {
                    if (!resultMap.has(obj.MfgProdNo)) {
                        resultMap.set(obj.MfgProdNo, obj);
                    }
                }
            }
        }

        const result = Array.from(resultMap.values());
        return result;

    } catch (error) {
        console.error("FnGetProductNumberByEqType error:", error);
        return [];
    }
}
function FnFindReletedManufacturer(
    data: GenericObject[],
    manufacturerName: string
): GenericObject[] {
    try {
        let result: GenericObject[] = [];

        // Input validation
        if (!Array.isArray(data) || typeof manufacturerName !== "string") {
            return [];
        }

        let mfg = data.filter(
            (item: GenericObject) =>
                item &&
                typeof item === "object" &&
                item.Manufacturer === manufacturerName
        );

        if (mfg.length) {
            for (let index = 0; index < mfg.length; index++) {
                const element = mfg[index];

                // Safe access
                if (element && typeof element === "object") {
                    result.push({ Manufacturer: element.RelatedManufacturer });
                }
            }
        }

        return result;

    } catch (error) {
        console.error("FnFindReletedManufacturer error:", error);
        return [];
    }
}


function FnGetSearchResults(
    data: GenericObject[],
    Manufacturer?: string | GenericObject[],
    MfgEQType?: string,
    MfgProdNo?: string,
    disableSort?: boolean
): GenericObject[] {

    try {
        // Input validation
        if (!Array.isArray(data)) {
            return [];
        }

        // Extract manufacturer names from array if applicable
        let manufacturerNames: string[] = [];

        if (Array.isArray(Manufacturer)) {
            manufacturerNames = Manufacturer
                .filter(m => m && typeof m === "object")
                .map(m => m.Manufacturer)
                .filter(Boolean);
        } else if (typeof Manufacturer === 'string') {
            manufacturerNames = [Manufacturer];
        }

        const filteredData = data.filter(item => {
            if (!item || typeof item !== "object") return false;

            const manufacturerMatch =
                !manufacturerNames.length || manufacturerNames.includes(item.mfg);

            const eqTypeMatch =
                !MfgEQType || item.mty === MfgEQType;

            const prodNoMatch =
                !MfgProdNo || item.pno === MfgProdNo;

            return manufacturerMatch && eqTypeMatch && prodNoMatch;
        });

        if (disableSort) {
            return filteredData;
        }

        return filteredData.sort((a, b) => {
            const mfgCompare = (a.mfg || '').localeCompare(b.mfg || '');
            if (mfgCompare !== 0) return mfgCompare;

            const eqTypeCompare = (a.mty || '').localeCompare(b.mty || '');
            if (eqTypeCompare !== 0) return eqTypeCompare;

            return (a.pno || '').localeCompare(b.pno || '');
        });

    } catch (error) {
        console.error("FnGetSearchResults error:", error);
        return [];
    }
}

function FnGetSearchMenufacturerResults(
    data: GenericObject[],
    searchText?: string
): GenericObject[] {
    try {
        // Input validation
        if (!Array.isArray(data)) {
            return [];
        }

        if (!searchText) return data;

        return data.filter(item =>
            item &&
            typeof item === "object" &&
            item.Manufacturer &&
            typeof item.Manufacturer === "string" &&
            item.Manufacturer.toLowerCase().includes(searchText.toLowerCase())
        );

    } catch (error) {
        console.error("FnGetSearchMenufacturerResults error:", error);
        return [];
    }
}
function FnGetSearchResultsByEqType(
    data: GenericObject[],
    EQID?: string | GenericObject[]
): GenericObject[] {
    try {
        // Input validation
        if (!Array.isArray(data)) {
            return [];
        }

        let EQIDNames: string[] = [];

        if (Array.isArray(EQID)) {
            EQIDNames = EQID
                .filter(m => m && typeof m === "object")
                .map(m => m.EQIDRelation)
                .filter(Boolean)
                .sort();
        } else if (typeof EQID === 'string') {
            EQIDNames = [EQID];
        }

        return data.filter(item => {
            if (!item || typeof item !== "object") return false;

            const eqidMatch =
                !EQIDNames.length || EQIDNames.includes(item.id);

            return eqidMatch;
        });

    } catch (error) {
        console.error("FnGetSearchResultsByEqType error:", error);
        return [];
    }
}

function transformDeviceData(data: GenericObject[]): GenericObject[] {
    try {
        // Input validation
        if (!Array.isArray(data) || data.length === 0) return [];

        const entry = data[0];
        if (!entry || typeof entry !== "object") return [];

        const grouped: { [prefix: string]: GenericObject[] } = {};

        for (const key in entry) {
            if (!Object.prototype.hasOwnProperty.call(entry, key)) continue;

            const segments = key.split('_');
            if (segments.length < 2) continue;

            const prefix = segments[0] + "_" + segments[1];

            let propName = segments[1];
            if (segments.length > 2) {
                let rest = "";
                for (let i = 2; i < segments.length; i++) {
                    rest = rest === "" ? segments[i] : rest + "_" + segments[i];
                }
                propName = rest;
            }

            if (!grouped[prefix]) grouped[prefix] = [];

            grouped[prefix].push({
                PName: propName,
                PropertyLabel: propName,
                PropertyDescription: propName.replace(/([A-Z])/g, ' $1').trim(),
                PropertyValue: String(entry[key])
            });
        }

        const result = Object.entries(grouped).map(([prefix, properties]) => {
            return {
                TableName: prefix.replace(/_/g, '.'),
                TableLabel: prefix,
                Description: prefix,
                Properties: JSON.stringify(properties)
            };
        });

        return result;

    } catch (error) {
        console.error("transformDeviceData error:", error);
        return [];
    }
}
// Extract manufacturer names from array if applicable
export { FnExtractKeyObjects, FnGetEQIDByManufacturer, FnFindReletedManufacturer, FnGetProductNumberByEqType, FnGetSearchResults, transformDeviceData, FnGetSearchResultsByEqType, FnGetSearchMenufacturerResults };