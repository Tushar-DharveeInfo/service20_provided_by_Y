


interface IRefData {
    Name: string;              // Name of the reference item
    Value: string;            // Value will be set from name and will be used to show data
    Label?: string;            // Label to show if found
    SortOrder?: number;         // Sorting order for the item
    Description?: string;      // Decription to show tooltip if needed
    EntID?: string;             // Entity ID (unique identifier)
    RefValue: string;          // Reference value
}

export type { IRefData }