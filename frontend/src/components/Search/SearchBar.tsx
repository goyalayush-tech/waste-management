import React, { useState, useRef, useEffect } from 'react';
import { Input, AutoComplete, Typography, Space, Tag } from 'antd';
import { SearchOutlined, FileTextOutlined, ToolOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './SearchBar.module.css';

const { Text } = Typography;

interface SearchOption {
  value: string;
  label: React.ReactNode;
  category: 'tool' | 'data' | 'documentation';
  route?: string;
}

const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<any>(null);

  // Mock search data - in real app, this would come from API
  const searchData: SearchOption[] = [
    // Tools
    {
      value: 'waste-analysis',
      label: (
        <Space>
          <ToolOutlined className={styles.toolIcon} />
          <div>
            <div>Waste Analysis</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Multi-modal AI waste classification
            </Text>
          </div>
        </Space>
      ),
      category: 'tool',
      route: '/waste-analysis',
    },
    {
      value: 'contamination-detection',
      label: (
        <Space>
          <ToolOutlined className={styles.toolIconGreen} />
          <div>
            <div>Contamination Detection</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Real-time contamination analysis
            </Text>
          </div>
        </Space>
      ),
      category: 'tool',
      route: '/contamination-detection',
    },
    {
      value: 'blockchain-certificates',
      label: (
        <Space>
          <ToolOutlined className={styles.toolIconPurple} />
          <div>
            <div>Blockchain Certificates</div>
            <Text type="secondary" className={styles.optionSecondary}>
              NFT waste processing certificates
            </Text>
          </div>
        </Space>
      ),
      category: 'tool',
      route: '/blockchain/certificates',
    },
    {
      value: 'dashboard',
      label: (
        <Space>
          <ToolOutlined className={styles.toolIconOrange} />
          <div>
            <div>Dashboard</div>
            <Text type="secondary" className={styles.optionSecondary}>
              System overview and metrics
            </Text>
          </div>
        </Space>
      ),
      category: 'tool',
      route: '/dashboard',
    },
    {
      value: 'analytics',
      label: (
        <Space>
          <ToolOutlined className={styles.toolIconCyan} />
          <div>
            <div>Analytics</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Comprehensive reporting and insights
            </Text>
          </div>
        </Space>
      ),
      category: 'tool',
      route: '/analytics',
    },
    // Data records
    {
      value: 'waste-batches',
      label: (
        <Space>
          <DatabaseOutlined className={styles.dataIcon} />
          <div>
            <div>Waste Batches</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Processing records and history
            </Text>
          </div>
        </Space>
      ),
      category: 'data',
    },
    {
      value: 'contamination-reports',
      label: (
        <Space>
          <DatabaseOutlined className={styles.dataIconRed} />
          <div>
            <div>Contamination Reports</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Flagged batches and remediation
            </Text>
          </div>
        </Space>
      ),
      category: 'data',
    },
    {
      value: 'nft-certificates',
      label: (
        <Space>
          <DatabaseOutlined className={styles.dataIconPurple} />
          <div>
            <div>NFT Certificates</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Blockchain certificate records
            </Text>
          </div>
        </Space>
      ),
      category: 'data',
    },
    // Documentation
    {
      value: 'user-guide',
      label: (
        <Space>
          <FileTextOutlined className={styles.docIconGreen} />
          <div>
            <div>User Guide</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Complete system documentation
            </Text>
          </div>
        </Space>
      ),
      category: 'documentation',
    },
    {
      value: 'api-documentation',
      label: (
        <Space>
          <FileTextOutlined className={styles.docIconBlue} />
          <div>
            <div>API Documentation</div>
            <Text type="secondary" className={styles.optionSecondary}>
              Developer API reference
            </Text>
          </div>
        </Space>
      ),
      category: 'documentation',
    },
  ];

  const handleSearchInput = (value: string) => {
    setSearchValue(value);
    
    if (!value) {
      setOptions([]);
      return;
    }

    const filteredOptions = searchData.filter(item =>
      item.value.toLowerCase().includes(value.toLowerCase()) ||
      (typeof item.label === 'string' && item.label.toLowerCase().includes(value.toLowerCase()))
    );

    // Group by category
    const groupedOptions: SearchOption[] = [];
    
    const toolOptions = filteredOptions.filter(item => item.category === 'tool');
    const dataOptions = filteredOptions.filter(item => item.category === 'data');
    const docOptions = filteredOptions.filter(item => item.category === 'documentation');

    if (toolOptions.length > 0) {
      groupedOptions.push({
        value: 'tools-header',
        label: (
          <div className={styles.groupHeader}>
            <Text strong className={styles.toolsHeader}>Tools & Features</Text>
          </div>
        ),
        category: 'tool',
      });
      groupedOptions.push(...toolOptions);
    }

    if (dataOptions.length > 0) {
      groupedOptions.push({
        value: 'data-header',
        label: (
          <div className={styles.groupHeader}>
            <Text strong className={styles.dataHeader}>Data & Records</Text>
          </div>
        ),
        category: 'data',
      });
      groupedOptions.push(...dataOptions);
    }

    if (docOptions.length > 0) {
      groupedOptions.push({
        value: 'docs-header',
        label: (
          <div className={styles.groupHeader}>
            <Text strong className={styles.docsHeader}>Documentation</Text>
          </div>
        ),
        category: 'documentation',
      });
      groupedOptions.push(...docOptions);
    }

    setOptions(groupedOptions);
  };

  const handleSelect = (value: string) => {
    const selectedOption = searchData.find(item => item.value === value);
    if (selectedOption?.route) {
      navigate(selectedOption.route);
      setSearchValue('');
      setOptions([]);
      inputRef.current?.blur();
    }
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      setSearchValue('');
      setOptions([]);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchValue('');
      setOptions([]);
      inputRef.current?.blur();
    }
  };

  // Global keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={styles.container}>
      <AutoComplete
        ref={inputRef}
        value={searchValue}
        options={options.map(option => ({
          value: option.value,
          label: option.label,
          disabled: option.value.includes('-header'),
        }))}
        onSearch={handleSearchInput}
        onSelect={handleSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => setFocused(false), 200);
        }}
        style={{ width: '100%' }}
        styles={{ popup: { root: { maxHeight: '400px', overflow: 'auto' } } }}
      >
        <Input
          placeholder="Search tools, data, docs... (Ctrl+K)"
          prefix={<SearchOutlined className={styles.searchPrefix} />}
          suffix={
            focused && (
              <Tag size="small" className={styles.escTag}>
                ESC
              </Tag>
            )
          }
          onKeyDown={handleKeyDown}
          onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
          className={styles.searchInput}
        />
      </AutoComplete>
    </div>
  );
};

export default SearchBar;