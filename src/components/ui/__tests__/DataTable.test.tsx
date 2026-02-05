import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, ColumnDef } from '../DataTable';

interface TestData {
  id: number;
  name: string;
  score: number;
  status: string;
}

describe('DataTable', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'Player 1', score: 25, status: 'active' },
    { id: 2, name: 'Player 2', score: 30, status: 'active' },
    { id: 3, name: 'Player 3', score: 20, status: 'inactive' },
  ];

  const columns: ColumnDef<TestData>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'score', header: 'Score', sortable: true },
    { key: 'status', header: 'Status' },
  ];

  it('should render table with data', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('Player 1')).toBeDefined();
    expect(screen.getByText('Player 2')).toBeDefined();
    expect(screen.getByText('Player 3')).toBeDefined();
  });

  it('should render column headers', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('ID')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Score')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
  });

  it('should render empty message when no data', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="No players found" />);
    expect(screen.getByText('No players found')).toBeDefined();
  });

  it('should call onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable data={mockData} columns={columns} onRowClick={onRowClick} />);

    const row = screen.getByText('Player 1').closest('tr');
    if (row) {
      fireEvent.click(row);
      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('should sort data when sortable column header is clicked', () => {
    render(<DataTable data={mockData} columns={columns} />);

    const scoreHeader = screen.getByText('Score').closest('th');
    if (scoreHeader) {
      // Click to sort ascending
      fireEvent.click(scoreHeader);
      const rows = screen.getAllByRole('row');
      expect(rows[1].textContent).toContain('20'); // Player 3 with lowest score

      // Click again to sort descending
      fireEvent.click(scoreHeader);
      const rowsDesc = screen.getAllByRole('row');
      expect(rowsDesc[1].textContent).toContain('30'); // Player 2 with highest score
    }
  });

  it('should render custom cell content with render function', () => {
    const customColumns: ColumnDef<TestData>[] = [
      {
        key: 'name',
        header: 'Name',
        render: (value) => <strong>{value}</strong>,
      },
    ];

    render(<DataTable data={mockData} columns={customColumns} />);
    const strongElement = screen.getByText('Player 1').closest('strong');
    expect(strongElement).toBeDefined();
  });

  it('should show pagination controls when pagination is enabled', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      score: i * 10,
      status: 'active',
    }));

    render(<DataTable data={largeData} columns={columns} pagination pageSize={10} />);
    expect(screen.getByText('Previous')).toBeDefined();
    expect(screen.getByText('Next')).toBeDefined();
    // Check for pagination buttons by role
    const buttons = screen.getAllByRole('button');
    const pageButtons = buttons.filter(btn => btn.textContent === '1' || btn.textContent === '2' || btn.textContent === '3');
    expect(pageButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('should navigate between pages', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      score: i * 10,
      status: 'active',
    }));

    render(<DataTable data={largeData} columns={columns} pagination pageSize={10} />);

    // Should show first 10 items
    expect(screen.getByText('Player 1')).toBeDefined();
    expect(screen.queryByText('Player 11')).toBeNull();

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should show next 10 items
    expect(screen.queryByText('Player 1')).toBeNull();
    expect(screen.getByText('Player 11')).toBeDefined();
  });

  it('should disable Previous button on first page', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      score: i * 10,
      status: 'active',
    }));

    render(<DataTable data={largeData} columns={columns} pagination pageSize={10} />);
    const prevButton = screen.getByText('Previous');
    expect(prevButton.hasAttribute('disabled')).toBe(true);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DataTable data={mockData} columns={columns} className="custom-table" />
    );
    expect(container.firstChild?.className).toContain('custom-table');
  });
});
