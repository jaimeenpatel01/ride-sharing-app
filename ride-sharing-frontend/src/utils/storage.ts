import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache to reduce AsyncStorage reads
const cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  serialize?: boolean; // Whether to JSON.stringify the value
}

class OptimizedStorage {
  private static instance: OptimizedStorage;

  static getInstance(): OptimizedStorage {
    if (!OptimizedStorage.instance) {
      OptimizedStorage.instance = new OptimizedStorage();
    }
    return OptimizedStorage.instance;
  }

  // Get item with optional caching
  async getItem<T = string>(
    key: string, 
    options: StorageOptions = { ttl: DEFAULT_TTL, serialize: true }
  ): Promise<T | null> {
    try {
      // Check cache first
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.value as T;
      }

      // Fetch from AsyncStorage
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      const parsedValue = options.serialize ? JSON.parse(value) : value;
      
      // Cache the result
      cache.set(key, {
        value: parsedValue,
        timestamp: Date.now(),
        ttl: options.ttl || DEFAULT_TTL
      });

      return parsedValue as T;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  // Set item with automatic caching
  async setItem(
    key: string, 
    value: any, 
    options: StorageOptions = { ttl: DEFAULT_TTL, serialize: true }
  ): Promise<boolean> {
    try {
      const stringValue = options.serialize ? JSON.stringify(value) : value;
      await AsyncStorage.setItem(key, stringValue);
      
      // Update cache
      cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: options.ttl || DEFAULT_TTL
      });

      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  // Remove item from both storage and cache
  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      cache.delete(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  // Batch operations for better performance
  async multiGet(keys: string[]): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {};
      const keysToFetch: string[] = [];
      
      // Check cache first
      for (const key of keys) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          result[key] = cached.value;
        } else {
          keysToFetch.push(key);
        }
      }

      // Fetch remaining keys from AsyncStorage
      if (keysToFetch.length > 0) {
        const pairs = await AsyncStorage.multiGet(keysToFetch);
        for (const [key, value] of pairs) {
          if (value !== null) {
            try {
              const parsedValue = JSON.parse(value);
              result[key] = parsedValue;
              
              // Cache the result
              cache.set(key, {
                value: parsedValue,
                timestamp: Date.now(),
                ttl: DEFAULT_TTL
              });
            } catch {
              result[key] = value;
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error in multiGet:', error);
      return {};
    }
  }

  async multiSet(keyValuePairs: Array<[string, any]>): Promise<boolean> {
    try {
      const stringPairs = keyValuePairs.map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value)
      ]);

      await AsyncStorage.multiSet(stringPairs as Array<[string, string]>);
      
      // Update cache
      for (const [key, value] of keyValuePairs) {
        cache.set(key, {
          value,
          timestamp: Date.now(),
          ttl: DEFAULT_TTL
        });
      }

      return true;
    } catch (error) {
      console.error('Error in multiSet:', error);
      return false;
    }
  }

  // Clear all storage and cache
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      cache.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Get all keys
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  // Cache management
  clearCache(): void {
    cache.clear();
  }

  getCacheSize(): number {
    return cache.size;
  }

  // Cleanup expired cache entries
  cleanupCache(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
}

// Convenience methods for common auth operations
export const AuthStorage = {
  async getToken(): Promise<string | null> {
    return OptimizedStorage.getInstance().getItem<string>('token', { ttl: 60 * 60 * 1000 }); // 1 hour
  },

  async setToken(token: string): Promise<boolean> {
    return OptimizedStorage.getInstance().setItem('token', token, { ttl: 60 * 60 * 1000 });
  },

  async getRole(): Promise<string | null> {
    return OptimizedStorage.getInstance().getItem<string>('role', { ttl: 60 * 60 * 1000 });
  },

  async setRole(role: string): Promise<boolean> {
    return OptimizedStorage.getInstance().setItem('role', role, { ttl: 60 * 60 * 1000 });
  },

  async getUserData(): Promise<any> {
    return OptimizedStorage.getInstance().getItem('userData', { ttl: 30 * 60 * 1000 }); // 30 minutes
  },

  async setUserData(userData: any): Promise<boolean> {
    return OptimizedStorage.getInstance().setItem('userData', userData, { ttl: 30 * 60 * 1000 });
  },

  async clearAuth(): Promise<boolean> {
    const storage = OptimizedStorage.getInstance();
    const results = await Promise.all([
      storage.removeItem('token'),
      storage.removeItem('role'),
      storage.removeItem('userData')
    ]);
    return results.every(result => result);
  }
};

// Auto cleanup every 10 minutes
setInterval(() => {
  const removed = OptimizedStorage.getInstance().cleanupCache();
  if (removed > 0) {
    console.log(`Cleaned up ${removed} expired cache entries`);
  }
}, 10 * 60 * 1000);

export default OptimizedStorage.getInstance();