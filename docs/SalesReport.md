## 🎯 Overview
This document explains the **Sales Report Page** implementation for analyzing business performance with real-time data visualization, filtering, and comprehensive reporting.

---

## 🚨 Key Challenge: Complex Data Aggregation & Real-time Visualization
**Where I Struggled Most:** Managing multiple data aggregation strategies, real-time chart updates, and ensuring accurate calculations across different date ranges and service types.

## 🏗️ System Architecture

### 🧩 Frontend Components

#### `SalesReportPage` Component
```javascript
// Complex data visualization and filtering controller
- Real-time data aggregation and caching
- Multiple chart types with responsive design
- Advanced filtering and date range handling
- Animated number transitions
```

### ⚙️ Complex State Management

```javascript
const [salesData, setSalesData] = useState([]);
const [serviceDistributionData, setServiceDistributionData] = useState([]);
const [recentTransactions, setRecentTransactions] = useState([]);
const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    todaySales: 0,
    yesterdaySales: 0,
    growthPercentage: 0,
    totalLoads: 0,
});

// Animated numbers for smooth transitions
const [animatedSummary, setAnimatedSummary] = useState({
    totalSales: "0",
    totalTransactions: "0",
    averageOrderValue: "0.00",
    totalLoads: "0",
    growthPercentage: "0",
    isChanging: false,
});
```

### 🧮 Where I Struggled: Data Aggregation Strategies

**Problem:**  
Different date ranges (e.g., today, week, month, custom) required distinct aggregation logic to correctly group and summarize sales data.

```javascript
// Complex data processing based on date range
const processSalesData = (rawData, rangeType, start, end) => {
    if (!rawData || rawData.length === 0) return [];

    // For "This Month", show only one bar for the whole month
    if (rangeType === "month") {
        const totalSales = rawData.reduce((sum, item) => sum + (item.sales || 0), 0);
        const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

        return [
            {
                period: currentMonth,
                sales: totalSales,
            },
        ];
    }

    if (rangeType === "custom") {
        const grouping = getSmartDateGrouping(start, end);

        if (grouping === "weekly") {
            // Complex weekly grouping logic
            const weeklyData = {};
            rawData.forEach((item) => {
                if (item.period) {
                    const date = new Date(item.period);
                    const weekNumber = Math.ceil(date.getDate() / 7);
                    const monthName = getMonthName(item.period);
                    const weekKey = `Week ${weekNumber}`;
                    // ... more complex aggregation
                }
            });
        }
        // ... more grouping strategies
    }
    return rawData;
};
```

### 📅 Smart Date Grouping Complexity

**Where I Struggled:**  
Determining the optimal way to group data dynamically based on the selected date range — daily, weekly, or monthly — to ensure clear visualization without overwhelming the charts.

```javascript
const getSmartDateGrouping = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 7) {
        return "daily"; // Show daily data for up to 7 days
    } else if (diffDays <= 90) {
        return "weekly"; // Show weekly data for up to 3 months
    } else {
        return "monthly"; // Show monthly data for longer periods
    }
};
```

### 🧩 Backend Services

#### `ReportService` (Java / Spring Boot)

Handles complex multi-dimensional data aggregation for sales reports, including trend analysis, service distribution, and customer summaries.

```java
@Service
public class ReportService {
    // Complex data aggregation across multiple dimensions
    public Map<String, Object> generateSalesReport(String dateRange, LocalDate startDate, 
                                                   LocalDate endDate, String serviceType) {
        // Multiple data processing pipelines
        List<Map<String, Object>> salesTrend = generateSalesTrend(transactions, reportStartDate, reportEndDate, dateRange);
        List<Map<String, Object>> serviceDistribution = generateServiceDistribution(transactions);
        Map<String, Object> summary = generateSummary(transactions, reportStartDate, reportEndDate);
        List<Map<String, Object>> uniqueCustomerTransactions = getUniqueCustomerTransactions(transactions);
        
        return Map.of(
            "salesTrend", salesTrend,
            "serviceDistribution", serviceDistribution,
            "summary", summary,
            "recentTransactions", uniqueCustomerTransactions
        );
    }
}
```

### 🎓 Learning Challenges & Solutions

#### 1. Complex Date Range Calculations  
**Problem:** Handling different date range types with proper boundary calculations and validation.  

**Solution:** Implemented a comprehensive backend date range calculator that validates and auto-corrects date inputs.

```java
private LocalDate[] calculateDateRange(String dateRange, LocalDate startDate, LocalDate endDate) {
    LocalDate today = LocalDate.now();

    if ("custom".equals(dateRange)) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Both start date and end date are required for custom range");
        }

        // Auto-swap dates if start is after end
        if (startDate.isAfter(endDate)) {
            return new LocalDate[] { endDate, startDate };
        }
        return new LocalDate[] { startDate, endDate };
    }

    switch (dateRange) {
        case "today":
            return new LocalDate[] { today, today };
        case "yesterday":
            LocalDate yesterday = today.minusDays(1);
            return new LocalDate[] { yesterday, yesterday };
        case "week":
            LocalDate weekStart = today.minusDays(7);
            return new LocalDate[] { weekStart, today };
        case "month":
            LocalDate monthStart = today.withDayOfMonth(1);
            return new LocalDate[] { monthStart, today };
        case "year":
            LocalDate yearStart = today.withDayOfYear(1);
            LocalDate yearEnd = today.withDayOfYear(today.lengthOfYear());
            return new LocalDate[] { yearStart, yearEnd };
        default:
            return new LocalDate[] { today.minusDays(30), today };
    }
}
```

#### 2. Growth Percentage Calculation Issues  
**Where I Struggled:** Preventing unrealistic growth percentages and avoiding division by zero errors.  

**Solution:** Implemented a safe percentage calculation function with value bounds and fallback handling.

```javascript
const calculateSafeGrowthPercentage = (todaySales, yesterdaySales) => {
    if (yesterdaySales === 0) {
        return todaySales > 0 ? 100 : 0;
    }

    const percentage = ((todaySales - yesterdaySales) / yesterdaySales) * 100;

    // Cap at 100% to prevent unrealistic numbers like 290%
    if (percentage > 100) return 100;
    if (percentage < -100) return -100;

    return Math.round(percentage);
};
```

#### 3. Real-time Data Synchronization  
**Problem:** Maintaining up-to-date data without overloading the system.  

**Solution:** Implemented hybrid caching with smart invalidation and periodic refresh.

```javascript
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const POLLING_INTERVAL = 10000; // 10 seconds auto-refresh

// Smart cache invalidation
const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;

    return (
        JSON.stringify(newData.salesData) !== JSON.stringify(oldData.salesData) ||
        JSON.stringify(newData.serviceDistributionData) !== JSON.stringify(oldData.serviceDistributionData) ||
        JSON.stringify(newData.recentTransactions) !== JSON.stringify(oldData.recentTransactions) ||
        JSON.stringify(newData.summaryData) !== JSON.stringify(oldData.summaryData)
    );
};
```

#### 4. Complex Chart Data Processing  
**Where I Struggled:** Aggregating data correctly for different time periods (yearly vs daily).  

**Solution:** Implemented flexible aggregation strategies in the backend to adapt based on the selected date range.

```java
private List<Map<String, Object>> generateSalesTrend(List<Transaction> transactions, 
                                                     LocalDate startDate, LocalDate endDate, 
                                                     String dateRange) {
    
    // For year view, group by month with abbreviated names
    if ("year".equals(dateRange)) {
        Map<String, Double> monthlySales = new LinkedHashMap<>();
        
        // Initialize all months with 0.0 to ensure complete dataset
        String[] monthAbbreviations = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for (String month : monthAbbreviations) {
            monthlySales.put(month, 0.0);
        }
        
        // Complex monthly aggregation
        transactions.forEach(transaction -> {
            LocalDate transactionDate = transaction.getCreatedAt().toLocalDate();
            String monthKey = transactionDate.format(DateTimeFormatter.ofPattern("MMM"));
            double currentTotal = monthlySales.getOrDefault(monthKey, 0.0);
            monthlySales.put(monthKey, currentTotal + transaction.getTotalPrice());
        });
        
        return monthlySales.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> dataPoint = new HashMap<>();
                    dataPoint.put("period", entry.getKey());
                    dataPoint.put("sales", entry.getValue());
                    return dataPoint;
                })
                .collect(Collectors.toList());
    } 
    // For other date ranges, use daily grouping
    else {
        // Daily aggregation logic...
    }
}
```

#### 5. Unique Customer Transaction Handling  
**Problem:** Displaying the latest transaction per customer without showing duplicates.  

**Solution:** Utilized Java Stream API to group transactions by customer and keep only the most recent entry.

```java
private List<Map<String, Object>> getUniqueCustomerTransactions(List<Transaction> transactions) {
    Map<String, Transaction> latestTransactionsByCustomer = transactions.stream()
            .collect(Collectors.toMap(
                    Transaction::getCustomerName,
                    Function.identity(),
                    (existing, replacement) -> replacement.getCreatedAt().isAfter(existing.getCreatedAt())
                            ? replacement
                            : existing));

    return latestTransactionsByCustomer.values().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .map(transaction -> {
                Map<String, Object> transactionData = new HashMap<>();
                transactionData.put("id", transaction.getId());
                transactionData.put("customerName", transaction.getCustomerName());
                transactionData.put("serviceType", transaction.getServiceName());
                transactionData.put("totalPrice", transaction.getTotalPrice());
                transactionData.put("createdAt", transaction.getCreatedAt());
                return transactionData;
            })
            .collect(Collectors.toList());
}
```

#### 6. Animated Number Transitions  
**Challenge:** Achieving smooth and visually appealing number animations without causing frame drops or layout shifts.

**Solution:** Implemented a custom animated number component using **Framer Motion**, ensuring fluid transitions during value changes.

```javascript
const AnimatedNumber = ({ value, isChanging }) => {
    if (!isChanging) {
        return <span>{value}</span>;
    }

    return (
        <span className="relative inline-block">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={value}
                    initial={{
                        opacity: 0,
                        y: 30,
                        scale: 1.2,
                        rotateX: 90,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0,
                    }}
                    exit={{
                        opacity: 0,
                        y: -30,
                        scale: 0.8,
                        rotateX: -90,
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut",
                    }}
                    className="inline-block"
                    style={{
                        transformStyle: "preserve-3d",
                    }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};
```

### 🔧 Technical Implementation Details  

#### 🧠 Smart Caching Strategy  
**Goal:** Reduce redundant API calls while ensuring the dashboard always displays up-to-date data.  
**Solution:** Implemented a hybrid caching mechanism that intelligently checks for data changes before refreshing.  

```javascript
let salesReportCache = null;
let cacheTimestamp = null;

const fetchSalesReport = async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = `${dateRange}-${startDate}-${endDate}-${serviceTypeFilter}`;

    // ✅ Use cache if still valid
    if (
        !forceRefresh &&
        salesReportCache &&
        salesReportCache.cacheKey === cacheKey &&
        cacheTimestamp &&
        now - cacheTimestamp < CACHE_DURATION
    ) {
        console.log("📦 Using cached sales report data");
        return; // Use cached data
    }

    // 🔄 Fetch new data only when cache expires or data changes
    if (hasDataChanged(newData, salesReportCache)) {
        salesReportCache = { ...newData, cacheKey: cacheKey };
        cacheTimestamp = Date.now();
    }
};
```

### 📊 Responsive Chart Configuration  

#### 🎨 Dynamic & Accessible Visuals  
**Goal:** Ensure chart labels, tooltips, and data presentation remain readable and accessible across screen sizes and themes (dark/light).  

---

#### 🧩 Custom X-Axis Tick Renderer  
Used a custom tick renderer to keep all labels visible and properly aligned, regardless of viewport size.  

```javascript
// Custom XAxis tick component to ensure all labels are visible
const renderCustomXAxisTick = ({ x, y, payload }) => {
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill={isDarkMode ? "#13151B" : "#0B2B26"}
                fontSize="12"
                fontWeight="500"
            >
                {payload.value}
            </text>
        </g>
    );
};
```

## 🚀 Performance Optimizations

### ⚡ Smart Caching  
Implemented a **4-hour cache** with a **10-second polling interval** for data freshness without overloading the backend.

### 🧩 Conditional Rendering  
Components only re-render when data actually changes, improving overall UI responsiveness.

### 🔢 Efficient Aggregation  
Handled heavy data grouping and summarization on the **backend** to reduce frontend computation load.

### 🧠 Memoized Calculations  
Used memoization to cache filtered transactions and pagination results for snappier UI updates.

### 💤 Lazy Loading  
Integrated **skeleton loaders** for tables and charts to maintain a smooth user experience during data fetches.

---

## 📝 Key Learnings

- **🧮 Data Aggregation:** Learned to implement efficient and flexible grouping strategies for daily, monthly, and yearly reports.  
- **🚀 Performance Optimization:** Balanced real-time updates with smart caching to maintain speed and accuracy.  
- **📊 Chart Customization:** Enhanced mastery of **Recharts** customization and adaptive chart responsiveness.  
- **🧱 Error Handling:** Developed robust validation for date inputs and safe calculation methods.  
- **✨ User Experience:** Designed intuitive filters, animated transitions, and adaptive UI layouts.

---