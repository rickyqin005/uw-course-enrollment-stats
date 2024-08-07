import Select from 'react-select';

export default function ChartOption({ name, options, onChange }) {

    return <div className="option-container">
        <div className="option-name">{name}</div>
        <Select
        defaultValue={[]}
        isMulti
        options={options}
        className="basic-multi-select"
        classNamePrefix="select"
        onChange={onChange}
        />
    </div>
}