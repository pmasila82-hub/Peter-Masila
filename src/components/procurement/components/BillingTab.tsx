import React, { useState } from "react";
import { 
  Building, CreditCard, DollarSign, Plus, Search, FileText, CheckCircle2, Calendar, AlertTriangle, Eye, X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Table } from "../../ui/Table";

interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName?: string;
  grnId?: string;
  grnNumber?: string;
  billingDate: string;
  dueDate: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  createdAt: string;
}

interface SupplierPayment {
  id: string;
  paymentCode: string;
  supplierInvoiceId: string;
  invoiceNumber?: string;
  supplierName?: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "MPESA" | "CHEQUE";
  transactionReference: string;
  paymentDate: string;
  recordedBy: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  companyName: string;
  vendorCode: string;
}

interface GRN {
  id: string;
  grnNumber: string;
  supplierName?: string;
  purchaseOrderId?: string;
  purchaseOrderNo?: string;
}

interface BillingTabProps {
  invoices: SupplierInvoice[];
  payments: SupplierPayment[];
  suppliers: Supplier[];
  grns: GRN[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function BillingTab({ invoices, payments, suppliers, grns, onRefresh, onShowNotification }: BillingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"invoices" | "payments">("invoices");
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

  // Forms
  const [invForm, setInvForm] = useState({
    invoiceNumber: "",
    supplierId: "",
    grnId: "",
    billingDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subTotal: 0,
    vatAmount: 0
  });

  const [payForm, setPayForm] = useState({
    supplierInvoiceId: "",
    amount: 0,
    paymentMethod: "BANK_TRANSFER" as "CASH" | "BANK_TRANSFER" | "MPESA" | "CHEQUE",
    transactionReference: ""
  });

  const handleInvSupplierChange = (supId: string) => {
    // Attempt to prefill values if a GRN exists for this supplier
    setInvForm(prev => ({
      ...prev,
      supplierId: supId,
      grnId: ""
    }));
  };

  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.invoiceNumber || !invForm.supplierId) {
      onShowNotification("Form Incomplete", "Please specify invoice number and supplier partner.", "error");
      return;
    }

    try {
      const res = await fetch("/api/v1/procurement/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          ...invForm,
          subTotal: parseFloat(invForm.subTotal as any) || 0,
          vatAmount: parseFloat(invForm.vatAmount as any) || 0,
          totalAmount: (parseFloat(invForm.subTotal as any) || 0) + (parseFloat(invForm.vatAmount as any) || 0)
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Invoice Logged", "Supplier invoice " + invForm.invoiceNumber + " has been added to accounts payable.", "success");
        setShowInvoiceModal(false);
        setInvForm({
          invoiceNumber: "",
          supplierId: "",
          grnId: "",
          billingDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          subTotal: 0,
          vatAmount: 0
        });
        onRefresh();
      } else {
        onShowNotification("Failed to log invoice", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to contact API", "error");
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.supplierInvoiceId || payForm.amount <= 0 || !payForm.transactionReference) {
      onShowNotification("Form Incomplete", "Please complete all payment fields.", "error");
      return;
    }

    try {
      const res = await fetch("/api/v1/procurement/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          ...payForm,
          amount: parseFloat(payForm.amount as any) || 0,
          paymentDate: new Date().toISOString().split("T")[0]
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Payment Recorded", "Payment logged. Ledger values synchronized.", "success");
        setShowPaymentModal(false);
        setPayForm({
          supplierInvoiceId: "",
          amount: 0,
          paymentMethod: "BANK_TRANSFER",
          transactionReference: ""
        });
        onRefresh();
      } else {
        onShowNotification("Failed to log payment", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to contact API", "error");
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "PAID": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "PARTIALLY_PAID": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "OVERDUE": return "bg-red-50 text-red-700 border border-red-200 animate-pulse";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Accounts Payable (AP) Ledger & Payments</h2>
          <p className="text-sm text-gray-500">Record incoming vendor claims, track due dates, and issue settlements matching cash and bank registers.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button id="btn-log-invoice" variant="outline" onClick={() => setShowInvoiceModal(true)} className="flex items-center gap-1.5 text-xs">
            <Plus size={14} /> Log Supplier Invoice
          </Button>
          <Button id="btn-record-payment" variant="primary" onClick={() => setShowPaymentModal(true)} className="flex items-center gap-1.5 text-xs">
            <DollarSign size={14} /> Log Settlement Payment
          </Button>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("invoices")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition duration-150 ${
            activeSubTab === "invoices" 
              ? "border-amber-500 text-amber-700" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          1. Supplier Invoices & Bills
        </button>
        <button
          onClick={() => setActiveSubTab("payments")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition duration-150 ${
            activeSubTab === "payments" 
              ? "border-amber-500 text-amber-700" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          2. Disbursed Payments History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {activeSubTab === "invoices" ? (
            <Card id="invoice-list-card">
              <CardHeader>
                <CardTitle>Invoices Ledger</CardTitle>
                <CardDescription>Accounts payable liabilities outstanding per supplier.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table id="invoice-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Invoice Number</th>
                      <th className="p-4">Supplier Partner</th>
                      <th className="p-4">Linked GRN</th>
                      <th className="p-4">Billing Date</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4 font-mono">Gross (KES)</th>
                      <th className="p-4 font-mono">Paid (KES)</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {invoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoice(inv)}
                        className={`hover:bg-gray-50 cursor-pointer transition ${selectedInvoice?.id === inv.id ? "bg-amber-50/40 border-l-4 border-amber-500" : ""}`}
                      >
                        <td className="p-4 font-mono font-bold text-xs text-amber-600">{inv.invoiceNumber}</td>
                        <td className="p-4 font-medium text-gray-800">{inv.supplierName}</td>
                        <td className="p-4 font-mono text-xs text-gray-500">{inv.grnNumber || "N/A"}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{inv.billingDate}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{inv.dueDate}</td>
                        <td className="p-4 font-mono text-gray-900 font-bold">KES {inv.totalAmount.toLocaleString()}</td>
                        <td className="p-4 font-mono text-gray-500 font-semibold">KES {inv.amountPaid.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400 italic">No supplier invoices recorded yet. Click Log Supplier Invoice to create liabilities.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card id="payment-list-card">
              <CardHeader>
                <CardTitle>Cash & Bank Disbursement Vouchers</CardTitle>
                <CardDescription>List of payment transaction codes cleared against active bills.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table id="payment-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Voucher No</th>
                      <th className="p-4">Linked Invoice No</th>
                      <th className="p-4">Supplier Partner</th>
                      <th className="p-4">Settlement Date</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Transaction Ref</th>
                      <th className="p-4 font-mono">Amount Paid (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-mono font-bold text-xs text-indigo-600">{p.paymentCode}</td>
                        <td className="p-4 font-mono text-xs text-amber-600 font-bold">{p.invoiceNumber}</td>
                        <td className="p-4 font-medium text-gray-800">{p.supplierName}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{p.paymentDate}</td>
                        <td className="p-4 text-xs font-semibold text-gray-600 uppercase">{p.paymentMethod.replace("_", " ")}</td>
                        <td className="p-4 text-xs font-mono text-blue-600 font-semibold">{p.transactionReference}</td>
                        <td className="p-4 font-mono text-gray-900 font-bold">KES {p.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 italic">No settlement disbursements recorded yet. Click Log Settlement Payment to dispatch funds.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SIDEBAR AUDIT CARD */}
        <div>
          {selectedInvoice ? (
            <Card id="inspect-bill-card" className="border-amber-100 shadow-sm">
              <CardHeader className="bg-amber-50/30 border-b border-amber-100/50">
                <span className="font-mono text-xs font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                  {selectedInvoice.invoiceNumber}
                </span>
                <CardTitle className="mt-2 text-base">Bill Ledger Inspection</CardTitle>
                <CardDescription>Credited by {selectedInvoice.supplierName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-400">Billing Date:</span>
                    <span className="text-gray-800 font-medium font-mono">{selectedInvoice.billingDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-400">Due Date:</span>
                    <span className="text-red-600 font-bold font-mono">{selectedInvoice.dueDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-400">Sub Total:</span>
                    <span className="text-gray-800 font-medium font-mono">KES {selectedInvoice.subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-400">VAT (16%):</span>
                    <span className="text-gray-800 font-medium font-mono">KES {selectedInvoice.vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2 text-sm font-bold">
                    <span className="text-gray-900">Total Claim:</span>
                    <span className="text-amber-600 font-mono">KES {selectedInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2 text-sm font-semibold">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="text-emerald-600 font-mono">KES {selectedInvoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 bg-gray-50 p-2 rounded">
                    <span>Liabilities Due:</span>
                    <span className="font-mono text-red-600">KES {(selectedInvoice.totalAmount - selectedInvoice.amountPaid).toLocaleString()}</span>
                  </div>
                </div>

                {selectedInvoice.status !== "PAID" && (
                  <Button 
                    id="btn-trigger-pay-from-sidebar"
                    type="button" 
                    variant="primary" 
                    onClick={() => {
                      setPayForm(prev => ({ ...prev, supplierInvoiceId: selectedInvoice.id, amount: selectedInvoice.totalAmount - selectedInvoice.amountPaid }));
                      setShowPaymentModal(true);
                    }}
                    className="w-full text-xs"
                  >
                    Clear Due Balance (KES {(selectedInvoice.totalAmount - selectedInvoice.amountPaid).toLocaleString()})
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400 p-4 text-center">
              Select an outstanding bill from the ledger lists to inspect outstanding tax splits and initiate settlement dispatch routing.
            </div>
          )}
        </div>
      </div>

      {/* ADD SUPPLIER INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Log Supplier Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Number Code *</label>
                <Input 
                  id="inv-form-num"
                  required 
                  placeholder="e.g. INV-HUA-2026-001" 
                  value={invForm.invoiceNumber} 
                  onChange={e => setInvForm({...invForm, invoiceNumber: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier Partner *</label>
                <select 
                  id="inv-form-supplier"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                  value={invForm.supplierId}
                  onChange={e => handleInvSupplierChange(e.target.value)}
                  required
                >
                  <option value="">-- Choose Partner --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName} ({s.vendorCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Receipt GRN Verification *</label>
                <select 
                  id="inv-form-grn"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                  value={invForm.grnId}
                  onChange={e => setInvForm({...invForm, grnId: e.target.value})}
                  required
                >
                  <option value="">-- Choose Stamped GRN Note --</option>
                  {grns.filter(g => !invForm.supplierId || g.supplierName === suppliers.find(s => s.id === invForm.supplierId)?.companyName).map(g => (
                    <option key={g.id} value={g.id}>{g.grnNumber} (PO: {g.purchaseOrderNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Claim Date *</label>
                  <Input 
                    id="inv-form-billing-date"
                    required 
                    type="date" 
                    value={invForm.billingDate} 
                    onChange={e => setInvForm({...invForm, billingDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Due Date *</label>
                  <Input 
                    id="inv-form-due-date"
                    required 
                    type="date" 
                    value={invForm.dueDate} 
                    onChange={e => setInvForm({...invForm, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sub Total Cost (KES) *</label>
                  <Input 
                    id="inv-form-subtotal"
                    required 
                    type="number" 
                    value={invForm.subTotal} 
                    onChange={e => setInvForm({...invForm, subTotal: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">VAT Claim (KES) (16%)</label>
                  <Input 
                    id="inv-form-vat"
                    type="number" 
                    value={invForm.vatAmount} 
                    onChange={e => setInvForm({...invForm, vatAmount: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6">
                <Button id="btn-cancel-invoice-modal" type="button" variant="outline" onClick={() => setShowInvoiceModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-submit-invoice-modal" type="submit" variant="primary" className="flex-1">
                  Log Invoice Liability
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD DISBURSED SETTLEMENT PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Log Settlement Payment Voucher</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Outstanding Invoice *</label>
                <select 
                  id="pay-form-invoice"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white font-mono"
                  value={payForm.supplierInvoiceId}
                  onChange={e => {
                    const selected = invoices.find(inv => inv.id === e.target.value);
                    setPayForm(prev => ({
                      ...prev,
                      supplierInvoiceId: e.target.value,
                      amount: selected ? selected.totalAmount - selected.amountPaid : 0
                    }));
                  }}
                  required
                >
                  <option value="">-- Choose Bill Claim --</option>
                  {invoices.filter(inv => inv.status !== "PAID").map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} ({inv.supplierName}) - Due: KES {(inv.totalAmount - inv.amountPaid).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Settlement Amount (KES) *</label>
                <Input 
                  id="pay-form-amount"
                  required 
                  type="number" 
                  value={payForm.amount} 
                  onChange={e => setPayForm({...payForm, amount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Funding Settlement Account *</label>
                <select 
                  id="pay-form-method"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                  value={payForm.paymentMethod}
                  onChange={e => setPayForm({...payForm, paymentMethod: e.target.value as any})}
                  required
                >
                  <option value="BANK_TRANSFER">KCB Bank Transfer</option>
                  <option value="MPESA">Safaricom M-Pesa Till/Paybill</option>
                  <option value="CASH">Petty Cash Register</option>
                  <option value="CHEQUE">Company Settlement Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Financial Reference Code (EFT/M-Pesa/Cheque No) *</label>
                <Input 
                  id="pay-form-ref"
                  required 
                  placeholder="e.g. TXN-FT-89102 or MPESA-KJA92" 
                  value={payForm.transactionReference} 
                  onChange={e => setPayForm({...payForm, transactionReference: e.target.value})}
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6">
                <Button id="btn-cancel-pay-modal" type="button" variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-submit-pay-modal" type="submit" variant="primary" className="flex-1">
                  Log Disbursed Settlement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
