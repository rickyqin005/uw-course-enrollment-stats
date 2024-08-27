import React from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';

type ValueAndLabel = { value: any, label: String };
type Data = {
    rank: number,
    subject: string,
    code: string,
    title: string,
    curr_enroll_total: number,
    day_change: ValueAndLabel,
    week_change: ValueAndLabel,
    month_change: ValueAndLabel
};

const headersConst = [
    { Header: 'Rank', accessor: 'rank', style: { rowSpan: 2, textAlign: 'left', paddingLeft: '20px', paddingRight: '40px', paddingBottom: '8px' } },
    { Header: 'Course', accessor: 'subject', style: { rowSpan: 2, textAlign: 'left', paddingRight: '10px', paddingBottom: '8px' } },
    { Header: ' ', accessor: 'code', style: { rowSpan: 2 } },
    { Header: 'Title', accessor: 'title', style: { rowSpan: 2, textAlign: 'left', paddingRight: '20px', paddingBottom: '8px' } },
    { Header: 'Enrollment', accessor: 'curr_enroll_total', style: { rowSpan: 2, textAlign: 'right', paddingRight: '20px', paddingBottom: '8px' } },
    { Header: 'Change',
        columns: [
            { Header: 'Day', accessor: 'day_change.label', style: { paddingLeft: '15px', paddingRight: '15px', paddingBottom: '8px' },
                sortType: (r1, r2, id, desc) => r1.original.day_change.value - r2.original.day_change.value
            },
            { Header: 'Week', accessor: 'week_change.label', style: { paddingLeft: '15px', paddingRight: '15px', paddingBottom: '8px' },
                sortType: (r1, r2, id, desc) => r1.original.week_change.value - r2.original.week_change.value
            },
            { Header: 'Month', accessor: 'month_change.label', style: { paddingLeft: '15px', paddingRight: '20px', paddingBottom: '8px' },
                sortType: (r1, r2, id, desc) => r1.original.month_change.value - r2.original.month_change.value
            }
        ],
        style: { columnSpan: 3, textAlign: 'center', paddingTop: '8px' }
    },
];
const columns = [
    { textAlign: 'left', paddingLeft: '30px', paddingRight: '30px' },
    { textAlign: 'left', paddingRight: '10px' },
    { textAlign: 'left', paddingRight: '30px' },
    { textAlign: 'left', paddingRight: '20px' },
    { textAlign: 'right', paddingRight: '20px' },
    { textAlign: 'left', paddingLeft: '15px', paddingRight: '15px' },
    { textAlign: 'left', paddingLeft: '15px', paddingRight: '20px' }
];

export default function CoursesTable() {
    const [data, setData] = React.useState<Data[]>([]);
    
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
                limit: 10000
            })
        })
        .then(res => res.json())
        .then(data => {
            setData(data.map((row, idx) => {
                return {
                    ...row,
                    rank: idx+1,
                    day_change: { value: (row.day_change ?? 0), label: formatChange(row.day_change ?? 0) },
                    week_change: { value: (row.week_change ?? 0), label: formatChange(row.week_change ?? 0) },
                    month_change: { value: (row.month_change ?? 0), label: formatChange(row.month_change ?? 0) }
                };
            }))
        })
        .catch(error => console.log(error));
    }, []);

    const headers = React.useMemo(() => headersConst, [])

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        // for pagination
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable({ columns: headers, data,
            initialState: { pageSize: 50 }
        }, useSortBy, usePagination);
    
    return (<>
        <div className="pagination">
            <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                {'<<'}
            </button>{' '}
            <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                {'<'}
            </button>{' '}
            <button onClick={() => nextPage()} disabled={!canNextPage}>
                {'>'}
            </button>{' '}
            <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                {'>>'}
            </button>{' '}
            <span>
                Page{' '}
                <strong>
                    {pageIndex + 1} of {pageOptions.length}
                </strong>{' '}
            </span>
            <span>
                Go to page:{' '}
                <input
                    type="number"
                    defaultValue={pageIndex + 1}
                    onChange={e => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0
                    gotoPage(page)
                    }}
                    style={{ width: '100px' }}
                />
            </span>{' '}
            <span>
                Show:{' '}
                <select
                    value={pageSize}
                    onChange={e => {
                        setPageSize(Number(e.target.value))
                    }}>
                    {[10, 20, 50, 100, 500].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                        {pageSize}
                        </option>
                    ))}
                </select>
            </span>
        </div>
        <table {...getTableProps()} className="courses-table">
        <thead>
            {headerGroups.map(headerGroup => (
            
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    style={column.style}
                    rowSpan={column.style?.rowSpan} 
                    colSpan={column.style?.columnSpan}>
                    {column.render('Header')}
                    <span>
                        {column.isSorted ? (column.isSortedDesc ? ` ${triangleDown}` : ` ${triangleUp}`) : ""}
                    </span>
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {page.map((row, idx) => {
            prepareRow(row)
            return (
                <tr {...row.getRowProps()}
                style={{ backgroundColor: (idx%2 == 1 ? '#F8F8FF' : undefined) }}>
                {row.cells.map((cell, idx) => {
                    return (
                    <td
                        {...cell.getCellProps()}
                        style={{
                            ...columns[idx],
                            color: (cell.value?.toString().charAt(0) == triangleUp ? 'green' :
                            (cell.value?.toString().charAt(0) == triangleDown ? 'red' : undefined))
                        }}>
                        {cell.render('Cell')}
                    </td>
                    )
                })}
                </tr>
            )
            })}
        </tbody>
        </table>
    </>);
}

const triangleUp = '▲';
const triangleDown = '▼';
function formatChange(val: number) {
    return `${val == 0 ? '' : `${val > 0 ? triangleUp : triangleDown} ${Math.abs(val)}`}`;
}
