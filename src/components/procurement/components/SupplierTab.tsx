import React, { useState } from "react";
import { 
  Building, User, Phone, Mail, MapPin, CreditCard, Award, 
  Plus, Search, ShieldCheck, Star, FileText, CheckCircle, X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface SupplierDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

interface SupplierHistory {
  id: string;
  eventType: string;
  details: string;
  performedBy: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  physicalAddress: string;
  kraPin: string;
  vatNumber: string;
  bankDetails: string;
  paymentTermsDays: number;
  supplierCategory: string;
  status: "ACTIVE" | "INACTIVE";
  rating: number;
  documents: SupplierDocument[];
  history: SupplierHistory[];
  createdAt: string;
}

interface SupplierTabProps {
  suppliers: Supplier[];
  onRefresh: () => void;
  onShowNotification: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export function SupplierTab({ suppliers, onRefresh, onShowNotification }: SupplierTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Rating and document upload state
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docFileName, setDocFileName] = useState("");

  const [form, setForm] = useState({
    vendorCode: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    physicalAddress: "",
    kraPin: "",
    vatNumber: "",
    bankDetails: "",
    paymentTermsDays: 30,
    supplierCategory: "Networking Equipment",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    rating: 5
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/procurement/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Supplier Registered", "Successfully registered " + form.companyName, "success");
        setShowAddModal(false);
        setForm({
          vendorCode: "",
          companyName: "",
          contactPerson: "",
          phone: "",
          email: "",
          physicalAddress: "",
          kraPin: "",
          vatNumber: "",
          bankDetails: "",
          paymentTermsDays: 30,
          supplierCategory: "Networking Equipment",
          status: "ACTIVE",
          rating: 5
        });
        onRefresh();
      } else {
        onShowNotification("Registration Failed", data.message, "error");
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Failed to contact API", "error");
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      const res = await fetch(`/api/v1/procurement/suppliers/${selectedSupplier.id}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          title: docTitle,
          fileName: docFileName || "compliance_audit.pdf",
          fileSize: 1024 * 1024 * 2, // 2MB Placeholder
          fileType: "application/pdf"
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Document Uploaded", "Supplier document registered successfully", "success");
        setDocTitle("");
        setDocFileName("");
        onRefresh();
        // Update local detail view
        const updated = { ...selectedSupplier };
        updated.documents.push(data.document);
        setSelectedSupplier(updated);
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Document upload failed", "error");
    }
  };

  const handleRateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      const res = await fetch(`/api/v1/procurement/suppliers/${selectedSupplier.id}/rating`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          rating: ratingVal,
          details: ratingComment
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Rating Logged", "Supplier performance analysis complete", "success");
        setRatingComment("");
        onRefresh();
        // Update local detail view
        const updated = { ...selectedSupplier };
        updated.rating = ratingVal;
        setSelectedSupplier(updated);
      }
    } catch (err: any) {
      onShowNotification("Error", err.message || "Rating failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Supplier Management Directory</h2>
          <p className="text-sm text-gray-500">Add, track compliance, rate vendor partners, and view historical statements.</p>
        </div>
        <Button id="btn-add-supplier" variant="primary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus size={16} /> Register Supplier
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <Input 
            id="supplier-search"
            type="text" 
            placeholder="Search by vendor code, company name, or contact person..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card id="suppliers-list-card">
            <CardHeader>
              <CardTitle>Partner Directory</CardTitle>
              <CardDescription>Click a partner to inspect credentials, file logs, and statements.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table id="suppliers-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Supplier Code</th>
                      <th className="p-4">Company Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredSuppliers.map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedSupplier(s)}
                        className={`hover:bg-gray-50 cursor-pointer transition ${selectedSupplier?.id === s.id ? "bg-amber-50/40 border-l-4 border-amber-500" : ""}`}
                      >
                        <td className="p-4 font-mono font-medium text-xs text-amber-600">{s.vendorCode}</td>
                        <td className="p-4 font-medium text-gray-900">{s.companyName}</td>
                        <td className="p-4">
                          <div className="text-gray-900">{s.contactPerson}</div>
                          <div className="text-gray-500 text-xs">{s.phone}</div>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{s.supplierCategory}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={14} fill="currentColor" />
                            <span className="font-semibold text-xs">{s.rating}/5</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">No vendors found matching criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DETAILS SIDEBAR */}
        <div className="space-y-6">
          {selectedSupplier ? (
            <Card id="supplier-inspect-card" className="border-amber-100 shadow-sm">
              <CardHeader className="bg-amber-50/30 border-b border-amber-100/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-semibold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                      {selectedSupplier.vendorCode}
                    </span>
                    <CardTitle className="mt-2 text-lg text-gray-900">{selectedSupplier.companyName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-sm">{selectedSupplier.rating}.0</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Core Profile */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={16} className="text-gray-400" />
                    <span><strong className="text-gray-900">Contact:</strong> {selectedSupplier.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span><strong className="text-gray-900">Phone:</strong> {selectedSupplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span><strong className="text-gray-900">Email:</strong> {selectedSupplier.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span><strong className="text-gray-900">Address:</strong> {selectedSupplier.physicalAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ShieldCheck size={16} className="text-gray-400" />
                    <span><strong className="text-gray-900">KRA PIN:</strong> {selectedSupplier.kraPin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award size={16} className="text-gray-400" />
                    <span><strong className="text-gray-900">VAT Reg:</strong> {selectedSupplier.vatNumber}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <CreditCard size={16} className="text-gray-400 mt-0.5" />
                    <span className="text-xs font-mono bg-gray-50 p-2 rounded block w-full border border-gray-100">
                      <strong className="text-gray-900 block font-sans text-sm mb-1">Bank Details:</strong>
                      {selectedSupplier.bankDetails}
                    </span>
                  </div>
                </div>

                {/* Rating performance panel */}
                <form onSubmit={handleRateSupplier} className="border-t border-gray-100 pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" /> Log Performance Rating
                  </h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button 
                        key={v}
                        type="button"
                        onClick={() => setRatingVal(v)}
                        className={`p-2 rounded border text-xs font-bold flex-1 transition ${ratingVal === v ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200"}`}
                      >
                        {v} ★
                      </button>
                    ))}
                  </div>
                  <Input 
                    id="rating-comment"
                    placeholder="Provide audit feedback or reason..." 
                    value={ratingComment} 
                    onChange={e => setRatingComment(e.target.value)} 
                    className="text-xs"
                    required
                  />
                  <Button id="btn-rate-supplier" type="submit" variant="outline" className="w-full text-xs">
                    Save Assessment
                  </Button>
                </form>

                {/* Documents list */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" /> Compliance Documents
                  </h4>
                  <div className="space-y-2">
                    {selectedSupplier.documents.map(d => (
                      <div key={d.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        <div className="truncate pr-2">
                          <div className="font-medium text-gray-800 truncate">{d.title}</div>
                          <div className="text-gray-400 text-[10px] font-mono">{d.fileName} ({(d.fileSize / 1024 / 1024).toFixed(1)} MB)</div>
                        </div>
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      </div>
                    ))}
                    {selectedSupplier.documents.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No compliance papers attached.</p>
                    )}
                  </div>
                  
                  <form onSubmit={handleUploadDoc} className="mt-2 space-y-2 bg-gray-50/50 p-2 rounded border border-gray-100">
                    <Input 
                      id="doc-title-input"
                      placeholder="Doc Title, e.g. Business Registration" 
                      value={docTitle} 
                      onChange={e => setDocTitle(e.target.value)} 
                      className="text-xs bg-white"
                      required
                    />
                    <Input 
                      id="doc-filename-input"
                      placeholder="Filename, e.g. pin_certificate.pdf" 
                      value={docFileName} 
                      onChange={e => setDocFileName(e.target.value)} 
                      className="text-xs bg-white font-mono"
                      required
                    />
                    <Button id="btn-add-doc" type="submit" variant="secondary" className="w-full text-xs py-1">
                      Attach Certificate
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400 p-4 text-center">
              Select a supplier from the directory to review credentials, compliance documents, and perform service rating audits.
            </div>
          )}
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Register New Supplier Partner</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier Code *</label>
                  <Input 
                    id="add-supplier-code"
                    required 
                    placeholder="SUP-CEL-XXX" 
                    value={form.vendorCode} 
                    onChange={e => setForm({...form, vendorCode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>
                  <Input 
                    id="add-supplier-name"
                    required 
                    placeholder="e.g. Huawei East Africa" 
                    value={form.companyName} 
                    onChange={e => setForm({...form, companyName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Person *</label>
                  <Input 
                    id="add-supplier-contact"
                    required 
                    placeholder="Full Name" 
                    value={form.contactPerson} 
                    onChange={e => setForm({...form, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier Category *</label>
                  <select 
                    id="add-supplier-category"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white"
                    value={form.supplierCategory}
                    onChange={e => setForm({...form, supplierCategory: e.target.value})}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Fibre Infrastructure">Fibre Infrastructure</option>
                    <option value="CCTV & Surveillance">CCTV & Surveillance</option>
                    <option value="Hardware Laptops">Hardware Laptops</option>
                    <option value="Software Licencing">Software Licencing</option>
                    <option value="Safety Gear & Tools">Safety Gear & Tools</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                  <Input 
                    id="add-supplier-phone"
                    required 
                    placeholder="+254 7XX XXX" 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                  <Input 
                    id="add-supplier-email"
                    required 
                    type="email" 
                    placeholder="sales@company.com" 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Physical Address *</label>
                <Input 
                  id="add-supplier-address"
                  required 
                  placeholder="Street, Building, Suite, City" 
                  value={form.physicalAddress} 
                  onChange={e => setForm({...form, physicalAddress: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">KRA PIN Number *</label>
                  <Input 
                    id="add-supplier-pin"
                    required 
                    placeholder="P0XXXXXXXXX" 
                    value={form.kraPin} 
                    onChange={e => setForm({...form, kraPin: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">VAT Reg Number</label>
                  <Input 
                    id="add-supplier-vat"
                    placeholder="VAT-XXXX" 
                    value={form.vatNumber} 
                    onChange={e => setForm({...form, vatNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Terms (Days)</label>
                  <Input 
                    id="add-supplier-terms"
                    type="number" 
                    value={form.paymentTermsDays} 
                    onChange={e => setForm({...form, paymentTermsDays: parseInt(e.target.value) || 30})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Settlement Details</label>
                  <Input 
                    id="add-supplier-bank"
                    placeholder="Bank, Branch, Account Number" 
                    value={form.bankDetails} 
                    onChange={e => setForm({...form, bankDetails: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4 mt-6">
                <Button id="btn-cancel-supplier" type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button id="btn-save-supplier" type="submit" variant="primary" className="flex-1">
                  Save Vendor Partner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
