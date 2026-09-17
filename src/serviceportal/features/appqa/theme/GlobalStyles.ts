
import { createGlobalStyle } from "styled-components";
import { FnHexToRGB } from "../../../shared/allcommon/basic/FnHexToRGB";

declare module 'styled-components' {
  export interface DefaultTheme {
    font: string;
    colors: {
      bgExplorer: string;
      bgFeaturePane1: string;
      bgFeaturePane2: string;
      bgform: string;
      bgTitlebarAndStatusbar: string;
      ChartButtonBackground: string;
      bgChart: string;
      subheaderbg: string;
      textprimary: string;
      textsecondary: string;
      iconColor: string;
      selection: string;
      selectionText: string;
      hover: string;
      borderAndScrollbar: string;
      disabledColor: string;
      bgColorSidebar: string;
      bgColorSidebarTitle: string;
      bgColorStatusbar: string;
      bgColorStatusbarError: string;
      bgColorHelptip: string;
      bgColorMenu: string;
      bgColorSidebarPinCell: string;
      scrollbarThumbHover: string;
      bgPrimary: string
    };
  }
}
const GlobalStyles = createGlobalStyle`
  html {
    --bgexplorer: ${({ theme }) => theme.colors.bgExplorer};
    --bgfeaturepane1: ${({ theme }) => theme.colors.bgFeaturePane1};
    --bgfeaturepane2: ${({ theme }) => theme.colors.bgFeaturePane2};
    --bgform: ${({ theme }) => theme.colors.bgform};
    --bgtitlebarandstatusbar: ${({ theme }) => theme.colors.bgTitlebarAndStatusbar};
    --bgChart: ${({ theme }) => theme.colors.bgChart};
    --bgchartbutton: ${({ theme }) => theme.colors.ChartButtonBackground};
    --iconColor: ${({ theme }) => theme.colors.iconColor};
    --subheaderbg: ${({ theme }) => theme.colors.subheaderbg};
    --selection: ${({ theme }) => theme.colors.selection};
    --selection-text: ${({ theme }) => theme.colors.selectionText};
    --hover: ${({ theme }) => theme.colors.hover};
    --borderandscrollbar: ${({ theme }) => theme.colors.borderAndScrollbar};
    --textprimary: ${({ theme }) => theme.colors.textprimary};
    --textsecondary: ${({ theme }) => theme.colors.textsecondary};
    --fontfamily: ${({ theme }) => theme.font};
    --bgPrimary: ${({ theme }) => theme.colors.bgPrimary};
    --disabled-color: ${({ theme }) => theme.colors.disabledColor};
    --bg-color-sidebar: ${({ theme }) => theme.colors.bgColorSidebar};
    --bg-color-sidebar-title: ${({ theme }) => theme.colors.bgColorSidebarTitle};
    --bg-color-statusbar-error: ${({ theme }) => theme.colors.bgColorStatusbarError};
    --bg-color-helptip: ${({ theme }) => theme.colors.bgColorHelptip};
    --bg-color-menu: ${({ theme }) => theme.colors.bgColorMenu};
    --bg-color-sidebarpincell: ${({ theme }) => theme.colors.bgColorSidebarPinCell};
    --scrollbar-thumb-hover: ${({ theme }) => theme.colors.scrollbarThumbHover};
    --lf-control-input-text: ${({ theme }) => theme.colors.textprimary};
    --lf-control-label-color: ${({ theme }) => theme.colors.textsecondary};
    --lf-control-input-bg: ${({ theme }) => theme.colors.bgform};
    --lf-control-border-color: ${({ theme }) => theme.colors.borderAndScrollbar};
    --bgexplorerrgb: ${({ theme }) => theme.colors.bgExplorer && FnHexToRGB(theme.colors.bgExplorer)};
    --secondaryrgb: ${({ theme }) => theme.colors.bgFeaturePane1 && FnHexToRGB(theme.colors.bgFeaturePane1)};
    --textprimaryrgb: ${({ theme }) => theme.colors.textprimary && FnHexToRGB(theme.colors.textprimary)};
    --textsecondaryrgb: ${({ theme }) => theme.colors.textsecondary && FnHexToRGB(theme.colors.textsecondary)};
  }
`;

export { GlobalStyles }
