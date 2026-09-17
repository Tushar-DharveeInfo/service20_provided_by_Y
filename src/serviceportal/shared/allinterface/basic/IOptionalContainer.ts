

interface IOptionalContainer {
    /*
        * Optional data property that holds the component and its props.
        */
    data?: {
        /*
        * The React component to be rendered.
        * It should be passed as a parameter.
        */
        component: React.ElementType;
        /*
        * Props to be passed to the component.
        * This is a record of key-value pairs where the keys are strings and values can be of any type.
        */
        props: Record<string, any>;
    };
}
export type { IOptionalContainer }
