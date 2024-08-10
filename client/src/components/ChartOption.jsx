import Select from 'react-select';

export default function ChartOption({ name, options, isMultiSelect, defaultValue, onChange }) {

    return <div className="option-container">
        <div className="option-name">{name}</div>
        <Select
        defaultValue={defaultValue}
        isMulti={isMultiSelect}
        options={options}
        className="basic-multi-select"
        classNamePrefix="select"
        onChange={onChange}
        />
    </div>
}