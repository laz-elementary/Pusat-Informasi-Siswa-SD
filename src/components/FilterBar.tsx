import React from 'react';
import { Search, X } from 'lucide-react';
import { FilterState, GradeLevel } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onChangeFilter: (updated: Partial<FilterState>) => void;
  gradeOptions: GradeLevel[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  gradeOptions,
  totalResults,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3.5">
      {/* Top Search & Grade Selector Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul atau perihal surat edaran..."
            value={filter.search}
            onChange={(e) => onChangeFilter({ search: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {filter.search && (
            <button
              onClick={() => onChangeFilter({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grade Level Pills (Semua Kelas, Kelas 1, Kelas 2, Kelas 3, Kelas 4, Kelas 5, Kelas 6, Fase A, Fase B, Fase C) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Filter Sasaran / Jenjang:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar flex-wrap">
          {gradeOptions.map((grade) => {
            const isSelected = filter.gradeLevel === grade;
            return (
              <button
                key={grade}
                onClick={() => onChangeFilter({ gradeLevel: grade })}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                }`}
              >
                {grade}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta Filter Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div>
          Menampilkan <strong className="text-blue-950 font-bold">{totalResults}</strong> surat edaran
          {filter.gradeLevel !== 'Semua Kelas' && (
            <span> untuk <strong className="text-blue-900">{filter.gradeLevel}</strong></span>
          )}
        </div>

        {(filter.search || filter.gradeLevel !== 'Semua Kelas') && (
          <button
            onClick={() =>
              onChangeFilter({
                search: '',
                gradeLevel: 'Semua Kelas',
              })
            }
            className="text-xs text-blue-800 hover:underline font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset Filter
          </button>
        )}
      </div>
    </div>
  );
};
