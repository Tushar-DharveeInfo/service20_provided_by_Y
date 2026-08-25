
interface INameRenderer {
  data: {
    IsSaved: boolean;//  If `IsSaved` changes to `true`, set `showSuccess` to `true`, indicating a successful save.
    NameDesc?: string; // Render a span element with a title attribute based on the `NameDesc` or `Description` properties of `data`.
    Description?: string;  // display tooltip of column
    IsRequired: boolean; // Display the combined value of `value` and an optional "(Required)" text based on the `IsRequired` property of `data`.
    Value?: string; // value of column
    [key: string]: unknown; // Allow additional properties
  };
  value: string; // value of column
  [key: string]: any;
}

export type { INameRenderer }