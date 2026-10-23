\# Test Execution Report — Hotel Booking API



\## 1. Overview



\*\*Project:\*\* Hotel Booking API  

\*\*Test type:\*\* API functional testing  

\*\*Execution date:\*\* 22 October 2026  

\*\*Automation framework:\*\* Mocha  

\*\*HTTP testing library:\*\* Supertest  

\*\*Assertion library:\*\* Node.js `assert/strict`



\## 2. Test Environment



\- Runtime: Node.js

\- Application framework: Express

\- Test command: `npx mocha .\\tests\\api.test.js`

\- Seed configuration: `SEED=true`

\- Test file: `tests/api.test.js`



\## 3. Execution Summary



| Metric | Result |

|---|---:|

| Total tests | 8 |

| Passed | 5 |

| Failed | 3 |

| Pass rate | 62.5% |

| Defects identified | 3 |



\## 4. Detailed Results



| Test ID | Scenario | Result | Observation |

|---|---|---|---|

| TC-01 | Health endpoint | Failed | Returned 201 instead of expected 200 |

| TC-02 | Login with valid credentials | Passed | Token returned successfully |

| TC-03 | Login with invalid credentials | Failed | Returned 200 instead of expected 401 |

| TC-04 | Retrieve reservations list | Passed | HTTP 200 and array returned |

| TC-05 | Retrieve existing reservation | Passed | HTTP 200 and reservation returned |

| TC-06 | Retrieve non-existent reservation | Passed | HTTP 404 returned |

| TC-07 | Create reservation with invalid data | Failed | Returned 500 instead of expected 400 |

| TC-08 | Create reservation with valid data | Passed | Reservation created successfully |



\## 5. Defect Summary



\- \*\*BR-01:\*\* `GET /health` returns HTTP 201 instead of HTTP 200.

\- \*\*BR-02:\*\* `POST /login` returns HTTP 200 for invalid credentials instead of HTTP 401.

\- \*\*BR-03:\*\* `POST /reservations` returns HTTP 500 for invalid input instead of HTTP 400.



See `bug-reports.md` for reproduction steps, expected results, actual results and impact.



\## 6. Conclusion



The automated tests verified several core API behaviors, including successful authentication, retrieving reservations, handling a non-existent reservation and creating a reservation with valid data.



Three discrepancies between the observed API responses and the documented expected behavior were identified. These concern HTTP status codes for the health endpoint, failed authentication and invalid reservation input.



The application source code was not modified during testing.



\## 7. Reproduction



From the project root, install dependencies if necessary and execute:



```powershell

npm install

$env:SEED = "true"

npx mocha .\\tests\\api.test.js

```



The three failing tests are intentional checks against the documented API behavior. Their failures should remain visible until the corresponding application defects are fixed and retested.

## Manual Testing Results — Postman

**Execution date:** 23 October 2026  
**Tool:** Postman

| Test ID | Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| MT-01 | Get all reservations | 200 OK | 200 OK | Passed |
| MT-02 | Get an existing reservation | 200 OK | 200 OK | Passed |
| MT-03 | Get a non-existent reservation | 404 Not Found | 404 Not Found | Passed |
| MT-04 | Create a reservation with valid data | 200 OK | 200 OK | Passed |
| MT-05 | Create a reservation without firstName | 400 Bad Request | 500 Internal Server Error | Failed |

### Manual Testing Summary
- Total manual tests: 5
- Passed: 4
- Failed: 1
- Defect observed: BR-03

The manual test MT-05 reproduced the same validation defect identified by automated test TC-07. It is one defect observed through two testing methods, not two separate defects.

### Overall QA Summary
- Automated tests: 8 total, 5 passed, 3 failed.
- Manual Postman tests: 5 total, 4 passed, 1 failed.
- Unique defects identified: 3 (BR-01, BR-02, BR-03).

