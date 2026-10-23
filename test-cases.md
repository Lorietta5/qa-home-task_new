\# Test Cases — Hotel Booking API



\*\*Project:\*\* Hotel Booking API  

\*\*Test type:\*\* API / Functional testing  

\*\*Test approach:\*\* Manual and automated testing



\## TC-01: Verify health endpoint



\*\*Priority:\*\* Medium  

\*\*Type:\*\* Positive



\*\*Preconditions:\*\* API is running.



\*\*Steps:\*\*

1\. Send GET request to `/health`.

2\. Check the HTTP status code.



\*\*Expected result:\*\* HTTP 200 OK.



\*\*Actual result:\*\* HTTP 201 Created.



\*\*Status:\*\* Failed — BR-01.



\---



\## TC-02: Login with valid credentials



\*\*Priority:\*\* High  

\*\*Type:\*\* Positive



\*\*Preconditions:\*\* API is running; valid credentials are available.



\*\*Steps:\*\*

1\. Send POST request to `/login`.

2\. Submit username `manager` and password `Hotel2024!`.

3\. Check the status code and response body.



\*\*Expected result:\*\* HTTP 200 OK; response contains a non-empty token.



\*\*Actual result:\*\* HTTP 200 OK; a non-empty token was returned.



\*\*Status:\*\* Passed.



\---



\## TC-03: Login with invalid credentials



\*\*Priority:\*\* High  

\*\*Type:\*\* Negative



\*\*Preconditions:\*\* API is running.



\*\*Steps:\*\*

1\. Send POST request to `/login`.

2\. Submit username `manager` and password `WrongPassword`.

3\. Check the status code and response body.



\*\*Expected result:\*\* HTTP 401 Unauthorized; response indicates `Bad credentials`.



\*\*Actual result:\*\* HTTP 200 OK; response body contains `{"reason":"Bad credentials"}`.



\*\*Status:\*\* Failed — BR-02.



\---



\## TC-04: Retrieve the reservations list



\*\*Priority:\*\* High  

\*\*Type:\*\* Positive



\*\*Preconditions:\*\* API is running.



\*\*Steps:\*\*

1\. Send GET request to `/reservations`.

2\. Check the status code and response body.



\*\*Expected result:\*\* HTTP 200 OK; response body is an array.



\*\*Actual result:\*\* HTTP 200 OK; response body is an array.



\*\*Status:\*\* Passed.



\---



\## TC-05: Retrieve an existing reservation



\*\*Priority:\*\* High  

\*\*Type:\*\* Positive



\*\*Preconditions:\*\* Reservation with ID `1` exists; JSON response is requested.



\*\*Steps:\*\*

1\. Send GET request to `/reservations/1`.

2\. Set the `Accept` header to `application/json`.

3\. Check the status code and response body.



\*\*Expected result:\*\* HTTP 200 OK; reservation data is returned.



\*\*Actual result:\*\* HTTP 200 OK; a reservation was returned.



\*\*Status:\*\* Passed.



\---



\## TC-06: Retrieve a non-existent reservation



\*\*Priority:\*\* Medium  

\*\*Type:\*\* Negative



\*\*Preconditions:\*\* API is running; reservation ID `99999` does not exist.



\*\*Steps:\*\*

1\. Send GET request to `/reservations/99999`.

2\. Check the HTTP status code.



\*\*Expected result:\*\* HTTP 404 Not Found.



\*\*Actual result:\*\* HTTP 404 Not Found.



\*\*Status:\*\* Passed.



\---



\## TC-07: Create a reservation with an empty first name



\*\*Priority:\*\* High  

\*\*Type:\*\* Negative



\*\*Preconditions:\*\* API is running; valid Basic Auth credentials are available.



\*\*Steps:\*\*

1\. Send POST request to `/reservations`.

2\. Authenticate using Basic Auth: `manager` / `Hotel2024!`.

3\. Submit a JSON payload with an empty `firstName` and valid values for the other required fields.

4\. Check the HTTP status code.



\*\*Expected result:\*\* HTTP 400 Bad Request.



\*\*Actual result:\*\* HTTP 500 Internal Server Error.



\*\*Status:\*\* Failed — BR-03.



\---



\## TC-08: Create a reservation with valid data



\*\*Priority:\*\* High  

\*\*Type:\*\* Positive



\*\*Preconditions:\*\* API is running; valid Basic Auth credentials are available.



\*\*Steps:\*\*

1\. Send POST request to `/reservations`.

2\. Authenticate using Basic Auth: `manager` / `Hotel2024!`.

3\. Submit a valid JSON payload containing first name, last name, price, deposit status and stay dates.

4\. Check the status code and returned reservation details.



\*\*Expected result:\*\* HTTP 200 OK; response contains a reservation ID and the created reservation details.



\*\*Actual result:\*\* HTTP 200 OK; the response contained a reservation ID and reservation details.



\*\*Status:\*\* Passed.



\---



\## Test execution summary



\- Total automated tests: 8

\- Passed: 5

\- Failed: 3

\- Defects identified: 3



\*\*Note:\*\* Expected results are based on the API documentation. Actual results are based on the observed automated test execution.

## Manual API Tests — Postman

### MT-01: Get all reservations
- **Method:** GET
- **Endpoint:** `/reservations`
- **Steps:** Send a GET request to `/reservations`.
- **Expected result:** `200 OK`; a list of reservations is returned.
- **Actual result:** `200 OK`.
- **Status:** Passed.

### MT-02: Get an existing reservation
- **Method:** GET
- **Endpoint:** `/reservations/2`
- **Steps:** Send a GET request to `/reservations/2`.
- **Expected result:** `200 OK`; reservation details are returned.
- **Actual result:** `200 OK`; reservation details were displayed.
- **Status:** Passed.

### MT-03: Get a non-existent reservation
- **Method:** GET
- **Endpoint:** `/reservations/99999`
- **Steps:** Send a GET request using a non-existent reservation ID.
- **Expected result:** `404 Not Found`.
- **Actual result:** `404 Not Found`.
- **Status:** Passed.

### MT-04: Create a reservation with valid data
- **Method:** POST
- **Endpoint:** `/reservations`
- **Authentication:** Basic Auth (`manager`)
- **Steps:** Send a POST request with valid reservation data in JSON format.
- **Expected result:** `200 OK`; the response contains a reservation ID and reservation details.
- **Actual result:** `200 OK`.
- **Status:** Passed.

### MT-05: Create a reservation without firstName
- **Method:** POST
- **Endpoint:** `/reservations`
- **Authentication:** Basic Auth (`manager`)
- **Steps:** Remove the required `firstName` field from the JSON request body and send the request.
- **Expected result:** `400 Bad Request`.
- **Actual result:** `500 Internal Server Error`.
- **Status:** Failed.
- **Related defect:** BR-03.

### Manual Test Summary
- Total manual tests: 5
- Passed: 4
- Failed: 1
- Defects observed: 1 (BR-03; same defect also identified by automated testing).
