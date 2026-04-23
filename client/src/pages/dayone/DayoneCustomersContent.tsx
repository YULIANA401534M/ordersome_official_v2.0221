import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  districtId: undefined as number | undefined,
  paymentType: "monthly" as "monthly" | "weekly" | "cash",
  creditLimit: 0,
  status: "active" as "active" | "suspended",
  customerLevel: "retail",
  settlementCycle: "monthly",
  overdueDays: 30,
  loginEmail: "",
  isPortalActive: false,
  portalNote: "",
};

const paymentTypeLabel: Record<string, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  cash: "Cash",
};

export default function DayoneCustomersContent({ tenantId }: { tenantId: number }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.dayone.customers.list.useQuery({ tenantId });
  const { data: districts } = trpc.dayone.districts.list.useQuery({ tenantId });

  const upsert = trpc.dayone.customers.upsert.useMutation({
    onSuccess: () => {
      toast.success(editId ? "Customer updated" : "Customer created");
      setOpen(false);
      utils.dayone.customers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.dayone.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted");
      utils.dayone.customers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setEditId(undefined);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      name: c.name ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      districtId: c.districtId ?? undefined,
      paymentType: c.paymentType ?? "monthly",
      creditLimit: Number(c.creditLimit ?? 0),
      status: c.status ?? "active",
      customerLevel: c.customerLevel ?? "retail",
      settlementCycle: c.settlementCycle ?? "monthly",
      overdueDays: Number(c.overdueDays ?? 30),
      loginEmail: c.loginEmail ?? "",
      isPortalActive: !!c.isPortalActive,
      portalNote: c.portalNote ?? "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    upsert.mutate({
      id: editId,
      tenantId,
      name: form.name,
      phone: form.phone || undefined,
      address: form.address || undefined,
      districtId: form.districtId,
      paymentType: form.paymentType,
      creditLimit: form.creditLimit,
      status: form.status,
      customerLevel: form.customerLevel || undefined,
      settlementCycle: form.settlementCycle || undefined,
      overdueDays: form.overdueDays,
      loginEmail: form.loginEmail || undefined,
      isPortalActive: form.isPortalActive,
      portalNote: form.portalNote || undefined,
    });
  }

  const filtered = (customers as any[] ?? []).filter((c: any) => !search || c.name?.includes(search) || c.phone?.includes(search));

  return (
    <div className="space-y-6">
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">Customer Management</h1>
          <p className="dayone-page-subtitle">Manage downstream customers, payment behavior, credit limits, and portal access with a mobile card layout.</p>
        </div>
        <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openNew}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_rgba(148,102,47,0.09)]">
        <CardContent className="p-4 md:p-5">
          <Input
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <div className="dayone-panel overflow-hidden rounded-[28px]">
        {isLoading ? (
          <div className="p-8 text-center text-stone-400">Loading...</div>
        ) : !filtered.length ? (
          <div className="p-8 text-center text-stone-400">No customer data.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50">
                  <tr>
                    {["Name", "Phone", "District", "Payment", "Level", "Portal", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-b-0 hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-stone-600">{c.phone ?? "-"}</td>
                      <td className="px-4 py-3 text-stone-600">{c.districtName ?? "-"}</td>
                      <td className="px-4 py-3 text-stone-600">{paymentTypeLabel[c.paymentType] ?? c.paymentType}</td>
                      <td className="px-4 py-3 text-stone-600">{c.customerLevel ?? "retail"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isPortalActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                          {c.isPortalActive ? "On" : "Off"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                          {c.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Delete customer ${c.name}?`)) del.mutate({ id: c.id, tenantId });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dayone-mobile-list p-4 md:hidden">
              {filtered.map((c: any) => (
                <article key={c.id} className="dayone-mobile-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-stone-900">{c.name}</h2>
                      <p className="mt-1 text-sm text-stone-500">{paymentTypeLabel[c.paymentType] ?? c.paymentType} / {c.customerLevel ?? "retail"}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {c.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{c.phone ?? "-"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{c.districtName ?? "No district"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{c.isPortalActive ? `Portal enabled${c.loginEmail ? ` / ${c.loginEmail}` : ""}` : "Portal disabled"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={() => openEdit(c)}>Edit</Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Delete customer ${c.name}?`)) del.mutate({ id: c.id, tenantId });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>District</Label>
              <Select value={form.districtId ? String(form.districtId) : "none"} onValueChange={(v) => setForm((p) => ({ ...p, districtId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No district</SelectItem>
                  {(districts as any[] ?? []).map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payment Type</Label>
                <Select value={form.paymentType} onValueChange={(v) => setForm((p) => ({ ...p, paymentType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Settlement</Label>
                <Select value={form.settlementCycle} onValueChange={(v) => setForm((p) => ({ ...p, settlementCycle: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Customer Level</Label>
                <Select value={form.customerLevel} onValueChange={(v) => setForm((p) => ({ ...p, customerLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Overdue Days</Label>
                <Input type="number" value={form.overdueDays} onChange={(e) => setForm((p) => ({ ...p, overdueDays: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credit Limit</Label>
                <Input type="number" value={form.creditLimit} onChange={(e) => setForm((p) => ({ ...p, creditLimit: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Portal Email</Label>
              <Input value={form.loginEmail} onChange={(e) => setForm((p) => ({ ...p, loginEmail: e.target.value }))} placeholder="Portal login email" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-stone-800">Portal Access</p>
                <p className="text-xs text-stone-500">Allow this customer to use the portal</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isPortalActive: !p.isPortalActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPortalActive ? "bg-amber-600" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isPortalActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div>
              <Label>Portal Note</Label>
              <Input value={form.portalNote} onChange={(e) => setForm((p) => ({ ...p, portalNote: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? "Saving..." : editId ? "Update Customer" : "Create Customer"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
