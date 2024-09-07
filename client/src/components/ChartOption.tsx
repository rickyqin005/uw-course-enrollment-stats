import React from 'react';
import Select from 'react-select';

export default function ChartOption({ name, value, options, isMultiSelect, onChange }:
    { name: string, value: { value: any, label: any } | undefined, options: { value: any, label: any }[],
    isMultiSelect: boolean | undefined, onChange: (arg0: any) => void }) {

    return <div className="option-container">
        <div className="option-name">{name}</div>
        <Select
            value={value}
            isMulti={isMultiSelect}
            options={options}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={onChange}
            />
    </div>
}