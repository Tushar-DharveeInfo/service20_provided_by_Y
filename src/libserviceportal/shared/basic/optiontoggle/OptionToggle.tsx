
import '../../allcss/basic/OptionToggle.css';
import { Kebab24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable.ts';
import { IOptionToggle } from '../../allinterface/basic/IOptionToggle.ts';
import { BaseOptionToggle } from './BaseOptionToggle.tsx';

const OptionToggle = (menuProps: IOptionToggle) => {

    const handleSelect = (selectedRightMouseMenu: string) => {
        menuProps.handleSelect(selectedRightMouseMenu)
    }

    return (
        <div key={menuProps.uniqueName}>
            <BaseOptionToggle
                imageObject={{
                    image: {
                        uniqueName: "Kebabimage",
                        source: <Kebab24x24
                            size={FnGetCssVariable('--image-size-2')}
                            fill='none'
                            strokeWidth={1} />,
                        type: "svg",
                        w: "var(--image-size-2)",
                        h: "var(--image-size-2)",
                        tooltip: "Choose AND or OR"
                    },
                    handleMouse(event, actionCode) {
                    },
                    uniqueName: "Kebab",
                    w: "var(--image-size-2)",
                    h: "var(--image-size-2)",
                    actionCode: "RightMouseMenu",
                }}
                uniqueName={menuProps.uniqueName}
                container={menuProps.container}
                showIcon={menuProps.showIcon}
                handleSelect={handleSelect} />
        </div>
    )
}
export { OptionToggle }