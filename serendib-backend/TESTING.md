# Unit Testing Documentation

## Overview

The Serendib Hotel Management System includes a comprehensive test suite with 27 unit tests achieving 100% pass rate. Tests run in approximately 6 seconds using an in-memory SQLite database, providing fast feedback during development without requiring a MySQL server.

## Test Coverage

| Module | Tests | Status | Key Features |
|--------|-------|--------|--------------|
| Authentication | 12 | PASS | Registration, login, password change, profile access |
| Bookings | 3 | PASS | User bookings, creation, authorization |
| Facilities | 1 | PASS | Facility booking access control |
| Loyalty | 3 | PASS | Points status, tier management, promo validation |
| Payments | 2 | PASS | Authorization checks, Stripe API mocking |
| Rooms | 4 | PASS | Room listing, filtering, detail retrieval |
| Service Requests | 2 | PASS | Service types, request creation |

Total: 27 tests, all passing

## Quick Start

Run the complete test suite:

```bash
cd serendib-backend
./venv/Scripts/python -m pytest tests/ -v
```

Run a specific test file:

```bash
./venv/Scripts/python -m pytest tests/test_auth.py -v
```

Generate a coverage report:

```bash
./venv/Scripts/python -m pytest tests/ -v --cov=app --cov-report=term-missing
```

## Why These Tests Matter

Testing serves multiple purposes in software development. First, tests catch bugs before they reach users. A test that validates login behavior prevents authentication failures in production. Second, tests act as documentation; reading test code shows how the API works. Third, tests enable safe refactoring; if you change internal code but tests still pass, users experience no impact.

Consider a real scenario: a developer notices room availability checking is slow. They refactor the database query to improve performance. Because the room tests validate both correctness and behavior, the developer knows immediately whether the optimization broke anything. Without tests, they would only discover problems after users complained.

## Test Architecture

### In-Memory Database Approach

Tests use SQLite in-memory mode rather than MySQL. This delivers three advantages: tests run in milliseconds instead of seconds because there is no network I/O, each test starts fresh preventing pollution from previous tests, and you need no database server installed. The tradeoff involves minor differences in how SQLite handles certain SQL features compared to MySQL. However, application logic lives above these database differences, so test results transfer reliably to production.

### Configuration and Warnings

The pytest.ini file configures test behavior automatically. It suppresses deprecation warnings about SQLAlchemy and Python features that work fine but show messages about future changes. Without this configuration, you would see dozens of warning lines per test run, making it hard to spot actual failures. The configuration keeps output focused on what matters: test results.

### Fixtures for Setup

Test fixtures in conftest.py create consistent test data. Rather than each test building its own user, room, and booking data, fixtures provide these ready to use. This approach saves time and prevents subtle differences between tests caused by manual data creation. When you add new tests, you inherit these fixtures automatically.

## Common Test Patterns

### Testing Authentication

Tests verify that protected endpoints require valid JWT tokens. An unauthenticated request returns status 401. An authenticated request with valid credentials returns 200 and data. This pattern appears throughout the test suite whenever authorization matters.

### Testing Resource Creation

Tests verify that creating a resource returns success status and response data containing the created resource. They also verify that invalid data returns appropriate error codes, helping developers understand what went wrong.

### Testing Access Control

Tests confirm that guests see only their own data, staff see their department, and admins see everything. These tests catch authorization logic bugs that could expose sensitive information.

## Extending the Test Suite

When you add new API endpoints or modify existing ones, add corresponding tests. The pattern is straightforward:

1. Name the test file test_[feature].py
2. Create a test class TestFeatureName
3. Add test methods with descriptive names
4. Use fixtures from conftest.py
5. Assert that response status codes match expectations
6. Assert that response data contains expected fields

Here is an example:

```python
def test_update_room_price(self, client, db_session, sample_room, admin_auth_headers):
    """Admins should be able to update room prices."""
    response = client.put(f'/api/rooms/{sample_room.id}',
        headers=admin_auth_headers,
        json={'price_per_night': 15000}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['room']['price_per_night'] == 15000
```

## Continuous Integration

These tests run automatically in CI/CD pipelines. Add them to your workflow to catch bugs before code reaches production. A typical pipeline step looks like:

```yaml
- name: Run Tests
  run: |
    cd serendib-backend
    pip install -r requirements.txt
    python -m pytest tests/ -v --cov=app
```

This ensures every commit includes passing tests, preventing broken code from merging to main.

## Performance Characteristics

The test suite completes in 6-7 seconds on typical hardware. This speed matters; developers who can run the full test suite in under ten seconds are more likely to run tests frequently. Frequent testing catches mistakes early when they are cheapest to fix.

If you add many more tests and speed becomes important, profile the test run to identify slow tests. Some tests might use complex fixtures or make many database queries. Optimizing those tests maintains the fast feedback cycle developers depend on.

## Troubleshooting

If tests fail after your changes, here are steps to diagnose the issue:

1. Run the specific failing test to see the error message
2. Check that your test fixture setup is correct
3. Verify that your API endpoint implementation matches the test expectations
4. Use print() statements or a debugger to understand state during test execution
5. Check that database migrations are applied

Most test failures come from either missing fixtures or mismatched status codes between the test expectation and actual response.

## References

For more information on testing practices, see the detailed documentation in [tests/README.md](./README.md) and the test results summary in [TEST_RESULTS.md](./TEST_RESULTS.md).
