# 🧩 Project Development Lifecycle: Star Wash Laundry System

This document outlines the step-by-step process we used to design, develop, and deploy the **Star Wash Laundry management system**.  
The system caters to three primary actors: **Admin**, **Staff**, and **Public Users** (who do not require an account).

---

## 1. 🗺️ Planning & System Analysis

**Objective:**  
To map out the complete user journey for all roles and define core functionalities.

**Tool Used:**  
Flowcharts

**Process:**  
We created detailed flowcharts that visualized processes like:

- **User (Public):** Selecting services, submitting an order, making a payment, and tracking order status.  
- **Staff:** Logging in, viewing new orders, updating order status (e.g., Washing, Drying, Ready for Pickup), and generating receipts.  
- **Admin:** Logging in, managing services (add/edit/delete), viewing all orders and financial reports, and managing staff accounts.

**Outcome:**  
A clear blueprint that served as a reference for the entire development team, ensuring all features were accounted for and the user experience was logical.

---

## 2. ⚙️ Technology Stack Selection

After finalizing the system flow, we selected a **modern, efficient, and scalable** technology stack.

### **Frontend**
- **React Vite:** Chosen for its fast development server and excellent performance as a build tool.  
- **Tailwind CSS:** Used for rapid and consistent UI development with utility-first classes.  
- **UI Libraries:**
  - **shadcn/ui:** For beautiful, accessible, and reusable components.  
  - **Framer Motion:** For smooth animations and transitions to enhance user experience.  
  - **Lucide React:** For a clean and consistent set of icons.

### **Backend**
- **Spring Boot:** Selected for its robustness, ease of dependency management, and powerful ecosystem for building production-ready APIs.

### **Database**
- **MongoDB:**  
  A NoSQL database chosen for its flexibility in handling diverse data related to orders, users, and services.  
  Its document model aligns well with the structure of our application data.

---

## 3. 🧠 Backend Development (Spring Boot)

We started hands-on development by building the server-side logic and API.

**Architecture (Layered):**
- **Model:** Defined the data structures (e.g., Order, Service, User).  
- **Repository:** Interfaces for data persistence using Spring Data MongoDB.  
- **Service:** Implemented the core business logic (e.g., calculating totals, updating order status).  
- **DTO (Data Transfer Object):** Used to transfer data between the client and server in a controlled format, preventing exposure of internal model details.  
- **Controller:** Created REST API endpoints (e.g., `/api/orders`, `/api/services`) to handle HTTP requests from the frontend.

**Security:**  
Implemented **Spring Security** with **JWT (JSON Web Tokens)** to handle authentication and authorization for Admin and Staff roles.

---

## 4. 💻 Frontend Development (React Vite)

With the backend API taking shape, we simultaneously developed the **user interface**.

**Process:**

1. **UI/UX Design:**  
   Created high-fidelity mockups and prototypes in **Figma** to finalize design and user interactions before coding.

2. **Implementation:**  
   Using the Figma design as a guide, we built the frontend with **React Vite** and **Tailwind CSS**.

3. **Component Library:**  
   We heavily utilized **shadcn/ui** components for buttons, forms, and dialogs, customizing them with Tailwind to match our brand.  
   **Framer Motion** was added for page transitions and micro-interactions.

---

## 5. 🔗 System Integration & Role-Specific Development

We adopted a **phased approach** for integration, focusing on one role at a time.

### **Phase 1: Admin Panel**
- Connected the Admin frontend to backend APIs.  
- Completed and tested all administrative functions:
  - User management  
  - Service management  
  - Viewing all orders and reports

### **Phase 2: Staff Panel (With Optimization)**

**Problem:**  
Saving generated receipts as files (e.g., PDFs) would consume unnecessary storage over time.

**Solution:**  
Instead of storing receipt files, we designed the system to **dynamically generate receipts on-demand**.  
All order data is stored in MongoDB, and when a receipt is needed (by Staff or User), the frontend renders a receipt template populated with live data from the database — eliminating redundant file storage.

### **Phase 3: Public User Side (Account-Free)**

Developed the public-facing interface allowing users to place orders without creating an account.

**Tracking Mechanism:**  
To enhance user experience, we implemented **browser cookies** to track recent order searches.  
This allows users to easily return and check their order status without needing to remember an order ID.

---

## 6. 🚀 Deployment & Hosting

The final challenge was deploying the application with a **limited budget**.

**Initial Plan:**  
We purchased a shared hosting plan on **Hostinger** for both frontend and backend.

**Challenge:**  
Hostinger’s shared hosting does **not** support Java Spring Boot applications (which require a VPS).  
A VPS was outside our project budget.

### **Adaptive Solution**
- **Backend (Spring Boot):** Deployed for free on **Render.com**, which supports Java applications.  
- **Frontend (React Vite):** Built into static files and deployed successfully on **Hostinger**.

**Result:**  
This hybrid hosting solution allowed us to go live within budget constraints.  
The frontend on Hostinger communicates seamlessly with the backend API hosted on Render.

---

## 🧾 Summary

The **Star Wash Laundry System** was built through a **methodical process** — from flowchart planning to selecting a modern **MongoDB + Spring Boot + React** stack.  

Development was phased:
- Backend first  
- Design-led frontend second  
- Role-based integration third  

**Key innovations include:**
- Dynamic receipt generation (reduces storage use)  
- Cookie-based tracking for seamless public user experience  
- Cost-effective hybrid deployment (Hostinger + Render)

---

✨ **Result:** A fully functional, role-based laundry management system that’s efficient, scalable, and affordable.
