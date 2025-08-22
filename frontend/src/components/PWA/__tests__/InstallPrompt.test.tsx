import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from 'antd';
import InstallPrompt from '../InstallPrompt';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.standalone
Object.defineProperty(window.navigator, 'standalone', {
  writable: true,
  value: false,
});

// Mock BeforeInstallPromptEvent
class MockBeforeInstallPromptEvent extends Event {
  platforms: string[] = ['web'];
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  
  constructor() {
    super('beforeinstallprompt');
    this.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
  }
  
  prompt = jest.fn().mockResolvedValue(undefined);
}

describe('InstallPrompt Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders nothing when app is already installed (standalone mode)', () => {
    // Mock standalone display mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when app is installed via iOS standalone', () => {
    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
    });

    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when install prompt was recently dismissed', () => {
    const recentTime = Date.now() - (1000 * 60 * 60 * 24 * 3); // 3 days ago
    localStorageMock.getItem.mockReturnValue(recentTime.toString());

    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('shows install prompt after timeout when conditions are met', async () => {
    jest.useFakeTimers();
    
    const mockEvent = new MockBeforeInstallPromptEvent();
    
    render(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event
    fireEvent(window, mockEvent);
    
    // Fast-forward time to trigger prompt display
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Install Waste Management App')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('handles install button click with deferred prompt', async () => {
    jest.useFakeTimers();
    
    const mockEvent = new MockBeforeInstallPromptEvent();
    const onInstall = jest.fn();
    
    render(<InstallPrompt onInstall={onInstall} />);
    
    // Simulate beforeinstallprompt event
    fireEvent(window, mockEvent);
    
    // Fast-forward time to show prompt
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });
    
    // Click install button
    fireEvent.click(screen.getByText('Install App'));
    
    await waitFor(() => {
      expect(mockEvent.prompt).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });

  it('handles dismiss button click', async () => {
    jest.useFakeTimers();
    
    const mockEvent = new MockBeforeInstallPromptEvent();
    const onDismiss = jest.fn();
    
    render(<InstallPrompt onDismiss={onDismiss} />);
    
    // Simulate beforeinstallprompt event
    fireEvent(window, mockEvent);
    
    // Fast-forward time to show prompt
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Maybe Later')).toBeInTheDocument();
    });
    
    // Click dismiss button
    fireEvent.click(screen.getByText('Maybe Later'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa-install-dismissed',
      expect.any(String)
    );
    expect(onDismiss).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('shows manual install instructions when no deferred prompt available', async () => {
    jest.useFakeTimers();
    
    // Mock Modal.info
    const modalInfoSpy = jest.spyOn(Modal, 'info').mockImplementation(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
    }));
    
    render(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = new MockBeforeInstallPromptEvent();
    fireEvent(window, mockEvent);
    
    // Fast-forward time to show prompt
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });
    
    // Clear the deferred prompt to simulate unsupported browser
    fireEvent(window, new Event('beforeinstallprompt'));
    
    // Click install button without deferred prompt
    fireEvent.click(screen.getByText('Install App'));
    
    expect(modalInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Install Waste Management App',
      })
    );
    
    modalInfoSpy.mockRestore();
    jest.useRealTimers();
  });

  it('handles app installed event', async () => {
    const onInstall = jest.fn();
    
    render(<InstallPrompt onInstall={onInstall} />);
    
    // Simulate app installed event
    fireEvent(window, new Event('appinstalled'));
    
    expect(onInstall).toHaveBeenCalled();
  });

  it('displays correct features in the prompt', async () => {
    jest.useFakeTimers();
    
    const mockEvent = new MockBeforeInstallPromptEvent();
    
    render(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event
    fireEvent(window, mockEvent);
    
    // Fast-forward time to show prompt
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Works Offline')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('App-like Experience')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('shows iOS-specific instructions for iOS devices', async () => {
    // Mock iOS user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    const modalInfoSpy = jest.spyOn(Modal, 'info').mockImplementation(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
    }));
    
    jest.useFakeTimers();
    
    render(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = new MockBeforeInstallPromptEvent();
    fireEvent(window, mockEvent);
    
    // Fast-forward time to show prompt
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });
    
    // Click install button to trigger manual instructions
    fireEvent.click(screen.getByText('Install App'));
    
    expect(modalInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.anything(),
      })
    );
    
    modalInfoSpy.mockRestore();
    jest.useRealTimers();
  });

  it('shows Android-specific instructions for Android devices', async () => {
    // Mock Android user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
      configurable: true,
    });
    
    const modalInfoSpy = jest.spyOn(Modal, 'info').mockImplementation(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
    }));
    
    jest.useFakeTimers();
    
    render(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const mockEvent = new MockBeforeInstallPromptEvent();
    fireEvent(window, mockEvent);
    
    // Fast-forward time to show prompt
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });
    
    // Click install button to trigger manual instructions
    fireEvent.click(screen.getByText('Install App'));
    
    expect(modalInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.anything(),
      })
    );
    
    modalInfoSpy.mockRestore();
    jest.useRealTimers();
  });
});