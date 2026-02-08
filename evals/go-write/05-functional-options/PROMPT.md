Write an HTTP client in Go using the functional options pattern for configuration.

Requirements:

- Define an `Option` interface with an unexported `apply(*options)` method.
  This prevents external packages from creating arbitrary options.
- Define an unexported `options` struct that holds all configurable values
  (e.g., timeout, retries, base URL).
- Create at least two `WithX` constructor functions (e.g., `WithTimeout`, `WithRetries`)
  that each return an `Option`.
- In the constructor (`NewClient`), set sensible default values for all options
  before iterating over the provided options with a `for ... range` loop.
- The constructor should accept variadic `...Option` as its last parameter.
- Accept `context.Context` as the first parameter in client methods that perform I/O.
- Include a `main` function that creates a client with several options applied.

Place all code in the `src/` directory.
