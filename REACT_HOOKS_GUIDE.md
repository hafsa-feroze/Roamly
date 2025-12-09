# React Hooks Usage in Roamly Project

## What are React Hooks?

**React Hooks** are special functions that let you "hook into" React features from functional components. They allow you to use state, side effects, and other React features without writing class components.

---

## Hook Types Used in This Project

### 1. **useState** - Managing Component State
**What it does:** Stores and updates component data that can change over time.

**Why it's used:** To manage dynamic values like form inputs, loading states, API data, etc.

**Example:**
```javascript
const [resorts, setResorts] = useState([])  // Stores array of resorts
const [loading, setLoading] = useState(true) // Stores loading status
const [searchQuery, setSearchQuery] = useState('') // Stores search text
```

---

### 2. **useEffect** - Handling Side Effects
**What it is:** A hook that runs code after the component renders or when certain values change.

**Why it's used:**
- Fetch data from API when component loads
- Set up event listeners
- Clean up resources (timers, subscriptions)
- React to changes in state/props

**Syntax:**
```javascript
useEffect(() => {
  // Code to run (side effect)
  
  return () => {
    // Cleanup function (optional)
  }
}, [dependencies]) // Dependency array
```

**Three ways to use it:**

1. **Run once on mount** (empty dependency array):
```javascript
useEffect(() => {
  fetchBlogs() // Runs only when component first loads
}, [])
```

2. **Run when dependencies change**:
```javascript
useEffect(() => {
  fetchNotificationCount() // Runs when isCompany or activeTab changes
}, [isCompany, activeTab])
```

3. **Run on every render** (no dependency array - rarely used):
```javascript
useEffect(() => {
  // Runs after every render
})
```

---

### 3. **useNavigate** - React Router Navigation
**What it does:** Provides navigation function to change routes programmatically.

**Why it's used:** To redirect users after login, signup, logout, etc.

**Example:**
```javascript
const navigate = useNavigate()
navigate('/dashboard') // Redirects to dashboard
```

---

### 4. **useRef** - Direct DOM Access
**What it does:** Creates a reference to a DOM element or stores mutable values.

**Why it's used:** To focus inputs, access DOM elements directly, or store values that don't trigger re-renders.

**Example:**
```javascript
const newPasswordInputRef = useRef(null)
// Later: newPasswordInputRef.current.focus()
```

---

### 5. **useCallback** - Memoizing Functions (Not actively used, but imported)
**What it does:** Returns a memoized version of a function to prevent unnecessary re-renders.

**Why it's used:** Performance optimization - prevents functions from being recreated on every render.

**Note:** This is imported in `DashboardProfile.jsx` but not currently used.

---

### 6. **useMemo** - Memoizing Values (Not actively used, but imported)
**What it does:** Returns a memoized value to prevent expensive recalculations.

**Why it's used:** Performance optimization for computed values.

**Note:** This is imported in `DashboardProfile.jsx` but not currently used.

---

## Where Hooks Are Used in This Project

### **Frontend Pages:**

#### 1. **`DashboardPage.jsx`** (Main Dashboard Container)
**Hooks used:**
- `useState`: `activeTab`, `notificationCount`
- `useEffect`: Fetches notification count for companies, sets up interval polling every 30 seconds, listens for notification updates
- `useNavigate`: For logout navigation

**Key useEffect:**
```javascript
useEffect(() => {
  if (isCompany) {
    const fetchNotificationCount = async () => {
      // Fetch notifications
    }
    fetchNotificationCount()
    const interval = setInterval(fetchNotificationCount, 30000) // Refresh every 30s
    
    window.addEventListener('notificationCountUpdated', handleNotificationUpdate)
    
    return () => {
      clearInterval(interval) // Cleanup: stop interval on unmount
      window.removeEventListener('notificationCountUpdated', handleNotificationUpdate) // Cleanup: remove listener
    }
  }
}, [isCompany, activeTab])
```

---

#### 2. **`DashboardHome.jsx`** (User Dashboard - Resort Display)
**Hooks used:**
- `useState`: 15+ state variables (showCountryPopup, selectedCountry, resorts, loading, booking states, etc.)
- `useEffect`: Closes dropdown when clicking outside

**Key useEffect:**
```javascript
useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDropdown && !event.target.closest('.country-input-wrapper')) {
      setShowDropdown(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  
  return () => {
    document.removeEventListener('mousedown', handleClickOutside) // Cleanup: remove event listener
  }
}, [showDropdown]) // Runs when showDropdown changes
```

---

#### 3. **`DashboardMyResorts.jsx`** (Company Resort Management)
**Hooks used:**
- `useState`: 25+ state variables (form data, images, dragging states, resorts list, etc.)
- `useEffect`: Fetches resorts and booking count on component mount

**Key useEffect:**
```javascript
useEffect(() => {
  fetchResorts()      // Load company's resorts
  fetchBookingCount() // Load booking statistics
}, []) // Empty array = runs once on mount
```

---

#### 4. **`DashboardMyBlogs.jsx`** (Company Blog Management)
**Hooks used:**
- `useState`: `blogs`, `loading`, `error`
- `useEffect`: Fetches all company blogs on mount

**Key useEffect:**
```javascript
useEffect(() => {
  fetchBlogs() // Load all blogs when component first renders
}, [])
```

---

#### 5. **`DashboardCompanyBookings.jsx`** (Company Booking View)
**Hooks used:**
- `useState`: `bookings`, `loading`, `error`
- `useEffect`: Fetches company bookings on mount

**Key useEffect:**
```javascript
useEffect(() => {
  fetchBookings() // Load all bookings for the company
}, [])
```

---

#### 6. **`DashboardNotifications.jsx`** (Company Notifications)
**Hooks used:**
- `useState`: `notifications`, `loading`, `error`, `selectedNotification`, `showDetailsPopup`
- `useEffect`: Fetches notifications on mount

**Key useEffect:**
```javascript
useEffect(() => {
  fetchNotifications() // Load all booking notifications
}, [])
```

---

#### 7. **`DashboardBookings.jsx`** (Customer Bookings)
**Hooks used:**
- `useState`: `bookings`, `loading`, `error`
- `useEffect`: Fetches user bookings on mount

**Key useEffect:**
```javascript
useEffect(() => {
  fetchBookings() // Load user's booking history
}, [])
```

---

#### 8. **`DashboardProfile.jsx`** (Profile Management - All User Types)
**Hooks used:**
- `useState`: Multiple states (profile data, edit mode, password modal, delete modal, etc.)
- `useEffect`: 
  1. Fetches user data from API on mount
  2. Focuses password input when modal opens
- `useRef`: `newPasswordInputRef` - to focus password input field

**Key useEffects:**
```javascript
// 1. Fetch user profile data
useEffect(() => {
  const fetchUserData = async () => {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`)
    // Update profile state with API data
  }
  fetchUserData()
}, [userId]) // Runs when userId changes

// 2. Focus password input when modal opens
useEffect(() => {
  if (showPasswordModal && newPasswordInputRef.current) {
    setTimeout(() => {
      newPasswordInputRef.current?.focus() // Focus the input
    }, 100)
  }
}, [showPasswordModal]) // Runs when modal opens/closes
```

---

#### 9. **`RegisteredCompanies.jsx`** (Admin - Company List)
**Hooks used:**
- `useState`: `companies`, `search`, `showPopup`, `popupResorts`, `popupCompany`, `loading`, `loadingResorts`
- `useEffect`: Fetches all companies with revenue data on mount

**Key useEffect:**
```javascript
useEffect(() => {
  const fetchCompanies = async () => {
    const res = await axios.get('http://localhost:8000/companies-with-revenue')
    setCompanies(res.data?.companies || [])
  }
  fetchCompanies()
}, []) // Runs once when component mounts
```

---

#### 10. **`LoginPage.jsx`** (Login Form)
**Hooks used:**
- `useState`: `selectedUserType`, `formData`, `error`, `success`, `loading`
- `useNavigate`: Redirects to dashboard after successful login

**No useEffect** - form submission happens on button click.

---

#### 11. **`SignupPage.jsx`** (Registration Form)
**Hooks used:**
- `useState`: `formData`, `error`, `success`, `loading`
- `useNavigate`: Redirects to dashboard after successful signup

**No useEffect** - form submission happens on button click.

---

#### 12. **`IntroPage.jsx`** (Landing Page)
**Hooks used:**
- `useNavigate`: For navigation to login/signup pages

---

## Common Patterns in This Project

### Pattern 1: Data Fetching on Mount
```javascript
useEffect(() => {
  fetchData() // Fetch when component loads
}, []) // Empty array = run once
```
**Used in:** DashboardMyBlogs, DashboardCompanyBookings, DashboardBookings, RegisteredCompanies

---

### Pattern 2: Event Listener Setup/Cleanup
```javascript
useEffect(() => {
  document.addEventListener('mousedown', handleClick)
  
  return () => {
    document.removeEventListener('mousedown', handleClick) // Cleanup
  }
}, [dependencies])
```
**Used in:** DashboardHome (click outside dropdown)

---

### Pattern 3: Interval/Polling
```javascript
useEffect(() => {
  fetchData()
  const interval = setInterval(fetchData, 30000) // Every 30 seconds
  
  return () => {
    clearInterval(interval) // Cleanup: stop interval
  }
}, [dependencies])
```
**Used in:** DashboardPage (notification polling)

---

### Pattern 4: Conditional Effects
```javascript
useEffect(() => {
  if (condition) {
    // Only run if condition is true
    doSomething()
  }
}, [condition])
```
**Used in:** DashboardPage (only fetch notifications if user is company)

---

### Pattern 5: Focus Management
```javascript
useEffect(() => {
  if (modalOpen && inputRef.current) {
    inputRef.current.focus()
  }
}, [modalOpen])
```
**Used in:** DashboardProfile (focus password input when modal opens)

---

## Why useEffect is Important

1. **Separation of Concerns**: Keeps side effects (API calls, DOM manipulation) separate from rendering logic
2. **Lifecycle Management**: Replaces component lifecycle methods (componentDidMount, componentDidUpdate, componentWillUnmount)
3. **Data Fetching**: Perfect for loading data when component mounts or when dependencies change
4. **Cleanup**: Ensures resources (timers, listeners) are properly cleaned up to prevent memory leaks
5. **Conditional Execution**: Can run effects only when needed (based on dependencies)

---

## Summary Table

| File | useState | useEffect | useNavigate | useRef | Other |
|------|----------|-----------|-------------|--------|-------|
| DashboardPage.jsx | ✓ | ✓ (polling) | ✓ | - | - |
| DashboardHome.jsx | ✓ (15+) | ✓ (click outside) | - | - | - |
| DashboardMyResorts.jsx | ✓ (25+) | ✓ (fetch data) | - | - | - |
| DashboardMyBlogs.jsx | ✓ | ✓ (fetch data) | - | - | - |
| DashboardCompanyBookings.jsx | ✓ | ✓ (fetch data) | - | - | - |
| DashboardNotifications.jsx | ✓ | ✓ (fetch data) | - | - | - |
| DashboardBookings.jsx | ✓ | ✓ (fetch data) | - | - | - |
| DashboardProfile.jsx | ✓ (10+) | ✓ (fetch + focus) | - | ✓ | useCallback, useMemo (imported) |
| RegisteredCompanies.jsx | ✓ | ✓ (fetch data) | - | - | - |
| LoginPage.jsx | ✓ | - | ✓ | - | - |
| SignupPage.jsx | ✓ | - | ✓ | - | - |
| IntroPage.jsx | - | - | ✓ | - | - |

---

## Key Takeaways

1. **useState** - Used in almost every component for managing dynamic state
2. **useEffect** - Most commonly used for:
   - Fetching data on component mount
   - Setting up/cleaning up event listeners
   - Polling/interval management
   - Focusing inputs
3. **useNavigate** - Used for programmatic navigation (routing)
4. **useRef** - Used sparingly for DOM manipulation (focus management)
5. **useCallback/useMemo** - Imported but not actively used (reserved for performance optimization if needed)


