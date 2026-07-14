import React, { useState } from "react";
import { 
  ShieldCheck, Check, X, AlertCircle, Eye, FileText, Calendar, MessageSquare, ListFilter
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
  role: "DEPT_MANAGER" | "PROCUREMENT_OFFICER" | "MANAGEMENT";
  approverName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
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

interface ApprovalTabProps {
  requests: PurchaseRequest[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function ApprovalTab({ requests, onRefresh, onShowNotification }: ApprovalTabProps) {
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [comments, setComments] = useState("");
  const [activeRole, setActiveRole] = useState<"DEPT_MANAGER" | "PROCUREMENT_OFFICER" | "MANAGEMENT">("DEPT_MANAGER");

  // Filter requests that are in the state SUBMITTED or APPROVED, and have an active pending approval for the selected role
  const pendingApprovals = requests.filter(r => {
    if (r.status === "DRAFT" || r.status === "COMPLETED" || r.status === "REJECTED") return false;
    
    // Find the approval stage corresponding to the active role
    const stage = r.approvals.find(a => a.role === activeRole);
    return stage && stage.status === "PENDING";
  });

  const handleActionApproval = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedPR) return;
    try {
      const res = await fetch(`/api/v1/procurement/requests/${selectedPR.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          role: activeRole,
          decision,
          comments: comments || `${decision} in capacity of ${activeRole.replace("_", " ")}.`
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(
          `Request ${decision}`,
          `Purchase Request ${selectedPR.requestNo} has been marked ${decision.toLowerCase()}.`,
          decision === "APPROVED" ? "success" : "info"
        );
        setSelectedPR(null);
        setComments("");
        onRefresh();
      } else {
        onShowNotification("Action Failed", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to process workflow action", "error");
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-sans">Multi-Stage Approval Workflows</h2>
        <p className="text-sm text-gray-500">Inspect internally routed demands, check budgets and reasons, and approve or reject according to organizational authority tiers.</p>
      </div>

      {/* Role Selection Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-lg max-w-lg border border-gray-200">
        {(["DEPT_MANAGER", "PROCUREMENT_OFFICER", "MANAGEMENT"] as const).map(role => (
          <button
            key={role}
            onClick={() => {
              setActiveRole(role);
              setSelectedPR(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition duration-150 ${
              activeRole === role 
                ? "bg-white text-indigo-700 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {role === "DEPT_MANAGER" && "1. Dept Manager"}
            {role === "PROCUREMENT_OFFICER" && "2. Procurement"}
            {role === "MANAGEMENT" && "3. Managing Director"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Requests list */}
        <div className="lg:col-span-2 space-y-4">
          <Card id="pending-approvals-card">
            <CardHeader className="flex flex-row justify-between items-center bg-indigo-50/20 border-b border-indigo-50/50">
              <div>
                <CardTitle className="text-indigo-900 text-base">Pending Approvals Queue</CardTitle>
                <CardDescription>Awaiting authorization for role: <strong className="text-indigo-600">{activeRole.replace("_", " ")}</strong></CardDescription>
              </div>
              <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs font-mono">
                {pendingApprovals.length} item(s)
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table id="pending-approvals-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Request No</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Requested By</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4 font-mono">Cost Value</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {pendingApprovals.map((r) => {
                      const estCost = r.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0);
                      return (
                        <tr 
                          key={r.id} 
                          onClick={() => setSelectedPR(r)}
                          className={`hover:bg-gray-50 cursor-pointer transition ${selectedPR?.id === r.id ? "bg-indigo-50/40 border-l-4 border-indigo-600" : ""}`}
                        >
                          <td className="p-4 font-mono font-bold text-xs text-indigo-600">{r.requestNo}</td>
                          <td className="p-4 font-medium text-gray-800">{r.department}</td>
                          <td className="p-4 text-gray-600">{r.requestedBy}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getPriorityBadge(r.priority)}`}>
                              {r.priority}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-900 font-semibold">KES {estCost.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <Button id={`btn-inspect-app-${r.id}`} variant="outline" size="sm" className="text-xs h-auto py-1">
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {pendingApprovals.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">No purchase requests pending your authorization in this tier level.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Inspection & Action details */}
        <div>
          {selectedPR ? (
            <Card id="inspect-action-card" className="border-indigo-100 shadow-sm">
              <CardHeader className="bg-indigo-50/30 border-b border-indigo-100/50">
                <span className="font-mono text-xs font-bold text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded">
                  {selectedPR.requestNo}
                </span>
                <CardTitle className="mt-2 text-base">Purchase Request Audit</CardTitle>
                <CardDescription>Submitted by {selectedPR.requestedBy} on {selectedPR.date}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-400">Justification Comments</h4>
                  <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-100 mt-1 italic">
                    "{selectedPR.reason}"
                  </p>
                </div>

                {/* Items Summary list */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase text-gray-400">Bill of Materials</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg max-h-40 overflow-y-auto">
                    {selectedPR.items.map((it, idx) => (
                      <div key={idx} className="p-2 flex justify-between text-xs font-mono">
                        <span className="font-sans text-gray-800 font-medium truncate pr-2">{it.productName}</span>
                        <span className="text-gray-500 shrink-0">x{it.quantity} (KES {it.estimatedUnitCost.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-xs font-semibold pt-1 font-sans text-gray-900">
                    Grand Total Estimate: <span className="font-mono text-indigo-700">KES {selectedPR.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Previous stage history */}
                <div className="space-y-1 border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-semibold uppercase text-gray-400">Approval Steps Completed</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedPR.approvals.filter(a => a.status !== "PENDING").map(a => (
                      <div key={a.id} className="text-[11px] bg-gray-50 p-1.5 rounded flex justify-between items-start">
                        <div>
                          <strong className="text-gray-800">{a.role.replace("_", " ")}:</strong>
                          <span className="text-gray-500 block text-[10px] italic">"{a.comments}"</span>
                        </div>
                        <span className={`px-1 rounded text-[9px] font-bold ${a.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                    {selectedPR.approvals.filter(a => a.status !== "PENDING").length === 0 && (
                      <p className="text-[11px] text-gray-400 italic">This is the initial approval gate.</p>
                    )}
                  </div>
                </div>

                {/* Comments Box */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Audit Comments / Reason for decision *</label>
                  <textarea
                    id="approval-comment"
                    rows={2}
                    placeholder="Enter audit remarks or feedback..."
                    className="w-full text-xs border border-gray-200 rounded p-2"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    id="btn-reject-request"
                    type="button"
                    variant="outline"
                    onClick={() => handleActionApproval("REJECTED")}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5 text-xs py-2"
                  >
                    <X size={14} /> Reject
                  </Button>
                  <Button
                    id="btn-approve-request"
                    type="button"
                    variant="primary"
                    onClick={() => handleActionApproval("APPROVED")}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 text-xs py-2"
                  >
                    <Check size={14} /> Authorize
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400 p-4 text-center">
              Select an item from the queue to run the audit checks and complete the approval actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
