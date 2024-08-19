import React from "react";

type ValueAndLabel = { value: any, label: String };
type RowData = number | String | ValueAndLabel;

const colHeaders = [
    [
        { name: 'Rank', rowSpan: 2, textAlign: 'left', paddingLeft: '20px', paddingRight: '40px',
            sortComp: (a: RowData[], b: RowData[]) => (a[0] as number) - (b[0] as number)
        },
        { name: 'Course', rowSpan: 2, columnSpan: 2, textAlign: 'left', paddingRight: '10px',
            sortComp: (a: RowData[], b: RowData[]) => {
                if((a[1] as string).localeCompare(b[1] as string) == 0) return (a[2] as string).localeCompare(b[2] as string);
                return  (a[1] as string).localeCompare(b[1] as string);
            } },
        { name: 'Title', rowSpan: 2, textAlign: 'left', paddingRight: '20px',
            sortComp: (a: RowData[], b: RowData[]) => (a[3] as string).localeCompare(b[3] as string)
        },
        { name: 'Enrollment', rowSpan: 2, textAlign: 'right', paddingRight: '20px',
            sortComp: (a: RowData[], b: RowData[]) => (a[4] as number) - (b[4] as number)
        },
        { name: 'Change', columnSpan: 3, textAlign: 'center', paddingTop: '8px' }
    ],
    [
        { name: 'Day', paddingLeft: '15px', paddingRight: '15px', paddingBottom: '8px',
            sortComp: (a: RowData[], b: RowData[]) => (a[5] as ValueAndLabel).value - (b[5] as ValueAndLabel).value
        },
        { name: 'Week', paddingLeft: '15px', paddingRight: '15px', paddingBottom: '8px',
            sortComp: (a: RowData[], b: RowData[]) => (a[6] as ValueAndLabel).value - (b[6] as ValueAndLabel).value
        },
        { name: 'Month', paddingLeft: '15px', paddingRight: '20px', paddingBottom: '8px',
            sortComp: (a: RowData[], b: RowData[]) => (a[7] as ValueAndLabel).value - (b[7] as ValueAndLabel).value
        }
    ]
];

const cols = [
    { textAlign: 'left', paddingLeft: '30px', paddingRight: '30px' },
    { textAlign: 'left', paddingRight: '10px' },
    { textAlign: 'left', paddingRight: '30px' },
    { textAlign: 'left', paddingRight: '20px' },
    { textAlign: 'right', paddingRight: '20px' },
    { textAlign: 'left', paddingLeft: '15px', paddingRight: '15px' },
    { textAlign: 'left', paddingLeft: '15px', paddingRight: '20px' }
];

const triangleUp = '▲';
const triangleDown = '▼';

export default function CoursesTable() {
    const [tableData, setTableData] = React.useState<RowData[][]>([]);
    // true: ascending, false: descending
    const [sortColumn, setSortColumn] = React.useState<{ index: number[], dir: boolean } | null>(null);
    
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
            setTableData(data.map((row, idx) =>
                [idx+1, row.subject, row.code, row.title, row.curr_enroll_total,
                    { value: (row.day_change ?? 0), label: formatChange(row.day_change ?? 0) },
                    { value: (row.week_change ?? 0), label: formatChange(row.week_change ?? 0) },
                    { value: (row.month_change ?? 0), label: formatChange(row.month_change ?? 0) },
                ]));
            setSortColumn({ index: [0, 0], dir: true });
        })
        .catch(error => console.log(error));
    }, []);

    React.useEffect(() => {
        if(sortColumn != null) {
            const newTableData = tableData.slice();
            newTableData.sort((a,b) => (colHeaders[sortColumn.index[0]][sortColumn.index[1]] as any).sortComp(a,b)*(sortColumn.dir ? 1 : -1));
            setTableData(newTableData);
        }
    }, [sortColumn]);

    return <table className="courses-table">
        { colHeaders.length == 0 ? '' :
            <thead>
                {colHeaders.map((headerRow, i) =>
                    <tr>
                        {headerRow.map((header, j) =>
                            <th style={header}
                                rowSpan={header.rowSpan ?? undefined} 
                                colSpan={header.columnSpan ?? undefined}
                                onClick={(sortColumn == null || header.sortComp == undefined) ? undefined :
                                () => {
                                    if(sortColumn.index[0] == i && sortColumn.index[1] == j)
                                        setSortColumn({ ...sortColumn, dir: !sortColumn.dir});
                                    else setSortColumn({ index: [i,j], dir: true });
                                }}>
                                    {`${header.name}${(sortColumn != null && sortColumn.index[0] == i && sortColumn.index[1] == j) ?
                                        ` ${(sortColumn.dir ? triangleUp : triangleDown)}` : ''}`}
                            </th>
                        )}
                    </tr>
                )}
            </thead>
        }
        { tableData.length == 0 ? '' :
            <tbody>
                {tableData.map((row, idx) =>
                    <Row style={{ backgroundColor: (idx%2 == 1 ? '#F8F8FF' : undefined) }} values={row}/>)}
            </tbody>
        }
    </table>;
}

function Row({ style, values }: { style, values: RowData[] }) {
    return <tr style={style}>
        { values
        .map(value => (typeof value == 'object' ? (value as any).label : value.toString()))
        .map((value, idx) => 
            <td style={{ ...cols[idx],
                color: (value.charAt(0) == triangleUp ? 'green' :
                    (value.charAt(0) == triangleDown ? 'red' : undefined))}}>
                {value}
            </td>
        )}
    </tr>;
}

function formatChange(val: number) {
    return `${val == 0 ? '' : `${val > 0 ? triangleUp : triangleDown} ${Math.abs(val)}`}`;
}