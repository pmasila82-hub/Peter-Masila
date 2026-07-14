import React, { useState } from "react";
import { 
  FileText, Plus, Search, Calendar, CheckSquare, Eye, Send, ArrowUpRight, X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface POItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  lpoId: string;
  lpoNumber?: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  dateCreated: string;
  expectedDeliveryDate: string;
  deliveryStatus: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  items: POItem[];
}

interface LPO {
  id: string;
  lpoNumber: string;
  supplierName?: string;
  totalAmount: number;
  status: string;
}

interface POTabProps {
  purchaseOrders: PurchaseOrder[];
  lpos: LPO[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function POTab({ purchaseOrders, lpos, onRefresh, onShowNotification }: POTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [lpoId, setLpoId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

  // Filter LPOs that are APPROVED and do not have a PO yet
  const availableLPOs = lpos.filter(l => 
    l.status === "APPROVED" && !purchaseOrders.some(p => p.lpoId === l.id)
  );

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lpoId || !expectedDeliveryDate) {
      onShowNotification("Invalid Form", "Please select an active LPO and expected delivery date", "error");
      return;
    }

    try {
      const res = await fetch("/api/v1/procurement/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          lpoId,
          expectedDeliveryDate
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("PO Dispatched", "Successfully created and dispatched Purchase Order " + data.purchaseOrder.poNumber, "success");
        setShowAddModal(false);
        setLpoId("");
        setExpectedDeliveryDate("");
        onRefresh();
      } else {
        onShowNotification("PO Dispatch Failed", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to contact PO API", "error");
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "DELIVERED": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "SHIPPED": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "CANCELLED": return "bg-red-50 text-red-700 border border-red-200";
      default: return "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Supplier Despatches & PO Dispatch Tracker</h2>
          <p className="text-sm text-gray-500">Record communication, dispatch official Purchase Orders (PO) to vendors, and manage SLA expectancies.</p>
        </div>
        <Button id="btn-dispatch-po" variant="primary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Send size={16} /> Dispatch Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card id="po-list-card">
            <CardHeader>
              <CardTitle>PO Directory & Freight Status</CardTitle>
              <CardDescription>Track shipping progress and expected warehouse loading dates.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table id="po-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">PO Number</th>
                      <th className="p-4">Linked LPO</th>
                      <th className="p-4">Supplier Partner</th>
                      <th className="p-4">Date Sent</th>
                      <th className="p-4">Expected Delivery</th>
                      <th className="p-4">Total Value (KES)</th>
                      <th className="p-4">Freight Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {purchaseOrders.map((p) => (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedPO(p)}
                        className={`hover:bg-gray-50 cursor-pointer transition ${selectedPO?.id === p.id ? "bg-amber-50/40 border-l-4 border-amber-500" : ""}`}
                      >
                        <td className="p-4 font-mono font-bold text-xs text-amber-600">{p.poNumber}</td>
                        <td className="p-4 font-mono text-xs text-gray-500">{p.lpoNumber}</td>
                        <td className="p-4 font-medium text-gray-800">{p.supplierName}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{p.dateCreated}</td>
                        <td className="p-4 text-xs font-mono text-amber-600 font-medium">{p.expectedDeliveryDate}</td>
                        <td className="p-4 font-mono text-gray-900 font-bold">KES {p.totalAmount.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(p.deliveryStatus)}`}>
                            {p.deliveryStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {purchaseOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 italic">No Purchase Orders dispatched yet. Choose active LPO references to create one.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR VIEW PO DETAILS */}
        <div>
          {selectedPO ? (
            <Card id="inspect-po-card" className="border-amber-100 shadow-sm">
              <CardHeader className="bg-amber-50/30 border-b border-amber-100/50">
                <span className="font-mono text-xs font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                  {selectedPO.poNumber}
                </span>
                <CardTitle className="mt-2 text-base">Purchase Order Inspection</CardTitle>
                <CardDescription>Associated with {selectedPO.supplierName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase">Date Sent</span>
                    <span className="text-gray-800 font-medium block font-mono">{selectedPO.dateCreated}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase">SLA Delivery Target</span>
                    <span className="text-amber-600 font-bold block font-mono">{selectedPO.expectedDeliveryDate}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Freight Items Breakdown</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg max-h-48 overflow-y-auto">
                    {selectedPO.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between text-xs font-mono">
                        <div>
                          <span className="font-sans text-gray-800 font-semibold block">{it.productName}</span>
                          <span className="text-gray-400 text-[10px] block">SKU: {it.sku}</span>
                        </div>
                        <span className="text-gray-900 font-semibold align-middle mt-1">x{it.quantity} (KES {it.unitPrice.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-xs font-bold pt-2 text-gray-900 font-sans">
                    PO Commitment Value: <span className="font-mono text-amber-600">KES {selectedPO.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded text-xs text-amber-800">
                  <p className="font-semibold mb-1">📢 Dispatch Notification Sent</p>
                  <p className="text-[11px] leading-relaxed">
                    This PO has been securely dispatched to the supplier contact email ({selectedPO.supplierEmail}). Stamped receipts of delivery are expected on offloading.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400 p-4 text-center">
              Select a dispatched PO to inspect delivery deadlines, product quantities, and supplier records.
            </div>
          )}
        </div>
      </div>

      {/* DISPATCH PO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Dispatch Purchase Order (PO)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Linked LPO Commitment *</label>
                <select 
                  id="po-form-lpo"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                  value={lpoId}
                  onChange={e => setLpoId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Approved LPO --</option>
                  {availableLPOs.map(al => (
                    <option key={al.id} value={al.id}>{al.lpoNumber} - {al.supplierName} (KES {al.totalAmount.toLocaleString()})</option>
                  ))}
                </select>
                {availableLPOs.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠️ No approved unlinked LPO commitments available.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Expected SLA Delivery Date *</label>
                <Input 
                  id="po-form-delivery"
                  required 
                  type="date" 
                  value={expectedDeliveryDate} 
                  onChange={e => setExpectedDeliveryDate(e.target.value)}
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6">
                <Button id="btn-cancel-po-modal" type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-submit-po-modal" type="submit" variant="primary" className="flex-1">
                  Dispatch PO to Supplier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
