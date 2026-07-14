import React, { useState } from "react";
import { 
  FileText, Plus, Search, MapPin, CreditCard, Eye, Printer, Calendar, ShieldCheck, CheckSquare, X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface LPOItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface LPO {
  id: string;
  lpoNumber: string;
  purchaseRequestId: string;
  purchaseRequestNo?: string;
  supplierId: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  date: string;
  deliveryLocation: string;
  paymentTerms: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "APPROVED" | "CANCELLED" | "COMPLETED";
  items: LPOItem[];
  createdAt: string;
}

interface Supplier {
  id: string;
  vendorCode: string;
  companyName: string;
}

interface PurchaseRequest {
  id: string;
  requestNo: string;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    estimatedUnitCost: number;
  }>;
}

interface LPOTabProps {
  lpos: LPO[];
  suppliers: Supplier[];
  requests: PurchaseRequest[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function LPOTab({ lpos, suppliers, requests, onRefresh, onShowNotification }: LPOTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewLPO, setViewLPO] = useState<LPO | null>(null);

  // Form State
  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [terms, setTerms] = useState("Net 30 Days bank transfer on invoice.");
  const [deliveryLocation, setDeliveryLocation] = useState("Celcom Networks Head Office, Westlands, Nairobi");

  // Filter requests that are fully APPROVED and do not have an LPO yet
  const approvedRequests = requests.filter(r => 
    r.status === "APPROVED" && !lpos.some(l => l.purchaseRequestId === r.id)
  );

  const handleCreateLPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseRequestId || !supplierId) {
      onShowNotification("Invalid Form", "Please select an approved request and a supplier", "error");
      return;
    }

    try {
      const res = await fetch("/api/v1/procurement/lpos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          purchaseRequestId,
          supplierId,
          terms,
          deliveryLocation
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("LPO Generated", "Successfully created Local Purchase Order " + data.lpo.lpoNumber, "success");
        setShowAddModal(false);
        setPurchaseRequestId("");
        setSupplierId("");
        onRefresh();
      } else {
        onShowNotification("LPO Generation Failed", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to contact LPO API", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Local Purchase Orders (LPO)</h2>
          <p className="text-sm text-gray-500">Transform approved purchase demands into official binding commercial contracts (LPOs) matching Celcom networks branding.</p>
        </div>
        <Button id="btn-generate-lpo" variant="primary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus size={16} /> Generate New LPO
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card id="lpo-list-card">
          <CardHeader>
            <CardTitle>LPO Registry</CardTitle>
            <CardDescription>Track state of legal business procurement commits and supplier delivery specs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table id="lpo-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">LPO Number</th>
                    <th className="p-4">Linked PR</th>
                    <th className="p-4">Supplier Partner</th>
                    <th className="p-4">Date Issued</th>
                    <th className="p-4">Payment Terms</th>
                    <th className="p-4">Total Amount (KES)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {lpos.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-mono font-bold text-xs text-amber-600">{l.lpoNumber}</td>
                      <td className="p-4 font-mono text-xs text-indigo-500">{l.purchaseRequestNo}</td>
                      <td className="p-4 font-medium text-gray-800">{l.supplierName}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{l.date}</td>
                      <td className="p-4 text-xs text-gray-600">{l.paymentTerms}</td>
                      <td className="p-4 font-mono text-gray-900 font-bold">KES {l.totalAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button id={`btn-view-lpo-${l.id}`} variant="outline" size="sm" onClick={() => setViewLPO(l)} className="px-2 py-1 h-auto text-xs flex items-center gap-1 inline-flex">
                          <Eye size={12} /> View Document
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {lpos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 italic">No Local Purchase Orders created yet. Click Generate New LPO above to bind a request.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GENERATE LPO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg font-sans">Generate Local Purchase Order</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateLPO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Approved Purchase Demand *</label>
                <select 
                  id="lpo-form-pr"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                  value={purchaseRequestId}
                  onChange={e => setPurchaseRequestId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Approved PR --</option>
                  {approvedRequests.map(ar => (
                    <option key={ar.id} value={ar.id}>{ar.requestNo} - (KES {ar.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0).toLocaleString()})</option>
                  ))}
                </select>
                {approvedRequests.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠️ No new unlinked APPROVED purchase requests available in queue.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier Partner *</label>
                <select 
                  id="lpo-form-supplier"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- Select Active Partner --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName} ({s.vendorCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Location Destination *</label>
                <Input 
                  id="lpo-form-location"
                  required 
                  value={deliveryLocation} 
                  onChange={e => setDeliveryLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Commercial Settlement Terms *</label>
                <textarea 
                  id="lpo-form-terms"
                  required 
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded p-3 bg-white"
                  value={terms} 
                  onChange={e => setTerms(e.target.value)}
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6">
                <Button id="btn-cancel-lpo" type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-submit-lpo" type="submit" variant="primary" className="flex-1">
                  Commit and Approve LPO
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LPO COORPORATE DOCUMENT MODAL */}
      {viewLPO && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8">
            {/* Header controls */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100 shrink-0 print:hidden">
              <span className="text-xs font-bold font-mono text-gray-500">Commercial Contract Document (LPO)</span>
              <div className="flex gap-2">
                <Button id="btn-print-lpo" onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-1">
                  <Printer size={14} /> Print / Save PDF
                </Button>
                <button onClick={() => setViewLPO(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Vector Canvas with Celcom Networks Branding */}
            <div id="print-area" className="p-8 space-y-6 font-sans">
              {/* Celcom Corporate Header */}
              <div className="flex justify-between items-start border-b-4 border-amber-500 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-blue-900 font-sans tracking-tight">CELCOM NETWORKS LIMITED</h1>
                  <p className="text-xs text-gray-500 mt-0.5">High-Speed Broadband & Enterprise IT Infrastructure Services</p>
                  <p className="text-[11px] text-gray-400">P.O. Box 45000-00100, Westlands, Nairobi, Kenya | info@celcomnetworks.co.ke</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                    LOCAL PURCHASE ORDER
                  </span>
                  <div className="text-xs text-gray-500 mt-2">
                    LPO No: <strong className="text-gray-800 font-mono">{viewLPO.lpoNumber}</strong>
                  </div>
                  <div className="text-xs text-gray-500">
                    Date: <strong className="text-gray-800 font-mono">{viewLPO.date}</strong>
                  </div>
                </div>
              </div>

              {/* Vendor & Delivery info grids */}
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-2">Vendor Partner (Supplier)</h3>
                  <div className="text-sm font-bold text-gray-900">{viewLPO.supplierName}</div>
                  <div className="text-gray-600 mt-1">Contact: {viewLPO.supplierPhone}</div>
                  <div className="text-gray-600">Email: {viewLPO.supplierEmail}</div>
                  <div className="text-gray-600">Address: {viewLPO.supplierAddress}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery & Freight Spec</h3>
                  <div className="flex items-start gap-1 mt-1">
                    <MapPin size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-gray-800"><strong className="text-gray-900">Destination:</strong> {viewLPO.deliveryLocation}</span>
                  </div>
                  <div className="flex items-start gap-1 mt-2">
                    <CreditCard size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-gray-800"><strong className="text-gray-900">Terms:</strong> {viewLPO.paymentTerms}</span>
                  </div>
                  <div className="text-gray-500 mt-2 font-mono text-[10px]">Reference PR: {viewLPO.purchaseRequestNo}</div>
                </div>
              </div>

              {/* Items Table */}
              <div>
              <div className="w-full overflow-x-auto">
                <table id="view-lpo-items-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white text-left text-xs uppercase">
                      <th className="p-3 rounded-l">Product Description</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right rounded-r">Extended Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-mono text-gray-800">
                    {viewLPO.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-sans text-gray-900 font-medium">{it.productName}</td>
                        <td className="p-3 text-gray-500">{it.sku}</td>
                        <td className="p-3 text-right font-bold text-gray-900">{it.quantity}</td>
                        <td className="p-3 text-right">KES {it.unitPrice.toLocaleString()}</td>
                        <td className="p-3 text-right text-gray-900 font-bold">KES {(it.quantity * it.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="font-sans border-t-2 border-gray-200">
                      <td colSpan={3} className="p-2"></td>
                      <td className="p-2 text-right text-xs font-medium text-gray-500">Sub Total:</td>
                      <td className="p-2 text-right text-xs font-mono font-medium text-gray-800">KES {viewLPO.subTotal.toLocaleString()}</td>
                    </tr>
                    <tr className="font-sans">
                      <td colSpan={3} className="p-2"></td>
                      <td className="p-2 text-right text-xs font-medium text-gray-500">VAT (16%):</td>
                      <td className="p-2 text-right text-xs font-mono font-medium text-gray-800">KES {viewLPO.vatAmount.toLocaleString()}</td>
                    </tr>
                    <tr className="font-sans bg-gray-50 border-t border-gray-200 font-bold text-sm">
                      <td colSpan={3} className="p-3"></td>
                      <td className="p-3 text-right text-blue-900 uppercase">Gross Commitment:</td>
                      <td className="p-3 text-right font-mono text-blue-900">KES {viewLPO.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </div>

              {/* Legal Terms & Authorized Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-8 text-xs border-t border-gray-100">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900">Commercial Terms & Declarations</h4>
                  <p className="text-gray-500 text-[10px] leading-relaxed">
                    1. Deliveries must correspond precisely with catalog items and SKUs specified.<br />
                    2. Invoices will only be settled if matched directly with a stamped GRN note.<br />
                    3. Under penalty of cancellation, provide delivery updates within 48 hours of dispatch.
                  </p>
                </div>
                <div className="flex flex-col justify-end space-y-8">
                  <div className="border-b border-gray-300 w-full h-8 flex items-end justify-center font-serif text-sm italic text-blue-800 font-bold">
                    Eng. J. Kiprop
                  </div>
                  <div className="text-center font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                    Authorized Signatory & Stamp<br />
                    <span className="text-gray-500 block font-normal">Celcom networks managing director</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 print:hidden text-center">
              <Button id="btn-close-pdf-preview" onClick={() => setViewLPO(null)} className="px-8">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
