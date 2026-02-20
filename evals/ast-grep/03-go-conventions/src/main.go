package main

import (
	"fmt"
	"os"
)

// Reader defines a minimal read interface.
type Reader interface {
	Read(key string) (string, error)
}

// Writer defines a minimal write interface.
type Writer interface {
	Write(key, value string) error
}

// Deleter is an optional extension interface.
type Deleter interface {
	Delete(key string) error
}

// Compile-time interface checks.
var _ Reader = (*MapStore)(nil)
var _ Writer = (*MapStore)(nil)

// MapStore is a simple in-memory key-value store.
type MapStore struct {
	data map[string]string
}

func NewMapStore() *MapStore {
	return &MapStore{data: make(map[string]string)}
}

func (s *MapStore) Read(key string) (string, error) {
	val, ok := s.data[key]
	if !ok {
		return "", fmt.Errorf("key %q not found", key)
	}
	return val, nil
}

func (s *MapStore) Write(key, value string) error {
	s.data[key] = value
	return nil
}

func (s *MapStore) Delete(key string) error {
	delete(s.data, key)
	return nil
}

func main() {
	store := NewMapStore()

	if err := store.Write("greeting", "hello"); err != nil {
		fmt.Fprintf(os.Stderr, "write failed: %v\n", err)
		os.Exit(1)
	}

	val, err := store.Read("greeting")
	if err != nil {
		fmt.Fprintf(os.Stderr, "read failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("read:", val)

	// Two-value type assertion for optional interface
	if d, ok := Reader(store).(Deleter); ok {
		if err := d.Delete("greeting"); err != nil {
			fmt.Fprintf(os.Stderr, "delete failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("deleted greeting")
	}
}
