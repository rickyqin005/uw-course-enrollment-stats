import React from "react";

const colHeaders = [
    { name: 'Rank', textAlign: 'left', paddingLeft: '20px', paddingRight: '40px' },
    { name: 'Course', textAlign: 'left', paddingRight: '10px' },
    { textAlign: 'left', paddingRight: '60px' },
    { name: 'Title', textAlign: 'left', paddingRight: '20px' },
    { name: 'Enrollment', textAlign: 'right', paddingRight: '20px' },
    { name: 'Change', textAlign: 'left', paddingRight: '20px' }
];
const cols = [
    { textAlign: 'left', paddingLeft: '30px', paddingRight: '30px' },
    { textAlign: 'left', paddingRight: '10px' },
    { textAlign: 'left', paddingRight: '60px' },
    { textAlign: 'left', paddingRight: '20px' },
    { textAlign: 'right', paddingRight: '20px' },
    { textAlign: 'left', paddingLeft: '20px', paddingRight: '20px' }
];

const triangleUp = '▲';
const triangleDown = '▼';

export default function CoursesTable() {
    const [tableData, setTableData] = React.useState<any[][]>([]);
    

    React.useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/course_changes`, {
            method: "POST",
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_by: [{ col: 'curr_enroll_total', order: false }, { col: 'courses.subject' }, { col: 'courses.code' }],
                limit: 3000
            })
        })
        .then(res => res.json())
        .then(data => {
            setTableData(data.map(row => 
                [row.subject, row.code, row.title, row.curr_enroll_total,
                    `${row.day_change == 0 ? '' : `${row.day_change > 0 ? triangleUp : triangleDown} ${Math.abs(row.day_change)}`}`
                ]));
        })
        .catch(error => console.log(error));
    }, []);
    return <table className="courses-table">
        { colHeaders.length == 0 ? '' :
            <thead>
                <tr style={{ backgroundColor: '#e6e6ff' }}>
                    {colHeaders.map(header => <th style={{ ...header }}>{header.name}</th> )}
                </tr>
            </thead>
        }
        { tableData.length == 0 ? '' :
            <tbody>
                {tableData.map((row, idx) =>
                    <Row style={{ backgroundColor: (idx%2 == 1 ? '#F8F8FF' : undefined) }} values={[idx+1].concat(row)}/>)}
            </tbody>
        }
    </table>;
}

function Row({ style, values }: { style, values: any[] }) {
    return <tr style={style}>
        { values
        .map(value => (value ?? '').toString())
        .map((value, idx) => 
            <td style={{ ...cols[idx],
                color: (value.charAt(0) == triangleUp ? 'green' :
                    (value.charAt(0) == triangleDown ? 'red' : undefined))}}>
                {value}
            </td>
        )}
    </tr>;
}