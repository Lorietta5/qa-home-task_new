\# Bug Reports — Hotel Booking API



\## BR-01: GET /health returns HTTP 201 instead of 200



\*\*Severity:\*\* Low  

\*\*Priority:\*\* Medium  

\*\*Component:\*\* Health endpoint  

\*\*Type:\*\* API / Status code



\*\*Preconditions:\*\* The API application is running.



\*\*Steps to reproduce:\*\*

1\. Send a GET request to `/health`.

2\. Check the HTTP response status code.



\*\*Expected result:\*\* HTTP 200 OK, as specified in the API documentation.



\*\*Actual result:\*\* HTTP 201 Created.



\*\*Impact:\*\* Monitoring systems or automated health checks that expect HTTP 200 may incorrectly interpret the endpoint response.



\*\*Evidence:\*\* Automated test TC-01 failed: expected 200, actual 201.



\---



\## BR-02: POST /login returns HTTP 200 for invalid credentials



\*\*Severity:\*\* Medium  

\*\*Priority:\*\* High  

\*\*Component:\*\* Authentication  

\*\*Type:\*\* API / Status code



\*\*Preconditions:\*\* The API application is running.



\*\*Steps to reproduce:\*\*

1\. Send a POST request to `/login`.

2\. Submit the username `manager` and an incorrect password, such as `WrongPassword`.

3\. Check the HTTP status code and response body.



\*\*Expected result:\*\* HTTP 401 Unauthorized and a response containing the reason `Bad credentials`, as specified in the API documentation.



\*\*Actual result:\*\* HTTP 200 OK with the response body `{"reason":"Bad credentials"}`.



\*\*Impact:\*\* Clients and integrations that rely on HTTP status codes may incorrectly interpret a failed authentication attempt as a successful HTTP request.



\*\*Evidence:\*\* Automated test TC-03 failed: expected 401, actual 200.



\---



\## BR-03: POST /reservations returns HTTP 500 instead of 400 for an invalid payload



\*\*Severity:\*\* Medium  

\*\*Priority:\*\* High  

\*\*Component:\*\* Reservation creation / Input validation  

\*\*Type:\*\* API / Error handling



\*\*Preconditions:\*\*

\- The API application is running.

\- Valid authentication credentials are available: `manager` / `Hotel2024!`.



\*\*Steps to reproduce:\*\*

1\. Send a POST request to `/reservations`.

2\. Authenticate using Basic Auth with username `manager` and password `Hotel2024!`.

3\. Submit a JSON payload with an empty `firstName` and otherwise valid required fields.

4\. Check the HTTP status code.



\*\*Expected result:\*\* HTTP 400 Bad Request for invalid input, as specified in the API documentation.



\*\*Actual result:\*\* HTTP 500 Internal Server Error.



\*\*Impact:\*\* Invalid client input is reported as a server error, making troubleshooting less clear and potentially misleading API consumers and monitoring systems.



\*\*Evidence:\*\* Automated test TC-07 failed: expected 400, actual 500. The validation rules explicitly reject an empty `firstName`.



\---



\## Summary



Three defects were identified during API testing:



\- BR-01: Incorrect HTTP status code from the health endpoint.

\- BR-02: Incorrect HTTP status code for failed authentication.

\- BR-03: Incorrect HTTP status code for invalid reservation data.



The defects were identified by automated tests TC-01, TC-03 and TC-07. No application source code was modified during testing.

