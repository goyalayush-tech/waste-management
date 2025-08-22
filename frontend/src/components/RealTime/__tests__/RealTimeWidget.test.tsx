import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RealTimeWidget from '../RealTimeWidget';
import { useRealTimeData } from '../../../hooks/useRealTimeData';

// Mock the useRealTimeData hook
jest.mock('../../../hooks/useRealTimeData', () => ({
  useRealTimeData: jest.fn(),
}));

const mockUseRealTimeData = useRealTimeData as jest.MockedFunction<typeof useRealTimeData>;

describe('RealTimeWidget', () => {
  const defaultConfig = {
    widgetId: 'test-widget',
    channel: 'test-channel',
  };

  const mockActions = {
    refresh: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading state', () => {
    mockUseRealTimeData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      lastUpdated: null,
      isSubscribed: false,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
  });

  test('should render error state', () => {
    mockUseRealTimeData.mockReturnValue({
      data: null,
      loading: false,
      error: 'Connection failed',
      lastUpdated: null,
      isSubscribed: false,
      isConnected: false,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.getByText('Real-time Data Error')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  test('should render fallback component when no data', () => {
    mockUseRealTimeData.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
      isSubscribed: false,
      isConnected: true,
      ...mockActions,
    });

    const fallback = <div>No data available</div>;

    render(
      <RealTimeWidget {...defaultConfig} fallbackComponent={fallback}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  test('should render children with data', () => {
    const testData = { value: 100, status: 'active' };
    const lastUpdated = new Date();

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated,
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig}>
        {(data, actions) => (
          <div>
            <div>Data: {JSON.stringify(data)}</div>
            <button onClick={actions.refresh}>Refresh</button>
          </div>
        )}
      </RealTimeWidget>
    );

    expect(screen.getByText(`Data: ${JSON.stringify(testData)}`)).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('should show connection status when enabled', () => {
    const testData = { value: 100 };
    const lastUpdated = new Date();

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated,
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig} showConnectionStatus={true}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('should show last updated time when enabled', () => {
    const testData = { value: 100 };
    const lastUpdated = new Date('2024-01-01T12:00:00Z');

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated,
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig} showLastUpdated={true}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.getByText(lastUpdated.toLocaleTimeString())).toBeInTheDocument();
  });

  test('should show disconnected status when not connected', () => {
    const testData = { value: 100 };

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated: new Date(),
      isSubscribed: false,
      isConnected: false,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig} showConnectionStatus={true}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.getByText('Static')).toBeInTheDocument();
  });

  test('should call refresh action when retry button is clicked', () => {
    mockUseRealTimeData.mockReturnValue({
      data: null,
      loading: false,
      error: 'Connection failed',
      lastUpdated: null,
      isSubscribed: false,
      isConnected: false,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    const retryButton = screen.getByRole('img', { name: /reload/i });
    fireEvent.click(retryButton);

    expect(mockActions.refresh).toHaveBeenCalled();
  });

  test('should pass actions to children', () => {
    const testData = { value: 100 };

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated: new Date(),
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig}>
        {(data, actions) => (
          <div>
            <button onClick={actions.refresh}>Refresh</button>
            <button onClick={actions.subscribe}>Subscribe</button>
            <button onClick={actions.unsubscribe}>Unsubscribe</button>
          </div>
        )}
      </RealTimeWidget>
    );

    fireEvent.click(screen.getByText('Refresh'));
    fireEvent.click(screen.getByText('Subscribe'));
    fireEvent.click(screen.getByText('Unsubscribe'));

    expect(mockActions.refresh).toHaveBeenCalled();
    expect(mockActions.subscribe).toHaveBeenCalled();
    expect(mockActions.unsubscribe).toHaveBeenCalled();
  });

  test('should hide connection status when showConnectionStatus is false', () => {
    const testData = { value: 100 };

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated: new Date(),
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig} showConnectionStatus={false}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  test('should hide last updated when showLastUpdated is false', () => {
    const testData = { value: 100 };
    const lastUpdated = new Date();

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: false,
      error: null,
      lastUpdated,
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig} showLastUpdated={false}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    expect(screen.queryByText(lastUpdated.toLocaleTimeString())).not.toBeInTheDocument();
  });

  test('should show loading spinner when loading with existing data', () => {
    const testData = { value: 100 };

    mockUseRealTimeData.mockReturnValue({
      data: testData,
      loading: true,
      error: null,
      lastUpdated: new Date(),
      isSubscribed: true,
      isConnected: true,
      ...mockActions,
    });

    render(
      <RealTimeWidget {...defaultConfig}>
        {(data) => <div>Data: {JSON.stringify(data)}</div>}
      </RealTimeWidget>
    );

    // Should show both data and loading spinner
    expect(screen.getByText(`Data: ${JSON.stringify(testData)}`)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
  });
});