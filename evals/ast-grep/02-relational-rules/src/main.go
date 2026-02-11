package main

import (
	"errors"
	"fmt"
	"os"
	"sync"
)

// ErrShutdown signals the service is shutting down.
var ErrShutdown = errors.New("service is shutting down")

// SafeCache is a thread-safe cache with unexported mutex.
type SafeCache struct {
	mu    sync.RWMutex
	items map[string]string
}

func NewSafeCache() *SafeCache {
	return &SafeCache{items: make(map[string]string)}
}

func (c *SafeCache) Get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.items[key]
	return val, ok
}

func (c *SafeCache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = value
}

func (c *SafeCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// processItem does work on a single item — library code, no panic or os.Exit.
func processItem(cache *SafeCache, key, value string) error {
	if key == "" {
		return fmt.Errorf("process item: %w", errors.New("empty key"))
	}
	cache.Set(key, value)
	return nil
}

// validateKey checks key format — library code, returns errors.
func validateKey(key string) error {
	if len(key) > 128 {
		return fmt.Errorf("validate key: %w", errors.New("key too long"))
	}
	return nil
}

func main() {
	cache := NewSafeCache()

	keys := []string{"alpha", "beta", "gamma"}
	for _, k := range keys {
		if err := validateKey(k); err != nil {
			fmt.Fprintf(os.Stderr, "invalid key: %v\n", err)
			os.Exit(1)
		}
		if err := processItem(cache, k, "value-"+k); err != nil {
			panic(fmt.Sprintf("unexpected error: %v", err))
		}
	}

	for _, k := range keys {
		val, ok := cache.Get(k)
		if !ok {
			fmt.Fprintf(os.Stderr, "missing key: %s\n", k)
			os.Exit(1)
		}
		fmt.Printf("%s = %s\n", k, val)
	}
}
