
import { IOptionalContainer } from "../../allinterface/basic/IOptionalContainer";

const OptionalContainer: React.FC<IOptionalContainer> = ({ data }) => {
  if (!data || !data.component) {
    console.error("Invalid component data:", data);
    return null;
  }

  const { component: Component, props } = data;
  return <Component {...props} />;
};

export { OptionalContainer };