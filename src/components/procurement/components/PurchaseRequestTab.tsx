import React, { useState } from "react";
import { 
  FileText, Plus, Search, HelpCircle, FileCheck2, Trash2, Calendar, Eye, Send, AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface PRItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  estimatedUnitCost: number;
}

interface PRWorkflow {
  id: string;
  role: string;
  approverName: string;
  status: string;
  comments: string;
  actionedAt?: string;
}

interface PurchaseRequest {
  id: string;
  requestNo: string;
  department: string;
  requestedBy: string;
  date: string;
  requiredDate: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED";
  items: PRItem[];
  approvals: PRWorkflow[];
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
}

interface PurchaseRequestTabProps {
  requests: PurchaseRequest[];
  products: Product[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function PurchaseRequestTab({ requests, products, onRefresh, onShowNotification }: PurchaseRequestTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRequest, setViewRequest] = useState<PurchaseRequest | null>(null);

  // Form state
  const [department, setDepartment] = useState("Technical Operations");
  const [requiredDate, setRequiredDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Omit<PRItem, "productName" | "sku">[]>([
    { productId: "", quantity: 1, estimatedUnitCost: 0 }
  ]);

  const handleAddItemRow = () => {
    setItems([...items, { productId: "", quantity: 1, estimatedUnitCost: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    if (field === "productId") {
      updated[index].productId = val;
      const selectedProd = products.find(p => p.id === val);
      if (selectedProd) {
        updated[index].estimatedUnitCost = selectedProd.costPrice;
      }
    } else if (field === "quantity") {
      updated[index].quantity = parseInt(val) || 1;
    } else if (field === "estimatedUnitCost") {
      updated[index].estimatedUnitCost = parseFloat(val) || 0;
    }
    setItems(updated);
  };

  const handleSubmitPR = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate rows
    const validItems = items.filter(i => i.productId !== "");
    if (validItems.length === 0) {
      onShowNotification("Drafting Rejected", "Please select at least one valid product item.", "error");
      return;
    }

    // Map items to include sku & product name from state for local fallback accuracy
    const mappedItems = validItems.map(vi => {
      const p = products.find(prod => prod.id === vi.productId);
      return {
        productId: vi.productId,
        productName: p ? p.name : "Product",
        sku: p ? p.sku : "SKU",
        quantity: vi.quantity,
        estimatedUnitCost: vi.estimatedUnitCost
      };
    });

    try {
      const res = await fetch("/api/v1/procurement/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          department,
          date: new Date().toISOString().split("T")[0],
          requiredDate: requiredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          reason,
          priority,
          items: mappedItems
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Request Drafted", "Purchase request has been created as draft.", "success");
        setShowAddModal(false);
        // Reset
        setDepartment("Technical Operations");
        setRequiredDate("");
        setPriority("MEDIUM");
        setReason("");
        setItems([{ productId: "", quantity: 1, estimatedUnitCost: 0 }]);
        onRefresh();
      } else {
        onShowNotification("Drafting Failed", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to create PR", "error");
    }
  };

  const handleDispatchToWorkflow = async (prId: string) => {
    try {
      const res = await fetch(`/api/v1/procurement/requests/${prId}/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Workflow Initiated", "Request forwarded to departmental approval workflow queue.", "success");
        onRefresh();
        if (viewRequest?.id === prId) {
          setViewRequest(null);
        }
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to dispatch request", "error");
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "CRITICAL": return "bg-red-100 text-red-700 font-bold border border-red-200";
      case "HIGH": return "bg-amber-100 text-amber-800 border border-amber-200";
      case "MEDIUM": return "bg-blue-100 text-blue-800 border border-blue-200";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "APPROVED": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "REJECTED": return "bg-red-50 text-red-700 border border-red-200";
      case "SUBMITTED": return "bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse";
      default: return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Internal Purchase Requests (PR)</h2>
          <p className="text-sm text-gray-500">Draft internal procurement demands, declare reasons, select quantities, and route for automated multi-stage approvals.</p>
        </div>
        <Button id="btn-create-pr" variant="primary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus size={16} /> Draft Purchase Request
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card id="pr-list-card">
          <CardHeader>
            <CardTitle>Roster of Purchase Demands</CardTitle>
            <CardDescription>Track state of internal requests, from draft initiation up to completed warehouse supply order conversion.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table id="pr-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Request No</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Requested By</th>
                    <th className="p-4">Date Logged</th>
                    <th className="p-4">Required By</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Est Cost (KES)</th>
                    <th className="p-4">Workflow Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {requests.map((r) => {
                    const estCost = r.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-mono font-medium text-xs text-indigo-600">{r.requestNo}</td>
                        <td className="p-4 font-medium text-gray-800">{r.department}</td>
                        <td className="p-4 text-gray-600">{r.requestedBy}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{r.date}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{r.requiredDate}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getPriorityBadge(r.priority)}`}>
                            {r.priority}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-gray-900 font-medium">KES {estCost.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button id={`btn-view-pr-${r.id}`} variant="outline" size="sm" onClick={() => setViewRequest(r)} className="px-2 py-1 h-auto text-xs flex items-center gap-1 inline-flex">
                            <Eye size={12} /> Inspect
                          </Button>
                          {r.status === "DRAFT" && (
                            <Button id={`btn-submit-pr-${r.id}`} variant="secondary" size="sm" onClick={() => handleDispatchToWorkflow(r.id)} className="px-2 py-1 h-auto text-xs inline-flex items-center gap-1">
                              <Send size={12} /> Dispatch
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400 italic">No purchase requests logged yet. Click Draft Purchase Request above to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRAFT PURCHASE REQUEST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Draft Internal Purchase Demand</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmitPR} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Target Department *</label>
                  <select 
                    id="pr-form-dept"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  >
                    <option value="Technical Operations">Technical Operations</option>
                    <option value="Fibre Engineering">Fibre Engineering</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Required By Date *</label>
                  <Input 
                    id="pr-form-req-date"
                    required 
                    type="date" 
                    value={requiredDate} 
                    onChange={e => setRequiredDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Workflow Priority *</label>
                  <select 
                    id="pr-form-priority"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                  >
                    <option value="LOW">LOW (Standard stock replenish)</option>
                    <option value="MEDIUM">MEDIUM (Standard installation rollout)</option>
                    <option value="HIGH">HIGH (Urgent client rollout)</option>
                    <option value="CRITICAL">CRITICAL (Backbone equipment failure)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Estimated Cost Aggregate</label>
                  <div className="w-full text-sm border border-gray-100 bg-gray-50 rounded px-3 py-2 font-mono font-bold text-gray-700">
                    KES {items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Detailed Purpose / Reason for Purchase *</label>
                <textarea 
                  id="pr-form-reason"
                  required
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded p-3 bg-white"
                  placeholder="Explain why this equipment/licence is needed..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-900">Requested Items</h4>
                  <Button id="btn-pr-add-item-row" type="button" variant="secondary" size="sm" onClick={handleAddItemRow} className="text-xs h-auto py-1 px-2">
                    + Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded border border-gray-100">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Select Product *</label>
                      <select 
                        id={`pr-item-select-${index}`}
                        className="w-full text-xs border border-gray-200 rounded p-1.5 bg-white"
                        value={item.productId}
                        onChange={e => handleItemChange(index, "productId", e.target.value)}
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Qty *</label>
                      <Input 
                        id={`pr-item-qty-${index}`}
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={e => handleItemChange(index, "quantity", e.target.value)}
                        className="py-1 text-xs px-2 h-auto"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Est Unit Cost (KES)</label>
                      <Input 
                        id={`pr-item-cost-${index}`}
                        type="number" 
                        value={item.estimatedUnitCost} 
                        onChange={e => handleItemChange(index, "estimatedUnitCost", e.target.value)}
                        className="py-1 text-xs px-2 h-auto font-mono"
                        required
                      />
                    </div>
                    <div>
                      <Button id={`btn-pr-remove-row-${index}`} type="button" variant="outline" onClick={() => handleRemoveItemRow(index)} className="p-1.5 border-gray-200 text-red-500 hover:bg-red-50 h-auto">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6 shrink-0">
                <Button id="btn-pr-form-cancel" type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-pr-form-save" type="submit" variant="primary" className="flex-1">
                  Save Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT PURCHASE REQUEST DETAILS AND WORKFLOW PROGRESS */}
      {viewRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded">
                  {viewRequest.requestNo}
                </span>
                <h3 className="font-bold text-gray-900 text-lg">Purchase Demand Inspection</h3>
              </div>
              <button onClick={() => setViewRequest(null)} className="text-gray-400 hover:text-gray-600">
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-xs">
                <div>
                  <div className="text-gray-400 uppercase font-semibold">Department</div>
                  <div className="text-gray-800 font-medium mt-0.5">{viewRequest.department}</div>
                </div>
                <div>
                  <div className="text-gray-400 uppercase font-semibold">Initiated By</div>
                  <div className="text-gray-800 font-medium mt-0.5">{viewRequest.requestedBy}</div>
                </div>
                <div>
                  <div className="text-gray-400 uppercase font-semibold">Required By</div>
                  <div className="text-gray-800 font-medium mt-0.5 font-mono">{viewRequest.requiredDate}</div>
                </div>
                <div>
                  <div className="text-gray-400 uppercase font-semibold">Priority Status</div>
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPriorityBadge(viewRequest.priority)}`}>
                      {viewRequest.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Detailed Justification</h4>
                <p className="text-sm text-gray-600 bg-gray-50/50 p-3 rounded border border-gray-100">{viewRequest.reason}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Requested Items Directory</h4>
                <div className="w-full overflow-x-auto">
                  <table id="view-pr-items-table" className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Est Unit Price</th>
                        <th className="p-3 text-right">Ext Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-mono text-gray-700">
                      {viewRequest.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-sans text-gray-900 font-medium">{it.productName}</td>
                          <td className="p-3">{it.sku}</td>
                          <td className="p-3 font-semibold text-gray-800">{it.quantity}</td>
                          <td className="p-3">KES {it.estimatedUnitCost.toLocaleString()}</td>
                          <td className="p-3 text-right text-gray-900 font-bold">KES {(it.quantity * it.estimatedUnitCost).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                        <td colSpan={4} className="p-3 text-right font-sans">Estimated Cost Sum:</td>
                        <td className="p-3 text-right">
                          KES {viewRequest.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Approval stages trace */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Multi-Stage Approval Trace</h4>
                <div className="relative border-l-2 border-gray-100 pl-6 space-y-4 ml-3">
                  {viewRequest.approvals.map((ap, index) => (
                    <div key={ap.id} className="relative">
                      {/* circle status indicator */}
                      <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                        ap.status === "APPROVED" ? "bg-emerald-500 border-emerald-500" :
                        ap.status === "REJECTED" ? "bg-red-500 border-red-500" :
                        ap.status === "PENDING" ? "bg-indigo-400 border-indigo-400 animate-pulse" :
                        "bg-gray-200 border-gray-200"
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{ap.role.replace("_", " ")}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            ap.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                            ap.status === "REJECTED" ? "bg-red-50 text-red-700" :
                            ap.status === "PENDING" ? "bg-indigo-50 text-indigo-700 animate-pulse" :
                            "bg-gray-100 text-gray-400"
                          }`}>{ap.status}</span>
                        </div>
                        {ap.approverName && (
                          <div className="text-xs text-gray-600 mt-0.5">Actioned By: <strong className="text-gray-800">{ap.approverName}</strong></div>
                        )}
                        {ap.comments && (
                          <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-2 rounded border border-gray-100">"{ap.comments}"</p>
                        )}
                        {ap.actionedAt && (
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">{ap.actionedAt}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 shrink-0 bg-gray-50 flex gap-4">
              <Button id="btn-close-view-pr" variant="outline" onClick={() => setViewRequest(null)} className="flex-1">
                Close Inspector
              </Button>
              {viewRequest.status === "DRAFT" && (
                <Button id="btn-inspect-dispatch-pr" variant="primary" onClick={() => handleDispatchToWorkflow(viewRequest.id)} className="flex-1">
                  Forward to Workflow
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
