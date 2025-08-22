import {
  registerSW,
  unregister,
  OfflineQueue,
  ConnectionMonitor,
  offlineQueue,
  connectionMonitor,
} from '../serviceWorker';

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    unregister: jest.fn(),
    sync: {
      register: jest.fn(),
    },
  }),
  controller: null,
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, PUBLIC_URL: '' };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn(),
  },
  createObjectStore: jest.fn(),
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
};

const mockIDBObjectStore = {
  add: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
};

const mockIDBRequest = {
  result: mockIDBDatabase,
  error: null,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
};

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn().mockReturnValue(mockIDBRequest),
  },
  writable: true,
});

describe('Service Worker Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceWorker.register.mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      onupdatefound: null,
    });
  });

  it('registers service worker on localhost', async () => {
    const config = {
      onSuccess: jest.fn(),
      onUpdate: jest.fn(),
    };

    // Mock window.addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    registerSW(config);

    // Simulate load event
    const loadHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'load'
    )?.[1] as EventListener;
    
    if (loadHandler) {
      loadHandler(new Event('load'));
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('handles service worker registration success', async () => {
    const onSuccess = jest.fn();
    const mockRegistration = {
      installing: null,
      waiting: null,
      active: { state: 'activated' },
      onupdatefound: null,
    };

    mockServiceWorker.register.mockResolvedValue(mockRegistration);

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    registerSW({ onSuccess });

    const loadHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'load'
    )?.[1] as EventListener;
    
    if (loadHandler) {
      loadHandler(new Event('load'));
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockServiceWorker.register).toHaveBeenCalled();
  });

  it('handles service worker registration failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    registerSW();

    const loadHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'load'
    )?.[1] as EventListener;
    
    if (loadHandler) {
      loadHandler(new Event('load'));
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error during service worker registration:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('unregisters service worker', async () => {
    const mockUnregister = jest.fn().mockResolvedValue(true);
    mockServiceWorker.ready = Promise.resolve({
      unregister: mockUnregister,
    });

    await unregister();

    expect(mockUnregister).toHaveBeenCalled();
  });

  it('handles unregister error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockUnregister = jest.fn().mockRejectedValue(new Error('Unregister failed'));
    
    mockServiceWorker.ready = Promise.resolve({
      unregister: mockUnregister,
    });

    await unregister();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    queue = new OfflineQueue();
    jest.clearAllMocks();
    
    // Setup IndexedDB mocks
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBDatabase.objectStoreNames.contains.mockReturnValue(false);
    
    mockIDBRequest.result = mockIDBDatabase;
    mockIDBRequest.onsuccess = null;
    mockIDBRequest.onerror = null;
    mockIDBRequest.onupgradeneeded = null;
  });

  it('adds action to offline queue', async () => {
    const action = {
      id: 'test-action-1',
      method: 'POST',
      url: '/api/test',
      data: { test: 'data' },
      headers: { 'Content-Type': 'application/json' },
      timestamp: Date.now(),
    };

    // Mock successful add operation
    mockIDBObjectStore.add.mockImplementation(() => {
      const request = { onsuccess: null, onerror: null };
      setTimeout(() => request.onsuccess?.(), 0);
      return request;
    });

    // Simulate successful database opening
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) {
        mockIDBRequest.onsuccess();
      }
    }, 0);

    await expect(queue.addAction(action)).resolves.toBeUndefined();
  });

  it('gets actions from offline queue', async () => {
    const mockActions = [
      { id: '1', method: 'POST', url: '/api/test1' },
      { id: '2', method: 'PUT', url: '/api/test2' },
    ];

    // Mock successful getAll operation
    mockIDBObjectStore.getAll.mockImplementation(() => {
      const request = { 
        result: mockActions,
        onsuccess: null, 
        onerror: null 
      };
      setTimeout(() => request.onsuccess?.(), 0);
      return request;
    });

    // Simulate successful database opening
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) {
        mockIDBRequest.onsuccess();
      }
    }, 0);

    const result = await queue.getActions();
    expect(result).toEqual(mockActions);
  });

  it('removes action from offline queue', async () => {
    const actionId = 'test-action-1';

    // Mock successful delete operation
    mockIDBObjectStore.delete.mockImplementation(() => {
      const request = { onsuccess: null, onerror: null };
      setTimeout(() => request.onsuccess?.(), 0);
      return request;
    });

    // Simulate successful database opening
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) {
        mockIDBRequest.onsuccess();
      }
    }, 0);

    await expect(queue.removeAction(actionId)).resolves.toBeUndefined();
  });

  it('clears all actions from offline queue', async () => {
    // Mock successful clear operation
    mockIDBObjectStore.clear.mockImplementation(() => {
      const request = { onsuccess: null, onerror: null };
      setTimeout(() => request.onsuccess?.(), 0);
      return request;
    });

    // Simulate successful database opening
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) {
        mockIDBRequest.onsuccess();
      }
    }, 0);

    await expect(queue.clearAll()).resolves.toBeUndefined();
  });
});

describe('ConnectionMonitor', () => {
  let monitor: ConnectionMonitor;

  beforeEach(() => {
    monitor = new ConnectionMonitor();
    jest.clearAllMocks();
  });

  it('initializes with current online status', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });

    const newMonitor = new ConnectionMonitor();
    expect(newMonitor.getStatus()).toBe(true);
  });

  it('handles online event', () => {
    const callback = jest.fn();
    monitor.onStatusChange(callback);

    // Simulate online event
    window.dispatchEvent(new Event('online'));

    expect(callback).toHaveBeenCalledWith(true);
  });

  it('handles offline event', () => {
    const callback = jest.fn();
    monitor.onStatusChange(callback);

    // Simulate offline event
    window.dispatchEvent(new Event('offline'));

    expect(callback).toHaveBeenCalledWith(false);
  });

  it('allows unsubscribing from status changes', () => {
    const callback = jest.fn();
    const unsubscribe = monitor.onStatusChange(callback);

    // Unsubscribe
    unsubscribe();

    // Simulate online event
    window.dispatchEvent(new Event('online'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('checks connection with network request', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });

    const result = await monitor.checkConnection();
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/', {
      method: 'HEAD',
      cache: 'no-cache',
    });
  });

  it('handles connection check failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await monitor.checkConnection();
    expect(result).toBe(false);
  });
});

describe('Singleton instances', () => {
  it('exports singleton offline queue instance', () => {
    expect(offlineQueue).toBeInstanceOf(OfflineQueue);
  });

  it('exports singleton connection monitor instance', () => {
    expect(connectionMonitor).toBeInstanceOf(ConnectionMonitor);
  });
});