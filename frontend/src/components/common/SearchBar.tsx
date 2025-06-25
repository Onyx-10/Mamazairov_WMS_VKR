// frontend/src/components/common/SearchBar.tsx
import { Input } from 'antd'
import type { SearchProps } from 'antd/es/input/Search'; // Для типов AntD
import React from 'react'

const { Search } = Input;

interface GlobalSearchBarProps {
  onSearch: (value: string) => void; // Функция, которая будет вызываться при поиске
  placeholder?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSearch,
  placeholder = "Поиск товаров и ячеек...",
  loading = false,
  className,
  style,
}) => {
  const handleSearch: SearchProps['onSearch'] = (value, _event, info) => {
    // info?.source === 'input' означает, что поиск вызван вводом и нажатием Enter или кликом по иконке
    // info?.source === 'clear' - если бы была кнопка очистки
    if (info?.source === 'input' && value.trim() !== '') {
      onSearch(value.trim());
    } else if (info?.source === 'input' && value.trim() === '') {
      onSearch(''); // Поиск по пустой строке (возможно, для сброса результатов)
    }
  };

  return (
    <Search
      placeholder={placeholder}
      allowClear // Позволяет очищать поле ввода
      enterButton="Найти" // Текст на кнопке поиска
      size="large" // Размер поля ввода
      onSearch={handleSearch}
      loading={loading} // Показывает индикатор загрузки на кнопке
      className={className}
      style={style}
    />
  );
};

export default GlobalSearchBar;