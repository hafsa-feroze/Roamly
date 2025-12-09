# Possible Viva Questions - Roamly Project

## 📋 **PROJECT OVERVIEW**

1. **What is your project about?**
   - *Expected Answer: Roamly is a resort booking platform where customers can book hotels and adventure resorts. Companies can manage their resorts, and admins can oversee all registered companies.*

2. **What is the tech stack used in this project?**
   - *Expected Answer: Frontend - React.js with hooks (useState, useEffect), Axios for API calls, React Router for routing. Backend - FastAPI (Python), SQLAlchemy ORM, PostgreSQL database, bcrypt for password hashing.*

3. **What are the three types of users in your system?**
   - *Expected Answer: Customer, Company, and Admin. Each has different roles and access to different features.*

4. **Explain the architecture of your application (frontend-backend separation).**
   - *Expected Answer: React frontend running on port 3000 communicates with FastAPI backend on port 8000 via REST APIs. Frontend makes HTTP requests (GET, POST, PUT, DELETE) to backend endpoints.*

---

## 🎨 **FRONTEND (React.js)**

5. **Why did you choose React over other frameworks?**
   - *Expected Answer: React is component-based, has a large ecosystem, hooks simplify state management, and it's widely used in industry.*

6. **Explain what React Hooks are and which ones you used.**
   - *Expected Answer: Hooks allow functional components to use state and lifecycle features. Used: useState (state management), useEffect (side effects/data fetching), useNavigate (routing), useRef (DOM references).*

7. **What is useEffect and why is it important in your project?**
   - *Expected Answer: useEffect runs side effects after render. Used for: fetching data on component mount (blogs, bookings, resorts), setting up event listeners, polling notifications every 30 seconds, cleanup operations.*

8. **How do you manage state in your React components?**
   - *Expected Answer: Using useState hook. Each component maintains its own local state (e.g., resorts array, loading status, form data). Also uses localStorage for persisting user authentication data.*

9. **Explain the routing structure in your application.**
   - *Expected Answer: React Router handles routes - / (intro), /login, /signup, /dashboard. DashboardPage conditionally renders different components based on user type (Customer/Company/Admin).*

10. **How does the dashboard routing work for different user types?**
    - *Expected Answer: DashboardPage checks localStorage for user_type, then renders appropriate tabs and content. Companies see: My Resorts, My Blogs, Bookings, Notifications. Customers see: Home, Bookings, Profile. Admins see: Registered Companies, Profile.*

11. **How do you handle form submissions in React?**
    - *Expected Answer: Using controlled components - form inputs are bound to state via value and onChange. onSubmit handler prevents default, makes API call using axios, then updates state or navigates.*

12. **What is the purpose of localStorage in your project?**
    - *Expected Answer: Stores user authentication data (user_id, user_name, user_email, user_type) after login/signup. Persists across page refreshes. Cleared on logout.*

13. **How do you handle API calls from the frontend?**
    - *Expected Answer: Using axios library. Makes GET/POST/PUT/DELETE requests to http://localhost:8000 endpoints. Handles responses and errors with try-catch blocks.*

14. **Explain how the search functionality works in the user dashboard.**
    - *Expected Answer: User types in search bar, onChange updates searchQuery state, filteredResorts computed by filtering resorts array by name, city, or company_name matching search query.*

15. **How does the notification polling work in DashboardPage?**
    - *Expected Answer: useEffect sets up setInterval to fetch notification count every 30 seconds. Also listens to custom 'notificationCountUpdated' event. Cleanup function clears interval on unmount.*

---

## 🔧 **BACKEND (FastAPI)**

16. **Why did you choose FastAPI over Flask or Django?**
    - *Expected Answer: FastAPI is modern, fast, has automatic API documentation, type hints with Pydantic, async support, and built-in data validation.*

17. **What is FastAPI and how is it different from REST APIs?**
    - *Expected Answer: FastAPI is a web framework for building APIs. It follows REST principles but adds automatic OpenAPI/Swagger docs, type validation, and modern Python features. REST is an architectural style, FastAPI is an implementation.*

18. **Explain the CORS configuration in your backend.**
    - *Expected Answer: CORS middleware allows requests from http://localhost:3000 and http://127.0.0.1:3000 (frontend origins). Without this, browser blocks cross-origin requests due to same-origin policy.*

19. **What is dependency injection and how is it used in FastAPI?**
    - *Expected Answer: get_db() dependency creates a database session for each request. FastAPI automatically provides it to endpoints via Depends(get_db). Ensures proper session lifecycle (yield creates, finally closes).*

20. **Explain the request/response models (Pydantic).**
    - *Expected Answer: Pydantic BaseModel classes (SignupRequest, LoginRequest, BookingRequest) validate incoming data, ensure correct types, and provide automatic documentation. Example: SignupRequest validates email format, ensures required fields present.*

21. **How do you handle file uploads (images) in FastAPI?**
    - *Expected Answer: Using UploadFile and Form from fastapi. Files are saved to disk with UUID names, paths stored in database. Returns FileResponse for serving images.*

22. **Explain the booking creation endpoint step by step.**
    - *Expected Answer: 1) Validate request, 2) Check resort exists and is available, 3) Calculate total price, 4) Create Booking object, 5) db.add() - stage, 6) db.commit() - save, 7) db.refresh() - get DB-generated values, 8) Create notification, 9) Generate PDF, 10) Send email.*

23. **What is the purpose of db.refresh() after commit()?**
    - *Expected Answer: After commit, object might not have database-generated values (like booking_id). refresh() reloads object from database so we can access booking.booking_id for notification creation.*

24. **When and why do you use db.rollback()?**
    - *Expected Answer: Used in error handling (try-except blocks) to undo uncommitted changes. Example: If notification creation fails, rollback() ensures booking isn't saved with invalid state. Maintains data integrity.*

25. **How does the PDF generation work for bookings?**
    - *Expected Answer: Using FPDF library. Creates PDF with booking details, saves to /receipts folder with UUID filename, stores filename in booking.pdf_filename, endpoint serves PDF via FileResponse.*

26. **Explain the email sending functionality.**
    - *Expected Answer: Using smtplib. After booking creation, sends email with booking details and PDF attachment to customer. Uses environment variables for email credentials.*

---

## 🗄️ **DATABASE (SQLAlchemy & PostgreSQL)**

27. **Why did you use SQLAlchemy ORM?**
    - *Expected Answer: ORM maps Python classes to database tables, provides type safety, handles relationships easily, and abstracts SQL queries. Makes code more maintainable and database-agnostic.*

28. **Explain the database schema and main tables.**
    - *Expected Answer: users (id, name, email, password, type), resorts_with_image (id, name, company_id, city, country, price, status, type, image_name), bookings (id, resort_id, user_id, company_id, booking_date, quantity, total_price), blogs, notifications.*

29. **What are the relationships between User, Resort, and Booking?**
    - *Expected Answer: User has many Resorts (company_id foreign key), User has many Bookings (user_id), Resort has many Bookings (resort_id). Booking belongs to User (customer), Resort, and User (company).*

30. **Why do you use UUID instead of auto-increment integers for IDs?**
    - *Expected Answer: UUIDs are globally unique, harder to guess/enumerate, better for distributed systems, and don't expose business logic (like how many users exist).*

31. **Explain the use of enums in your database models.**
    - *Expected Answer: UserType (USER, COMPANY, ADMIN), ResortStatus (OPEN, FULL, CLOSED), ResortType (HOTEL, ADVENTURE). Enums ensure data consistency, prevent invalid values, and provide type safety.*

32. **How do you query aggregated data (revenue, counts)?**
    - *Expected Answer: Using SQLAlchemy func.sum() and func.count(). Example: func.sum(Booking.total_price) for revenue, func.count() for resort/booking counts. Applied with filter_by() for specific companies.*

33. **What is the purpose of db.add() vs db.commit()?**
    - *Expected Answer: add() stages object in session (pending state). commit() actually saves to database (persistent state). Multiple adds can be batched before single commit for efficiency.*

---

## 🔐 **AUTHENTICATION & SECURITY**

34. **How does user authentication work in your project?**
    - *Expected Answer: Signup creates user with hashed password. Login verifies email/password, returns user_id on success. Frontend stores user_id in localStorage. No JWT tokens used - session-based via localStorage.*

35. **Explain password hashing with bcrypt.**
    - *Expected Answer: bcrypt hashes passwords with salt before storing. hash_password() generates hash, verify_password() compares plain text to hash. Passwords never stored in plain text. Backward compatible - migrates old plain-text passwords.*

36. **What security measures have you implemented?**
    - *Expected Answer: Password hashing (bcrypt), CORS restrictions, input validation (Pydantic), SQL injection prevention (ORM parameterized queries), error handling without exposing sensitive info.*

37. **How do you ensure users only access their own data?**
    - *Expected Answer: Endpoints filter by user_id from request parameters. Companies only see their own resorts/bookings. Customers only see their bookings. Backend validates ownership before returning data.*

38. **What would you do to improve security?**
    - *Expected Answer: Implement JWT tokens instead of localStorage, add rate limiting, implement refresh tokens, add CSRF protection, use HTTPS in production, add input sanitization, implement proper session management.*

---

## 🔄 **API DESIGN**

39. **Explain RESTful API principles and how you applied them.**
    - *Expected Answer: REST uses HTTP methods (GET-read, POST-create, PUT-update, DELETE-delete). GET /resorts-with-image, POST /bookings, PUT /user/profile, DELETE /blogs/{id}. Uses resource-based URLs, stateless requests.*

40. **What are the main API endpoints in your backend?**
    - *Expected Answer: POST /signup, /login; GET /resorts-with-image, /bookings/user, /notifications; POST /bookings; PUT /user/profile, /user/password; DELETE /user/{id}, /blogs/{id}; GET /companies-with-revenue (admin).*

41. **How do you handle errors in your API?**
    - *Expected Answer: HTTPException with appropriate status codes (400-bad request, 401-unauthorized, 404-not found, 500-server error). Try-except blocks catch errors, return user-friendly messages. Database rollback on errors.*

42. **Explain the difference between GET, POST, PUT, DELETE.**
    - *Expected Answer: GET - retrieve data (idempotent), POST - create new resource, PUT - update existing resource, DELETE - remove resource. GET has no body, others send JSON in request body.*

---

## ⚡ **FEATURES & FUNCTIONALITY**

43. **How does the booking system work?**
    - *Expected Answer: Customer selects resort, chooses date and quantity. Frontend sends booking request. Backend validates, calculates price, creates booking record, generates notification for company, creates PDF receipt, sends email. Booking stored with resort_id, user_id, company_id.*

44. **Explain the notification system for companies.**
    - *Expected Answer: Created automatically when booking is made. Notification contains booking details, linked to booking_id. Companies see count badge on dashboard, can view/delete notifications. Polling updates count every 30 seconds.*

45. **How does the blog feature work?**
    - *Expected Answer: Companies create blogs with image and caption for specific resort. Stored in blogs table with resort_id and company_id. Customers can view blogs when clicking "View Blogs" on resort details. Blogs displayed in popup modal.*

46. **Explain the admin dashboard functionality.**
    - *Expected Answer: Admins see "Registered Companies" page. Displays company cards with name, total revenue, resort count, booking count. Search functionality. "View Resorts" button opens popup showing all resorts for that company with images.*

47. **How does the resort search and filtering work?**
    - *Expected Answer: User selects country first (country popup). Resorts fetched by country from backend. Then search bar filters locally by resort name, city, or company name. Real-time filtering as user types.*

48. **Explain the image upload and storage mechanism.**
    - *Expected Answer: Files uploaded via form, saved to /images or /blog-images folder with UUID filename. Image name stored in database. Frontend requests images via /images/{filename} endpoint, backend serves via FileResponse.*

---

## 🎯 **TECHNICAL DECISIONS**

49. **Why did you use PostgreSQL instead of SQLite or MySQL?**
    - *Expected Answer: PostgreSQL is production-ready, supports complex queries, has better concurrency, supports JSON/enums natively, widely used in production, good for scalability.*

50. **Why use axios instead of fetch API?**
    - *Expected Answer: Axios has simpler syntax, automatic JSON parsing, better error handling, request/response interceptors, supports timeouts, more features out of the box.*

51. **Why store images on filesystem instead of database?**
    - *Expected Answer: Filesystem is more efficient for large files, doesn't bloat database, easier to serve static files, better performance, can use CDN later. Database stores only filename/path.*

52. **Why use localStorage instead of sessionStorage?**
    - *Expected Answer: localStorage persists after browser close, maintains login state across sessions. sessionStorage clears on tab close - would require re-login each time. Better UX for authentication.*

---

## 🐛 **ERROR HANDLING & EDGE CASES**

53. **How do you handle API errors in the frontend?**
    - *Expected Answer: Try-catch blocks around axios calls. Error responses checked via err.response?.data?.detail. Error messages displayed to user. Loading states managed during API calls.*

54. **What happens if a booking fails halfway through (e.g., email fails)?**
    - *Expected Answer: Booking is already committed. Email failure is caught, logged, but doesn't rollback booking (notification creation has try-except with rollback, but booking commit happens before). Could improve with transaction management.*

55. **How do you handle image loading errors?**
    - *Expected Answer: onError handler on img tags hides image if loading fails. Graceful degradation - shows placeholder or no image rather than broken image icon.*

56. **What validation do you perform before creating a booking?**
    - *Expected Answer: Checks resort exists, is available (status not 'full' or 'closed'), quantity > 0, booking_date valid, user_id valid. Returns appropriate error if validation fails.*

---

## 🚀 **PROJECT STRUCTURE**

57. **Explain your project folder structure.**
    - *Expected Answer: Frontend in /frontend/src (pages, components, assets), backend in /backend (services/AuthServer, database/models). Separation of concerns - models, API endpoints, frontend pages, shared components.*

58. **Why separate models from API endpoints?**
    - *Expected Answer: Separation of concerns - models define data structure, endpoints handle business logic. Easier maintenance, reusability, follows MVC-like pattern. Models can be used by multiple endpoints.*

59. **How do you manage environment variables?**
    - *Expected Answer: Using .env file with python-dotenv. Stores DATABASE_URL, email credentials. Loaded in auth_server.py. Not committed to git (security).*

---

## 🔍 **ADVANCED QUESTIONS**

60. **How would you scale this application for production?**
    - *Expected Answer: Use cloud database (AWS RDS), CDN for images (CloudFront), load balancer, caching (Redis), JWT tokens, containerization (Docker), CI/CD pipeline, monitoring/logging, rate limiting, database indexing.*

61. **What database optimizations could you implement?**
    - *Expected Answer: Add indexes on frequently queried columns (email, company_id, resort_id, user_id). Use database connection pooling. Query optimization (avoid N+1 queries). Consider read replicas for heavy read operations.*

62. **How would you implement real-time notifications instead of polling?**
    - *Expected Answer: Use WebSockets (Socket.io) or Server-Sent Events (SSE). Backend pushes notifications to connected clients. More efficient than polling, instant updates, reduces server load.*

63. **Explain how you would add pagination to resort listings.**
    - *Expected Answer: Backend accepts page and limit parameters. Query with LIMIT and OFFSET. Return total count along with data. Frontend implements pagination controls, requests specific pages.*

64. **How would you implement user roles and permissions more securely?**
    - *Expected Answer: Store roles in database, implement middleware to check permissions before endpoints. Use decorators or dependency injection for role-based access control. Validate permissions on both frontend and backend.*

65. **What testing would you add?**
    - *Expected Answer: Unit tests for business logic, integration tests for API endpoints, frontend component tests (Jest, React Testing Library), end-to-end tests (Cypress), database transaction tests.*

---

## 📝 **CODING QUESTIONS (Be Ready to Explain Code)**

66. **Explain this code snippet:**
   ```javascript
   useEffect(() => {
     fetchData()
     return () => clearInterval(interval)
   }, [])
   ```

67. **Explain this code:**
   ```python
   db.add(booking)
   db.commit()
   db.refresh(booking)
   ```

68. **Explain the password hashing function.**
   ```python
   def hash_password(password: str) -> str:
       hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
       return hashed.decode('utf-8')
   ```

69. **How does this filtering work?**
   ```javascript
   const filteredResorts = resorts.filter(r => 
     r.name?.toLowerCase().includes(query)
   )
   ```

70. **Explain the notification count polling logic in DashboardPage.**

---

## 🎓 **CONCEPTUAL QUESTIONS**

71. **What is the difference between state and props in React?**
   - *Expected Answer: State is internal to component, managed with useState, changes trigger re-render. Props are passed from parent, read-only, immutable. State for dynamic data, props for passing data down.*

72. **What is the difference between SQL and SQLAlchemy?**
   - *Expected Answer: SQL is query language. SQLAlchemy is Python ORM that generates SQL queries. ORM provides abstraction, type safety, relationships. SQL is direct database interaction.*

73. **What is CORS and why is it needed?**
   - *Expected Answer: Cross-Origin Resource Sharing. Browser security feature. Allows frontend (localhost:3000) to make requests to backend (localhost:8000) - different origins. Without CORS, browser blocks requests.*

74. **What is the difference between authentication and authorization?**
   - *Expected Answer: Authentication - verifying who you are (login). Authorization - checking what you can access (permissions). Your project: authentication via login, authorization via user_type checks.*

75. **Explain the concept of RESTful APIs.**
   - *Expected Answer: Architectural style for web services. Uses HTTP methods (GET, POST, PUT, DELETE), stateless, resource-based URLs, JSON data format. Follows principles of scalability, simplicity, reliability.*

---

## 💡 **PROJECT-SPECIFIC QUESTIONS**

76. **What was the most challenging part of this project?**
   - *Be ready to explain: Could be password hashing implementation, notification polling, image upload handling, routing logic, or database relationships.*

77. **What features would you add next?**
   - *Possible answers: Payment integration, reviews/ratings, favorite resorts, booking cancellation, advanced search filters, calendar availability, multi-language support, mobile app.*

78. **How does the revenue calculation work for admin?**
   - *Expected Answer: Aggregates sum of total_price from bookings table filtered by company_id. Uses SQLAlchemy func.sum() for each company. Displayed on Registered Companies page.*

79. **Explain the user flow from signup to booking.**
   - *Expected Answer: 1) Signup → 2) Login → 3) Select country → 4) View resorts → 5) Click "View Blogs" or "Book Resort" → 6) Fill booking form → 7) Submit → 8) Booking created, notification sent, email received → 9) View in Bookings page.*

80. **How would you improve the user experience?**
   - *Possible answers: Loading skeletons, better error messages, form validation feedback, image lazy loading, caching, optimistic UI updates, better mobile responsiveness.*

---

## 🎯 **PREPARATION TIPS**

1. **Practice explaining your code** - Be ready to explain any function/component
2. **Know the flow** - Understand complete user journeys end-to-end
3. **Be honest about limitations** - Admit what could be improved
4. **Show understanding** - Explain WHY you made choices, not just WHAT you did
5. **Demo ready** - Be prepared to run and demonstrate the application
6. **Code walkthrough** - Practice explaining key files like auth_server.py, DashboardPage.jsx

---

**Good Luck! 🚀**


