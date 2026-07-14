import React from "react";
import { 
  BarChart3, TrendingUp, DollarSign, Award, Users, AlertTriangle, ShieldCheck, CheckCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/Card";
import { Table } from "../../ui/Table";

interface ReportData {
  totalSpend: number;
  outstandingLiabilities: number;
  spendByCategory: Record<string, number>;
  supplierPerformance: Array<{
    supplierName: string;
    vendorCode: string;
    rating: number;
    totalOrdersCount: number;
    totalSpendAmount: number;
  }>;
}

interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierName?: string;
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  status: string;
}

interface ReportsTabProps {
  reportData: ReportData | null;
  invoices: SupplierInvoice[];
}

export function ReportsTab({ reportData, invoices }: ReportsTabProps) {
  const defaultReports: ReportData = {
    totalSpend: reportData?.totalSpend || 14200000,
    outstandingLiabilities: reportData?.outstandingLiabilities || 3840000,
    spendByCategory: reportData?.spendByCategory || {
      "Networking Equipment": 6800000,
      "Fibre Infrastructure": 4500000,
      "Software Licencing": 1200000,
      "Hardware Laptops": 1700000
    },
    supplierPerformance: reportData?.supplierPerformance || [
      { supplierName: "Huawei East Africa", vendorCode: "SUP-HUA-01", rating: 5, totalOrdersCount: 12, totalSpendAmount: 6800000 },
      { supplierName: "Liquid Intelligent Technologies", vendorCode: "SUP-LIQ-02", rating: 4, totalOrdersCount: 8, totalSpendAmount: 4500000 },
      { supplierName: "Safaricom PLC", vendorCode: "SUP-SAF-03", rating: 5, totalOrdersCount: 4, totalSpendAmount: 1200000 },
      { supplierName: "Pinnacle Computers Kenya", vendorCode: "SUP-PIN-04", rating: 3, totalOrdersCount: 6, totalSpendAmount: 1700000 }
    ]
  };

  // Calculate AP Aging - items unpaid or partially paid
  const apLiabilities = invoices.filter(inv => inv.status !== "PAID" && inv.totalAmount > inv.amountPaid);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-sans">Procurement Intelligence & AP Aging Reports</h2>
        <p className="text-sm text-gray-500">Corporate spend metrics, category allocations, vendor audits, and accounts payable aging matrices.</p>
      </div>

      {/* KPI Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card id="kpi-proc-spend" className="border-l-4 border-blue-900 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Gross Procurement Value</span>
              <h3 className="text-xl font-black text-blue-900 font-mono mt-1">KES {defaultReports.totalSpend.toLocaleString()}</h3>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-full text-blue-900">
              <DollarSign size={22} />
            </div>
          </CardContent>
        </Card>

        <Card id="kpi-proc-ap" className="border-l-4 border-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">AP Liability Outstandings</span>
              <h3 className="text-xl font-black text-amber-600 font-mono mt-1 font-bold">KES {defaultReports.outstandingLiabilities.toLocaleString()}</h3>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-full text-amber-500">
              <TrendingUp size={22} />
            </div>
          </CardContent>
        </Card>

        <Card id="kpi-proc-categories" className="border-l-4 border-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Sourced Vendor Groups</span>
              <h3 className="text-xl font-black text-emerald-600 font-sans mt-1">
                {Object.keys(defaultReports.spendByCategory).length} categories
              </h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-500">
              <BarChart3 size={22} />
            </div>
          </CardContent>
        </Card>

        <Card id="kpi-proc-quality" className="border-l-4 border-indigo-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Audit Average SLA</span>
              <h3 className="text-xl font-black text-indigo-600 font-sans mt-1">4.7 / 5.0</h3>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-full text-indigo-500">
              <Award size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Bento Grid Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category spends list representation */}
        <Card id="category-spends-card" className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Budget Allocation by Category</CardTitle>
            <CardDescription>Visual split of capital expenditures on infrastructure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(defaultReports.spendByCategory).map((cat, idx) => {
              const amt = defaultReports.spendByCategory[cat];
              const pct = (amt / defaultReports.totalSpend) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">{cat}</span>
                    <span className="font-mono text-gray-900 font-semibold">KES {amt.toLocaleString()} ({pct.toFixed(0)}%)</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-blue-900" :
                        idx === 1 ? "bg-amber-500" :
                        idx === 2 ? "bg-emerald-500" : "bg-purple-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Supplier SLA & spending lists */}
        <Card id="vendor-audits-card" className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Partner Audits & Spend Indexes</CardTitle>
            <CardDescription>Vendor compliance performance rating registers linked to total order accounts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table id="vendor-audit-report-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-3">Partner Name</th>
                  <th className="p-3">Vendor Code</th>
                  <th className="p-3">Audit Stars</th>
                  <th className="p-3 text-right font-mono">Dispatched POs</th>
                  <th className="p-3 text-right font-mono">Spend Sum (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {defaultReports.supplierPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-900">{item.supplierName}</td>
                    <td className="p-3 font-mono text-gray-500">{item.vendorCode}</td>
                    <td className="p-3">
                      <div className="flex text-amber-500 font-bold gap-0.5">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">{item.totalOrdersCount} POs</td>
                    <td className="p-3 text-right font-mono font-bold text-gray-950">KES {item.totalSpendAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* AP Aging liabilities registry */}
      <Card id="ap-aging-card" className="shadow-sm border border-red-100">
        <CardHeader className="bg-red-50/20 border-b border-red-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-red-950">Accounts Payable (AP) Aging Matrix</CardTitle>
              <CardDescription>Creditors ledger claims grouped by active due dates for liquidity planning.</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold">
              <AlertTriangle size={14} />
              Outstanding Settlements
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table id="ap-aging-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Invoice Number</th>
                <th className="p-4">Supplier Partner</th>
                <th className="p-4">SLA Due Date</th>
                <th className="p-4">Invoice Sum</th>
                <th className="p-4">Total Paid</th>
                <th className="p-4 text-right">Liabilities Outstanding (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {apLiabilities.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono font-semibold text-red-600">{inv.invoiceNumber}</td>
                  <td className="p-4 font-semibold text-gray-800">{inv.supplierName}</td>
                  <td className="p-4 text-xs font-mono text-red-700 font-bold">{inv.dueDate}</td>
                  <td className="p-4 font-mono">KES {inv.totalAmount.toLocaleString()}</td>
                  <td className="p-4 font-mono text-emerald-700 font-medium">KES {inv.amountPaid.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono font-bold text-red-600">
                    KES {(inv.totalAmount - inv.amountPaid).toLocaleString()}
                  </td>
                </tr>
              ))}
              {apLiabilities.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic flex justify-center items-center gap-1 bg-gray-50/30">
                    <ShieldCheck className="text-emerald-500" size={16} /> All accounts payable are fully cleared! Liquidity balances are optimized.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
