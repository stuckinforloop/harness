Write a Go package that implements a safe `ConfigStore` for managing typed
configuration values.

Requirements:

- Define a `ConfigStore` struct that holds configuration in an internal `map[string]any`.
- Use two-value type assertions (`v, ok := x.(T)`) everywhere — never bare assertions.
- Copy slices and maps defensively at struct boundaries: copy when receiving in the
  constructor and copy when returning from getter methods.
- Do not use `panic` or `os.Exit` outside of the `main` function.
- Do not define mutable package-level variables (sentinel errors with `errors.New` are fine).
- Add a compile-time interface check (`var _ I = (*T)(nil)`) for at least one interface.
- Use `defer` immediately after resource acquisition (e.g., mutex lock/unlock).
- Define an exported `Config` struct with JSON struct field tags for marshaling.
- Include a `main` function that demonstrates `ConfigStore` usage, including type
  assertion and defensive copy behavior.

Place all code in the `src/` directory.
