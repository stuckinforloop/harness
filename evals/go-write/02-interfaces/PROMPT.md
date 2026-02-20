Write a `Storage` abstraction in Go that demonstrates proper interface design patterns.

Requirements:

- Define a small `Storage` interface with at most 3 methods for key-value operations
  (e.g., `Get`, `Put`, `Delete`).
- Implement the interface with a `FileStorage` concrete type.
- Add a compile-time compliance check: `var _ Storage = (*FileStorage)(nil)`.
- Define the interface in the package that consumes it (consumer-side definition).
- Functions should accept interfaces and return concrete structs
  (accept-interface-return-struct pattern).
- Define an optional `Lister` extension interface that adds listing capability.
  Use a two-value type assertion (`v, ok := x.(Lister)`) to check if a `Storage`
  also implements `Lister` (upcasting pattern).
- Use an unexported mutex field (`mu sync.Mutex`) in `FileStorage` — do not embed the mutex.
- Include a `main` function that demonstrates usage.

Place all code in the `src/` directory.
