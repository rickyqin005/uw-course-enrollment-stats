import React, { useEffect } from "react";

const headers = [
    { name: 'Rank', textAlign: 'left', paddingLeft: '20px', paddingRight: '40px' },
    { name: 'Course', textAlign: 'left', paddingRight: '10px' },
    { textAlign: 'left', paddingRight: '60px' },
    { name: 'Title', textAlign: 'left', paddingRight: '40px' },
    { name: 'Enrollment', textAlign: 'right', paddingRight: '20px' }
];

export default function CoursesTable() {
    const [tableData, setTableData] = React.useState<any[][]>([]);
    

    React.useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/course_enrollment`, {
            method: "POST",
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_by: [{ col: 'course_enroll_total', order: false }, { col: 'subject' }, { col: 'code' }],
                limit: 25
            })
        })
        .then(res => res.json())
        .then(data => {
            setTableData(data
                .filter(row => row.subject.slice(0,2) != 'PD' && !(row.subject == 'MTHEL' && row.code == '99') && !(row.subject == 'GENE' && row.code == '119'))
                .map(row => [row.subject, row.code, row.title, row.course_enroll_total]));
        })
        .catch(error => console.log(error));
    }, []);
    return <table className="courses-table">
        { headers.length == 0 ? '' : 
            <tr style={{ backgroundColor: '#e6e6ff' }}>
                {headers.map(header => <th style={{ ...header }}>{header.name}</th> )}
            </tr>
        }
        { tableData.length == 0 ? '' :
            tableData.map((row, idx) => <Row style={{ backgroundColor: (idx%2 == 1 ? '#F8F8FF' : undefined) }} values={[idx+1].concat(row)}/>)
        }
    </table>;
}

function Row({ style, values }: { style, values: any[] }) {
    return <tr style={style}>
        {values.map((value, idx) => <td style={{ ...headers[idx] }}>{value}</td> )}
    </tr>;
}