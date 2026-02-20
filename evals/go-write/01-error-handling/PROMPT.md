Write a `UserService` in Go with `Create`, `Get`, `Update`, and `Delete` methods
that call an external API client. Use proper error handling conventions.

Requirements:

- Define an `APIClient` interface that the `UserService` depends on.
- Define appropriate sentinel errors (e.g., `ErrNotFound`, `ErrAlreadyExists`)
  as package-level variables using `errors.New`.
- Define a custom error type where additional context is needed (e.g., `ValidationError`).
  It must implement `Error() string` and `Unwrap() error`.
- Wrap errors from the API client using `fmt.Errorf` with the `%w` verb.
  Messages should be lowercase and not start with "failed to".
- Use `errors.Is` or `errors.As` to check error types in the `main` function.
- Avoid the double-handling anti-pattern: do not both log and return the same error.
- Include a `main` function that demonstrates constructing the service and handling errors.

Place all code in the `src/` directory.
