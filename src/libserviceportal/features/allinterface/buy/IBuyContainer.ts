
/* Brochure shell shared by Buy/EULA, Buy/NetZoom, and Buy/Visio Stencils. */
interface IBuyContainer {
    uniqueName: string;//uniqueName for the control and required
    brochureFileName: string;// cloud filename under sm/brochures
    brochureTitle: string;// title shown by the pdf viewer
    headerText?: string;// header text coming from the selected menu item
}

export type { IBuyContainer }
