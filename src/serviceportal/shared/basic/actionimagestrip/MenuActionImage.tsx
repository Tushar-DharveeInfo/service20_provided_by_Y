
import { IMenuActionImage } from "../../allinterface/basic/IMenuActionImage.ts";

const MenuActionImage: React.FC<IMenuActionImage> = ({ data }) => {
  if (!data || !data.component) {
    console.error("Invalid component data:", data);
    return null;
  }

  const { component: Component, props } = data;
  return <Component {...props} />;
};

export { MenuActionImage };