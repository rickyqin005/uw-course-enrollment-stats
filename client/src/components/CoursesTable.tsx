import React from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { EnrollmentChartState, ValueAndLabel } from './types';
import useAPI from '../hooks/useAPI.ts';
import updateOptionsSelected from './updateOptionsSelected.ts';

type Data = {
    rank: number,
    subject: string,
    code: string,
    title: string,
    curr_enroll_total: number,
    day_change: ValueAndLabel<number>,
    week_change: ValueAndLabel<number>,
    month_change: ValueAndLabel<number>
};

const headersConst = [
    { Header: 'Rank', accessor: 'rank',
        style: { rowSpan: 2, textAlign: 'left', paddingLeft: '2vw', paddingRight: '3vw', paddingBottom: '8px' } },
    { Header: 'Course', accessor: 'subject',
        style: { rowSpan: 2, textAlign: 'left', paddingRight: '1vw', paddingBottom: '8px' } },
    { Header: ' ', accessor: 'code',
        style: { rowSpan: 2 } },
    { Header: 'Title', accessor: 'title',
        style: { rowSpan: 2, textAlign: 'left', paddingRight: '2vw', paddingBottom: '8px' } },
    { Header: 'Enrollment', accessor: 'curr_enroll_total',
        style: { rowSpan: 2, textAlign: 'right', paddingRight: '2vw', paddingBottom: '8px' } },
    { Header: 'Change',
        columns: [
            { Header: 'Day', accessor: 'day_change.label',
                style: { paddingLeft: '1.5vw', paddingRight: '1.5vw', paddingBottom: '8px' },
                sortType: (r1, r2) => r1.original.day_change.value - r2.original.day_change.value
            },
            { Header: 'Week', accessor: 'week_change.label',
                style: { paddingLeft: '1.5vw', paddingRight: '1.5vw', paddingBottom: '8px' },
                sortType: (r1, r2) => r1.original.week_change.value - r2.original.week_change.value
            },
            { Header: 'Month', accessor: 'month_change.label',
                style: { paddingLeft: '1.5vw', paddingRight: '2vw', paddingBottom: '8px' },
                sortType: (r1, r2) => r1.original.month_change.value - r2.original.month_change.value
            }
        ],
        style: { columnSpan: 3, textAlign: 'center', paddingTop: '8px' }
    },
];
const columns = [
    { textAlign: 'left', paddingLeft: '3vw', paddingRight: '3vw' },
    { textAlign: 'left', paddingRight: '1vw' },
    { textAlign: 'left', paddingRight: '3vw' },
    { textAlign: 'left', paddingRight: '2vw' },
    { textAlign: 'right', paddingRight: '2vw' },
    { textAlign: 'left', paddingLeft: '1.5vw', paddingRight: '1.5vw' },
    { textAlign: 'left', paddingLeft: '1.5vw', paddingRight: '2vw' }
];

export default function CoursesTable({ enrollmentChartState }: { enrollmentChartState: EnrollmentChartState }) {

    const { data } = useAPI<Data[]>('/api/course_changes', {}, [],
    data => data.map((row, idx) => {
        return {
            ...row,
            rank: idx+1,
            day_change: { value: (row.day_change ?? 0), label: formatChange(row.day_change ?? 0) },
            week_change: { value: (row.week_change ?? 0), label: formatChange(row.week_change ?? 0) },
            month_change: { value: (row.month_change ?? 0), label: formatChange(row.month_change ?? 0) }
        };
    }), []);

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
            initialState: { pageSize: 20 }
        }, useSortBy, usePagination);
    
    return (<>
        <h2>Which courses are the most popular?</h2>
        <div className="pagination">
            <div>
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
            </div>
            <span>
                Go to page:{' '}
                <input
                    type="number"
                    defaultValue={pageIndex + 1}
                    onChange={e => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0
                    gotoPage(page)
                    }}
                    style={{ width: '4vw' }}
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
                    onClick={() => {
                        updateOptionsSelected({ subject: row.values.subject, code: row.values.code }, enrollmentChartState);
                        enrollmentChartState.chartRef.current.scrollIntoView({ behavior: "smooth" });
                    }}>
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
