# CELCOM ERP PRO — UI SYSTEM & REUSABLE COMPONENT SPECIFICATIONS

This document outlines the visual system, styling specifications, and developer interfaces for the reusable UI components created for **CELCOM ERP PRO**. The system draws design inspiration from world-class enterprise packages (Odoo, ERPNext, SAP Business One, and Microsoft Dynamics 365), emphasizing dense information display, high typography legibility, and responsive interactions.

---

## 🎨 BRAND IDENTITY & DESIGN TOKENS (TAILWIND v4)

Our system uses **Celcom Networks corporate colors**: a premium pairing of deep royal blues with sharp electric sky blue accents. It is built natively on **Tailwind CSS v4**'s `@theme` layout configurations.

### 1. Palette Specifications
- **Primary Sky Accent (`--color-sky-500` / `#0ea5e9`)**: The core brand color representing modern communication and high-speed broadband.
- **Corporate Slate (`--color-slate-900` / `#0f172a`)**: Used for professional dark headers, dense text, and solid dark backgrounds.
- **Enterprise Zinc/Gray**: Structured border grids, table headings, and light panel backgrounds.

### 2. Typography Pairings
- **Display Typography (Headings, Metrics)**: `Inter`, medium to bold tracking, tightened margins (`tracking-tight`).
- **Data & System Fields (IP addresses, transaction balances, KRA PIN numbers)**: `JetBrains Mono` (`font-mono`), highly scannable for multi-digit calculations.

### 3. Visual System Hierarchy
- **Border Grids**: Single-pixel crisp borders (`border border-slate-200` in light; `border-slate-800` in dark) with no unnecessary rounded bubbles. Perfect alignment with grid layout grids.
- **Component Elevation**: Low-elevation micro-shadows (`shadow-sm`) are preferred. Enterprise ERP users value information density and clean alignments over deep cartoon drop-shadows.

---

## 🛠️ REUSABLE COMPONENT INTERFACE DEFINITIONS

Below are the typescript specifications for each of the core reusable components built into our library.

### 1. Theme Switcher & Provider
Manages global theme state (`light` or `dark`), toggling the `.dark` class on the root HTML document element.
- **Component**: `ThemeProvider` and `useTheme` Hook
- **State Properties**: `theme: 'light' | 'dark'`, `toggleTheme: () => void`

### 2. Buttons (`/src/components/ui/Button.tsx`)
Responsive triggers supporting standard click activities, states, and sizes.
- **Props**:
  ```typescript
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
  ```

### 3. Data Cards & Metrics (`/src/components/ui/Card.tsx`)
Primary content containers.
- **Props**:
  ```typescript
  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
    borderAccent?: boolean; // Adds a subtle top sky-blue indicator
  }
  ```

### 4. Enterprise Form Inputs (`/src/components/ui/Input.tsx`)
Renders inputs with built-in layout consistency, labels, descriptions, and validation constraints. Includes specialized controls: Text, Select, Textarea, and Checkbox.
- **Props**:
  ```typescript
  interface FormFieldProps {
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
  }
  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FormFieldProps {}
  interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FormFieldProps {
    options: { value: string; label: string }[];
  }
  interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FormFieldProps {}
  interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    description?: string;
    error?: string;
  }
  ```

### 5. Interactive Data Table (`/src/components/ui/Table.tsx`)
A high-density grid supporting custom column cells, sorting headers, loading overlays, and item selections.
- **Props**:
  ```typescript
  interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
  }
  interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    onRowClick?: (row: T) => void;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (key: string) => void;
  }
  ```

### 6. Modal / Dialog Box (`/src/components/ui/Modal.tsx`)
Animated overlays using `motion/react` representing critical confirmation sheets.
- **Props**:
  ```typescript
  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footerActions?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
  ```

### 7. Analytical Charts (`/src/components/ui/Charts.tsx`)
Interactive visualization engines using `recharts`.
- **Props**:
  ```typescript
  interface ChartData {
    name: string;
    [key: string]: any;
  }
  interface AnalyticsChartProps {
    type: 'area' | 'bar' | 'line';
    data: ChartData[];
    metrics: { key: string; color: string; label: string }[];
    height?: number;
  }
  ```

### 8. Notification Engine (`/src/components/ui/Notifications.tsx`)
In-app toaster component triggered from global contexts.
- **Props**:
  ```typescript
  interface Toast {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }
  ```

### 9. Pagination Footer (`/src/components/ui/Pagination.tsx`)
Standard page transitions mapping list parameters.
- **Props**:
  ```typescript
  interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange?: (rows: number) => void;
  }
  ```

### 10. Empty & Failure States (`/src/components/ui/EmptyState.tsx`)
Centered visual context for null states.
- **Props**:
  ```typescript
  interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
  }
  ```

### 11. Breadcrumbs Navigator (`/src/components/ui/Breadcrumbs.tsx`)
- **Props**:
  ```typescript
  interface BreadcrumbItem {
    label: string;
    href?: string;
  }
  interface BreadcrumbsProps {
    items: BreadcrumbItem[];
  }
  ```

### 12. Full Screen & Inline Loading (`/src/components/ui/LoadingScreen.tsx`)
- **Props**:
  ```typescript
  interface LoadingScreenProps {
    type?: 'full' | 'inline' | 'skeleton';
    rows?: number; // For skeletons
  }
  ```

### 13. Profile Popup Dropdown (`/src/components/ui/ProfileMenu.tsx`)
- **Props**:
  ```typescript
  interface ProfileMenuProps {
    user: {
      name: string;
      email: string;
      role: string;
      avatarUrl?: string;
    };
    onLogout?: () => void;
  }
  ```

### 14. Responsive Dashboard Layout (`/src/components/ui/DashboardLayout.tsx`)
The skeleton container including a collapsable sidebar, fixed header navbar, search box, profile dropdown, theme toggler, and layout content canvas.
- **Props**:
  ```typescript
  interface DashboardLayoutProps {
    children: React.ReactNode;
    activeNavId?: string;
    breadcrumbs?: BreadcrumbItem[];
    onNavChange?: (id: string) => void;
  }
  ```
