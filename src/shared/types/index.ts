/**
 * ==============================================================================
 * CELCOM ERP PRO - SHARED DATA MODEL DECLARATIONS
 * ==============================================================================
 */

// User System Roles
export type UserRole = 
  | "SYSTEM_ADMIN" 
  | "FINANCE_OFFICER" 
  | "TECHNICAL_ADMIN" 
  | "SUPPORT_REPRESENTATIVE";

// Subscriber Statuses
export type SubscriberStatus = 
  | "ACTIVE" 
  | "SUSPENDED" 
  | "TERMINATED" 
  | "PENDING_INSTALLATION";

// Ledger Account Types
export type AccountType = 
  | "ASSET" 
  | "LIABILITY" 
  | "EQUITY" 
  | "REVENUE" 
  | "EXPENSE";

// Ticket Severity levels
export type TicketPriority = 
  | "CRITICAL" 
  | "HIGH" 
  | "MEDIUM" 
  | "LOW";

// Ticket statuses
export type TicketStatus = 
  | "OPEN" 
  | "IN_PROGRESS" 
  | "RESOLVED" 
  | "CLOSED";

// Invoice payment statuses
export type PaymentStatus = 
  | "PAID" 
  | "UNPAID" 
  | "PARTIALLY_PAID" 
  | "OVERDUE";

// Shared interfaces
export interface SystemUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  active: boolean;
  createdAt: string;
}

export interface SubscriberBriefDTO {
  id: string;
  accountNumber: string;
  name: string;
  status: SubscriberStatus;
  primaryPhone: string;
  locationZone: string;
  currentPackage: string;
}
