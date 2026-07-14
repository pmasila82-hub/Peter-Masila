import React, { useState } from "react";
import { 
  FileText, Plus, Search, HelpCircle, Warehouse, Calendar, CheckCircle2, ShieldAlert, Eye, X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Table } from "../../ui/Table";

interface GRNItem {
  productId: string;
  productName: string;
  sku: string;
  quantityReceived: number;
  condition: string;
  serialNumbers?: string[];
}

interface GRN {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrderNo?: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  receivedBy: string;
  deliveryNoteReference: string;
  receivedDate: string;
  comments?: string;
  items: GRNItem[];
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName?: string;
  deliveryStatus: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface WarehouseType {
  id: string;
  name: string;
  code: string;
}

interface GRNTabProps {
  grns: GRN[];
  purchaseOrders: PurchaseOrder[];
  warehouses: WarehouseType[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function GRNTab({ grns, purchaseOrders, warehouses, onRefresh, onShowNotification }: GRNTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);

  // Form State
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [deliveryNoteReference, setDeliveryNoteReference] = useState("");
  const [comments, setComments] = useState("");
  const [itemConditions, setItemConditions] = useState<Record<string, { qty: number; condition: string; serials: string }>>({});

  // Filter POs that are PENDING/SHIPPED and don't have a GRN yet
  const pendingPOs = purchaseOrders.filter(po => 
    po.deliveryStatus !== "DELIVERED" && !grns.some(g => g.purchaseOrderId === po.id)
  );

  const handlePOChange = (poId: string) => {
    setPurchaseOrderId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      const initialConditions: typeof itemConditions = {};
      po.items.forEach(it => {
        initialConditions[it.productId] = {
          qty: it.quantity,
          condition: "GOOD",
          serials: ""
        };
      });
      setItemConditions(initialConditions);
    } else {
      setItemConditions({});
    }
  };

  const handleConditionFieldChange = (prodId: string, field: "qty" | "condition" | "serials", val: any) => {
    setItemConditions(prev => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        [field]: val
      }
    }));
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrderId || !warehouseId || !deliveryNoteReference) {
      onShowNotification("Form Incomplete", "Please specify PO, warehouse destination, and delivery note reference.", "error");
      return;
    }

    // Format received items array matching backend expected fields
    const formattedItems = Object.keys(itemConditions).map(prodId => {
      const cond = itemConditions[prodId];
      return {
        productId: prodId,
        quantityReceived: cond.qty,
        condition: cond.condition,
        serialNumbers: cond.serials ? cond.serials.split(",").map(s => s.trim()).filter(s => s !== "") : []
      };
    });

    try {
      const res = await fetch("/api/v1/procurement/grns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          purchaseOrderId,
          warehouseId,
          deliveryNoteReference,
          comments,
          items: formattedItems
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("GRN Registered", "Goods Received Note logged. Inventory and Serial logs successfully synced.", "success");
        setShowAddModal(false);
        setPurchaseOrderId("");
        setWarehouseId("");
        setDeliveryNoteReference("");
        setComments("");
        setItemConditions({});
        onRefresh();
      } else {
        onShowNotification("GRN Failed", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to log GRN", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Goods Received Notes (GRN)</h2>
          <p className="text-sm text-gray-500">Log incoming shipments, trace warehouse arrivals, tag active hardware serials, and initiate automated stock updates.</p>
        </div>
        <Button id="btn-create-grn" variant="primary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus size={16} /> Log Goods Receipt (GRN)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card id="grn-list-card">
            <CardHeader>
              <CardTitle>Warehouse Loading Logs</CardTitle>
              <CardDescription>Review receipts of hardware deliveries and inventory placement history.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table id="grn-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">GRN Number</th>
                    <th className="p-4">Linked PO</th>
                    <th className="p-4">Supplier Partner</th>
                    <th className="p-4">Warehouse Dest</th>
                    <th className="p-4">Delivery Note Ref</th>
                    <th className="p-4">Date Received</th>
                    <th className="p-4">Receiver Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {grns.map((g) => (
                    <tr 
                      key={g.id} 
                      onClick={() => setSelectedGRN(g)}
                      className={`hover:bg-gray-50 cursor-pointer transition ${selectedGRN?.id === g.id ? "bg-amber-50/40 border-l-4 border-amber-500" : ""}`}
                    >
                      <td className="p-4 font-mono font-bold text-xs text-amber-600">{g.grnNumber}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{g.purchaseOrderNo}</td>
                      <td className="p-4 font-medium text-gray-800">{g.supplierName}</td>
                      <td className="p-4 text-xs font-semibold text-blue-800 flex items-center gap-1 mt-1">
                        <Warehouse size={12} className="text-blue-500" />
                        {g.warehouseName}
                      </td>
                      <td className="p-4 text-xs font-mono text-gray-500">{g.deliveryNoteReference}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{g.receivedDate}</td>
                      <td className="p-4 text-xs text-gray-600 font-medium">{g.receivedBy}</td>
                    </tr>
                  ))}
                  {grns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 italic">No GRN arrivals recorded. Choose active dispatched POs to load stock.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* DETAILS SIDEBAR */}
        <div>
          {selectedGRN ? (
            <Card id="inspect-grn-card" className="border-amber-100 shadow-sm">
              <CardHeader className="bg-amber-50/30 border-b border-amber-100/50">
                <span className="font-mono text-xs font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                  {selectedGRN.grnNumber}
                </span>
                <CardTitle className="mt-2 text-base">GRN Loading Audit</CardTitle>
                <CardDescription>Stocked in {selectedGRN.warehouseName} by {selectedGRN.receivedBy}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-400 block font-sans font-semibold uppercase">Delivery Note Ref</span>
                    <span className="text-gray-800 font-medium block mt-0.5">{selectedGRN.deliveryNoteReference}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-sans font-semibold uppercase">Date Received</span>
                    <span className="text-gray-800 font-medium block mt-0.5">{selectedGRN.receivedDate}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Stored Goods Breakdown</h4>
                  <div className="space-y-2">
                    {selectedGRN.items.map((it, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        <div className="flex justify-between font-semibold text-gray-800">
                          <span>{it.productName}</span>
                          <span>Qty: {it.quantityReceived}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                          <span>SKU: {it.sku}</span>
                          <span className={`px-1 rounded ${it.condition === "GOOD" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            {it.condition}
                          </span>
                        </div>
                        {it.serialNumbers && it.serialNumbers.length > 0 && (
                          <div className="mt-2 text-[10px] font-mono text-gray-500 bg-white p-1.5 rounded border border-gray-100/50">
                            <span className="font-semibold block text-gray-400">Tracked Serial Numbers:</span>
                            {it.serialNumbers.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedGRN.comments && (
                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold uppercase text-gray-400 block">Warehouse Remarks</span>
                    <p className="text-xs text-gray-500 italic mt-1 bg-gray-50/50 p-2 rounded">
                      "{selectedGRN.comments}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400 p-4 text-center">
              Select an offloaded GRN to inspect loaded product counts, registered equipment serial parameters, and storage targets.
            </div>
          )}
        </div>
      </div>

      {/* CREATE GRN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Log incoming goods (GRN)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateGRN} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Select Dispatched PO *</label>
                  <select 
                    id="grn-form-po"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                    value={purchaseOrderId}
                    onChange={e => handlePOChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Active PO --</option>
                    {pendingPOs.map(po => (
                      <option key={po.id} value={po.id}>{po.poNumber} - {po.supplierName}</option>
                    ))}
                  </select>
                  {pendingPOs.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">⚠️ No new dispatched POs available for reception.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Target Storage Warehouse *</label>
                  <select 
                    id="grn-form-wh"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Warehouse --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier Delivery Note Code / Reference *</label>
                <Input 
                  id="grn-form-ref"
                  required 
                  placeholder="e.g. DN-HUA-8902" 
                  value={deliveryNoteReference} 
                  onChange={e => setDeliveryNoteReference(e.target.value)}
                />
              </div>

              {/* Dynamic PO line conditions inputs */}
              {purchaseOrderId && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Declare Item Conditions and Serials</h4>
                  
                  {(() => {
                    const selectedPO = purchaseOrders.find(p => p.id === purchaseOrderId);
                    if (!selectedPO) return null;
                    return selectedPO.items.map(it => {
                      const cond = itemConditions[it.productId] || { qty: it.quantity, condition: "GOOD", serials: "" };
                      return (
                        <div key={it.productId} className="bg-gray-50 p-4 rounded border border-gray-100 text-xs space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800 text-sm">{it.productName}</span>
                            <span className="text-gray-400 font-mono">PO Qty: {it.quantity} (SKU: {it.sku})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Qty Received *</label>
                              <Input 
                                id={`grn-item-qty-${it.productId}`}
                                type="number" 
                                min="1" 
                                max={it.quantity} 
                                value={cond.qty}
                                onChange={e => handleConditionFieldChange(it.productId, "qty", parseInt(e.target.value) || 0)}
                                className="py-1 px-2 text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Offloaded Condition *</label>
                              <select 
                                id={`grn-item-cond-${it.productId}`}
                                className="w-full text-xs border border-gray-200 rounded p-1.5 bg-white"
                                value={cond.condition}
                                onChange={e => handleConditionFieldChange(it.productId, "condition", e.target.value)}
                                required
                              >
                                <option value="GOOD">GOOD (Brand new sealed)</option>
                                <option value="DAMAGED">DAMAGED (Seal broken / transit wear)</option>
                                <option value="REFURBISHED">REFURBISHED (Tested ok)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Register Serials (Comma-separated for serialized hardware tracking)</label>
                            <Input 
                              id={`grn-item-serials-${it.productId}`}
                              placeholder="e.g. SN-HUAWEI-9001, SN-HUAWEI-9002..." 
                              value={cond.serials}
                              onChange={e => handleConditionFieldChange(it.productId, "serials", e.target.value)}
                              className="font-mono py-1 px-2 text-xs"
                            />
                            <p className="text-[9px] text-gray-400 mt-0.5">Please separate multiple hardware nodes with commas.</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Reception remarks</label>
                <textarea 
                  id="grn-form-comments"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded p-3 bg-white"
                  placeholder="Notes about box completeness, seal status..."
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6 shrink-0">
                <Button id="btn-cancel-grn-modal" type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-submit-grn-modal" type="submit" variant="primary" className="flex-1">
                  Log GRN & Populate Inventory
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
