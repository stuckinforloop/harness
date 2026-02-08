# Dependency Direction

## Rules

- **Accept, don't instantiate.** Never create what you don't own inside your library. Accept dependencies as arguments so callers control lifecycle and implementation.
- **Accept interfaces, return structs.** Functions should take interface parameters (flexibility) and return concrete types (allows adding methods later without breaking).
- **Declare your own interfaces.** You can define an interface that existing types satisfy without modifying them. Use this to decouple from specific implementations.
- **Never return interfaces for core types.** Returning an interface for your main type prevents you from adding methods (interface modification is breaking). Return `*Client`, not `Client`.
- **Provide convenience constructors as wrappers.** If callers commonly open a file, wrap the general function: `ParseFile` calls `Parse(io.Reader)`.

## Patterns

### Instantiating Dependencies — Bad

```go
func New(fname string) (*Parser, error) {
    f, err := os.Open(fname) // library owns file I/O
    // ...
}
// Only works with disk files. Cannot use stdin, pipes, network.
// Tests must write real files to disk.
```

### Accepting Interfaces — Good

```go
func New(r io.Reader) (*Parser, error) {
    // works with files, buffers, network, pipes
    // trivial to test with strings.NewReader
}

// Convenience wrapper for the common case
func NewFromFile(name string) (*Parser, error) {
    f, err := os.Open(name)
    if err != nil {
        return nil, err
    }
    return New(f)
}
```

### Declaring Your Own Interface

```go
// Define what you need — os.File already satisfies this
type Source interface {
    io.Reader
    Name() string
}

var _ Source = (*os.File)(nil) // compile-time proof

func New(src Source) (*Parser, error) {
    // uses src.Read() and src.Name()
}
```

### Returning Interface — Bad

```go
type Client interface {
    Get(key string) ([]byte, error)
    Set(key string, val []byte) error
}

func New(addr string) Client { // returns interface
    return &clientImpl{addr: addr}
}
// Cannot add Delete() method later — breaks the interface contract.
```

### Returning Struct — Good

```go
type Client struct {
    addr string
}

func New(addr string) *Client {
    return &Client{addr: addr}
}

func (c *Client) Get(key string) ([]byte, error) { ... }
func (c *Client) Set(key string, val []byte) error { ... }

// v2: add method freely — callers aren't locked to an interface
func (c *Client) Delete(key string) error { ... }
```

### Testing Without the Interface

```go
// Callers who need mocking define their own interface
type Getter interface {
    Get(key string) ([]byte, error)
}

// *Client satisfies Getter without any changes to the library
func NewHandler(store Getter) *Handler { ... }
```

## Checklist

- [ ] Library never calls `os.Open`, `http.DefaultClient`, or similar — accepts dependencies
- [ ] Public functions accept interfaces for complex dependencies
- [ ] Public functions return concrete structs for core types, not interfaces
- [ ] Convenience constructors (e.g., `NewFromFile`) are thin wrappers around the general form
- [ ] Custom interfaces are verified at compile time: `var _ I = (*T)(nil)`
- [ ] Callers can mock any dependency by defining their own interface
