import Select from 'react-select';

export default function ChartOption(prop) {

    return <div className="option-container">
        <div className="option-name">{prop.name}</div>
        <Select
        defaultValue={[]}
        isMulti
        options={prop.options}
        className="basic-multi-select"
        classNamePrefix="select"
        onChange={prop.onChange}
        />
    </div>
}