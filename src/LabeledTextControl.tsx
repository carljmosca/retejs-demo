
import { ClassicPreset } from "rete";
import "antd/dist/reset.css";
import { Input } from 'antd';

export class LabeledTextControl extends ClassicPreset.Control {

    public value: string = '';
    constructor(public label: string, public isMultiline: boolean = false) {
        super();
    }
}

export function LabeledText(props: { data: LabeledTextControl }) {
    function setValue(val: string) {
        props.data.value = val;
    }

    return (
        <div>
            <Input 
                type="text"
                onChange={e => setValue(e.target.value)}
                children={null}></Input>
        </div>
    );
}
