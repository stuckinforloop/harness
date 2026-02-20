package main

import (
	"errors"
	"fmt"
	"os"
)

// Sentinel errors using errors.New
var (
	ErrNotFound     = errors.New("resource not found")
	ErrUnauthorized = errors.New("unauthorized access")
	ErrConflict     = errors.New("resource already exists")
)

// ValidationError provides structured error context.
type ValidationError struct {
	Field   string
	Message string
	Err     error
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation: %s — %s", e.Field, e.Message)
}

func (e *ValidationError) Unwrap() error {
	return e.Err
}

// Repository defines the data access interface.
type Repository interface {
	FindByID(id string) (string, error)
	Save(id, value string) error
}

// Service wraps a Repository with business logic.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Get(id string) (string, error) {
	val, err := s.repo.FindByID(id)
	if err != nil {
		return "", fmt.Errorf("get %s: %w", id, err)
	}
	return val, nil
}

func (s *Service) Create(id, value string) error {
	if id == "" {
		return &ValidationError{Field: "id", Message: "must not be empty", Err: ErrConflict}
	}
	if err := s.repo.Save(id, value); err != nil {
		return fmt.Errorf("create %s: %w", id, err)
	}
	return nil
}

// inMemoryRepo is a simple in-memory implementation.
type inMemoryRepo struct {
	data map[string]string
}

func (r *inMemoryRepo) FindByID(id string) (string, error) {
	val, ok := r.data[id]
	if !ok {
		return "", ErrNotFound
	}
	return val, nil
}

func (r *inMemoryRepo) Save(id, value string) error {
	if _, exists := r.data[id]; exists {
		return ErrConflict
	}
	r.data[id] = value
	return nil
}

func main() {
	repo := &inMemoryRepo{data: make(map[string]string)}
	svc := NewService(repo)

	if err := svc.Create("user-1", "alice"); err != nil {
		fmt.Fprintf(os.Stderr, "create failed: %v\n", err)
		os.Exit(1)
	}

	val, err := svc.Get("user-1")
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			fmt.Println("not found")
		} else {
			fmt.Fprintf(os.Stderr, "get failed: %v\n", err)
			os.Exit(1)
		}
	} else {
		fmt.Println("got:", val)
	}

	_, err = svc.Get("missing")
	if err != nil {
		var ve *ValidationError
		if errors.As(err, &ve) {
			fmt.Printf("validation error on field %s\n", ve.Field)
		} else if errors.Is(err, ErrNotFound) {
			fmt.Println("correctly identified as not found")
		}
	}
}
