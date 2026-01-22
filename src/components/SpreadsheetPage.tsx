'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '@/utils/api';
import {
    TableCellsIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from './ConfirmModal';

interface Spreadsheet {
    id: number;
    name: string;
    data: string;
    updated_at: string;
}

interface CellData {
    [key: string]: string;
}

interface SpreadsheetPageProps {
    onBack: () => void;
}

const COLS = 26; // A-Z
const ROWS = 100;

const getColName = (index: number): string => {
    return String.fromCharCode(65 + index);
};

export default function SpreadsheetPage({ onBack }: SpreadsheetPageProps) {
    const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<Spreadsheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [newSheetName, setNewSheetName] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [cells, setCells] = useState<CellData>({});
    const [selectedCell, setSelectedCell] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [formulaBarValue, setFormulaBarValue] = useState('');
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });
    const tableRef = useRef<HTMLDivElement>(null);

    const fetchSpreadsheets = useCallback(async () => {
        try {
            const response = await api.get('/api/content/spreadsheets');
            setSpreadsheets(response.data);
        } catch (error) {
            console.error('Failed to fetch spreadsheets:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpreadsheets();
    }, [fetchSpreadsheets]);

    // Load cells when sheet is selected
    useEffect(() => {
        if (selectedSheet) {
            try {
                const parsed = selectedSheet.data ? JSON.parse(selectedSheet.data) : {};
                setCells(parsed);
            } catch {
                setCells({});
            }
        }
    }, [selectedSheet]);

    const handleCellClick = (cellId: string) => {
        setSelectedCell(cellId);
        setFormulaBarValue(cells[cellId] || '');
    };

    const handleCellDoubleClick = (cellId: string) => {
        setEditingCell(cellId);
        setSelectedCell(cellId);
        setFormulaBarValue(cells[cellId] || '');
    };

    const handleCellChange = (cellId: string, value: string) => {
        setCells(prev => ({ ...prev, [cellId]: value }));
        setFormulaBarValue(value);
    };

    const handleCellBlur = () => {
        setEditingCell(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setEditingCell(null);
            // Move to next row
            const col = cellId.charAt(0);
            const row = parseInt(cellId.substring(1));
            const nextCell = `${col}${row + 1}`;
            setSelectedCell(nextCell);
            setFormulaBarValue(cells[nextCell] || '');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            setEditingCell(null);
            // Move to next column
            const col = cellId.charCodeAt(0);
            const row = cellId.substring(1);
            if (col < 90) { // Z
                const nextCell = `${String.fromCharCode(col + 1)}${row}`;
                setSelectedCell(nextCell);
                setFormulaBarValue(cells[nextCell] || '');
            }
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const handleFormulaBarChange = (value: string) => {
        setFormulaBarValue(value);
        if (selectedCell) {
            setCells(prev => ({ ...prev, [selectedCell]: value }));
        }
    };

    const createSpreadsheet = async () => {
        if (!newSheetName.trim()) return;
        try {
            const response = await api.post('/api/content/spreadsheets',
                { name: newSheetName, data: '{}' }
            );
            setSpreadsheets(prev => [...prev, response.data]);
            setNewSheetName('');
            setShowNewModal(false);
            toast.success('Đã tạo bảng tính mới!');
        } catch (error) {
            toast.error('Không thể tạo bảng tính');
        }
    };

    const saveSpreadsheet = async () => {
        if (!selectedSheet) return;
        try {
            await api.put(`/api/content/spreadsheets/${selectedSheet.id}`,
                { name: selectedSheet.name, data: JSON.stringify(cells) }
            );
            toast.success('Đã lưu bảng tính!');
            fetchSpreadsheets();
        } catch (error) {
            toast.error('Lỗi khi lưu');
        }
    };

    const deleteSpreadsheet = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Xóa bảng tính',
            message: 'Bạn có chắc chắn muốn xóa bảng tính này?',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/content/spreadsheets/${id}`);
                    setSpreadsheets(spreadsheets.filter(s => s.id !== id));
                    if (selectedSheet?.id === id) {
                        setSelectedSheet(null);
                    }
                    toast.success('Đã xóa');
                } catch (error) {
                    toast.error('Lỗi khi xóa');
                }
            }
        });
    };

    // Parse cell range (A1:B3 -> array of cell IDs)
    const parseCellRange = (range: string): string[] => {
        const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
        if (!match) return [];

        const startCol = match[1].toUpperCase().charCodeAt(0) - 65;
        const startRow = parseInt(match[2]);
        const endCol = match[3].toUpperCase().charCodeAt(0) - 65;
        const endRow = parseInt(match[4]);

        const cellIds: string[] = [];
        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                cellIds.push(`${String.fromCharCode(65 + c)}${r}`);
            }
        }
        return cellIds;
    };

    // Get numeric values from cell range
    const getRangeValues = (range: string): number[] => {
        const cellIds = parseCellRange(range);
        const values: number[] = [];
        for (const id of cellIds) {
            const val = cells[id];
            if (val && !isNaN(parseFloat(val))) {
                values.push(parseFloat(val));
            }
        }
        return values;
    };

    // Enhanced formula calculation
    const getCellValue = (cellId: string): string => {
        const value = cells[cellId] || '';
        if (!value.startsWith('=')) return value;

        try {
            const formula = value.substring(1).toUpperCase();

            // SUM(A1:B10)
            const sumMatch = formula.match(/^SUM\(([A-Z]\d+:[A-Z]\d+)\)$/);
            if (sumMatch) {
                const values = getRangeValues(sumMatch[1]);
                return values.reduce((a, b) => a + b, 0).toString();
            }

            // AVERAGE(A1:B10) or AVG(A1:B10)
            const avgMatch = formula.match(/^(?:AVERAGE|AVG)\(([A-Z]\d+:[A-Z]\d+)\)$/);
            if (avgMatch) {
                const values = getRangeValues(avgMatch[1]);
                if (values.length === 0) return '0';
                return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
            }

            // MAX(A1:B10)
            const maxMatch = formula.match(/^MAX\(([A-Z]\d+:[A-Z]\d+)\)$/);
            if (maxMatch) {
                const values = getRangeValues(maxMatch[1]);
                if (values.length === 0) return '0';
                return Math.max(...values).toString();
            }

            // MIN(A1:B10)
            const minMatch = formula.match(/^MIN\(([A-Z]\d+:[A-Z]\d+)\)$/);
            if (minMatch) {
                const values = getRangeValues(minMatch[1]);
                if (values.length === 0) return '0';
                return Math.min(...values).toString();
            }

            // COUNT(A1:B10)
            const countMatch = formula.match(/^COUNT\(([A-Z]\d+:[A-Z]\d+)\)$/);
            if (countMatch) {
                const values = getRangeValues(countMatch[1]);
                return values.length.toString();
            }

            // IF(condition, true_val, false_val) - basic support
            const ifMatch = formula.match(/^IF\(([A-Z]\d+)([<>=]+)(\d+),(.+),(.+)\)$/);
            if (ifMatch) {
                const cellVal = parseFloat(cells[ifMatch[1]] || '0');
                const compareVal = parseFloat(ifMatch[3]);
                const trueVal = ifMatch[4].trim();
                const falseVal = ifMatch[5].trim();

                let result = false;
                switch (ifMatch[2]) {
                    case '>': result = cellVal > compareVal; break;
                    case '<': result = cellVal < compareVal; break;
                    case '>=': result = cellVal >= compareVal; break;
                    case '<=': result = cellVal <= compareVal; break;
                    case '=': case '==': result = cellVal === compareVal; break;
                    case '<>': case '!=': result = cellVal !== compareVal; break;
                }
                return result ? trueVal : falseVal;
            }

            // Cell reference (=A1)
            const refMatch = formula.match(/^([A-Z]\d+)$/);
            if (refMatch) {
                return cells[refMatch[1]] || '';
            }

            // Basic math: =A1+B1, =A1*2, etc.
            const mathMatch = formula.match(/^([A-Z]\d+)([\+\-\*\/])(\d+|[A-Z]\d+)$/);
            if (mathMatch) {
                const val1 = parseFloat(cells[mathMatch[1]] || '0');
                const val2 = mathMatch[3].match(/[A-Z]/)
                    ? parseFloat(cells[mathMatch[3]] || '0')
                    : parseFloat(mathMatch[3]);
                switch (mathMatch[2]) {
                    case '+': return (val1 + val2).toString();
                    case '-': return (val1 - val2).toString();
                    case '*': return (val1 * val2).toString();
                    case '/': return val2 !== 0 ? (val1 / val2).toFixed(2) : '#DIV/0!';
                }
            }

            return value;
        } catch {
            return '#ERROR!';
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        const data: (string | number)[][] = [];

        // Find max used row and column
        let maxRow = 1, maxCol = 0;
        Object.keys(cells).forEach(cellId => {
            const col = cellId.charCodeAt(0) - 65;
            const row = parseInt(cellId.substring(1));
            if (col > maxCol) maxCol = col;
            if (row > maxRow) maxRow = row;
        });

        // Build data array
        for (let r = 1; r <= maxRow; r++) {
            const rowData: (string | number)[] = [];
            for (let c = 0; c <= maxCol; c++) {
                const cellId = `${String.fromCharCode(65 + c)}${r}`;
                const value = getCellValue(cellId);
                rowData.push(isNaN(parseFloat(value)) ? value : parseFloat(value));
            }
            data.push(rowData);
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, selectedSheet?.name || 'Sheet1');
        XLSX.writeFile(wb, `${selectedSheet?.name || 'spreadsheet'}.xlsx`);
        toast.success('Đã xuất file Excel!');
    };

    // Import from Excel
    const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

                const newCells: CellData = {};
                jsonData.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        if (cell !== undefined && cell !== null && cell !== '') {
                            const cellId = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
                            newCells[cellId] = String(cell);
                        }
                    });
                });

                setCells(newCells);
                toast.success('Đã import file Excel!');
            } catch (error) {
                toast.error('Lỗi khi đọc file Excel');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // Coming Soon View
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                <TableCellsIcon className="w-12 h-12 text-accent" />
            </div>

            <h1 className="text-4xl font-black text-primary mb-4 tracking-tight uppercase italic">
                Bảng tính <span className="text-accent underline decoration-wavy">Planex</span>
            </h1>

            <div className="max-w-md bg-surface border border-border p-8 rounded-3xl shadow-xl relative overflow-hidden">


                <p className="text-lg text-primary font-medium mb-4">
                    Tính năng đang được đội ngũ Planex phát triển & tối ưu hóa.
                </p>

                <p className="text-secondary text-sm leading-relaxed mb-8">
                    Chúng tôi đang nỗ lực mang đến trải nghiệm bảng tính mượt mà và mạnh mẽ nhất cho bạn. Hãy quay lại sau nhé!
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onBack}
                        className="w-full py-3.5 bg-accent text-page font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20"
                    >
                        Quay về Trang chủ
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-syntax-green animate-pulse"></div>
                        Vẫn đang được phát triển tích cực
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDanger={true}
            />
        </div>
    );
}
