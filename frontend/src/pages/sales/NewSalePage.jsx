import { Icon } from "@/icons/registry";
import { useEffect, useRef, useState } from "react";
import { InputText } from "@/components/ui/inputtext";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import { Dialog } from "@/components/ui-compat/Dialog";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { productsApi, categoriesApi, customersApi, salesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import ReceiptDialog from "../../components/ReceiptDialog";
import MikrotikVoucherCart from "./MikrotikVoucherCart";

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Other", value: "OTHER" },
];

export default function NewSalePage() {
  const { user } = useAuth();
  const { currentStoreId, isAllStores } = useStore();
  const toast = useToast();
  const currency = user.organization?.currency || "GHS";
  const taxRate = user.organization?.taxRate || 0;

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });

  const [activeTab, setActiveTab] = useState("manual");

  const [completing, setCompleting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const searchRef = useRef(null);
  const checkoutRef = useRef(null);

  // Hide the floating mobile cart bar once the real Complete Sale button scrolls into
  // view — otherwise it sits on top of it and blocks the one button that matters most.
  useEffect(() => {
    if (!checkoutRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setCheckoutVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(checkoutRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    if (!currentStoreId) return;
    customersApi.list({ storeId: currentStoreId, pageSize: 100 }).then(({ data }) => setCustomers(data.data));
  }, [currentStoreId]);

  useEffect(() => {
    if (!currentStoreId) return;
    setLoadingProducts(true);
    const handle = setTimeout(() => {
      productsApi
        .list({ storeId: currentStoreId, search: search || undefined, categoryId: categoryId || undefined, active: true, pageSize: 60 })
        .then(({ data }) => setProducts(data.data))
        .finally(() => setLoadingProducts(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [currentStoreId, search, categoryId]);

  function addToCart(product) {
    if (product.stock <= 0) {
      toast.warn(`${product.name} is out of stock at this store`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warn(`Only ${product.stock} ${product.unit}(s) of ${product.name} available`);
          return prev;
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: product.id, name: product.name, unit: product.unit, unitPrice: Number(product.sellingPrice), quantity: 1, stock: product.stock }];
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const qty = Math.max(1, Math.min(quantity || 1, i.stock));
        return { ...i, quantity: qty };
      })
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter" && products.length === 1) {
      addToCart(products[0]);
      setSearch("");
    }
  }

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  async function handleCreateCustomer() {
    try {
      const { data } = await customersApi.create({ ...newCustomer, storeId: currentStoreId });
      setCustomers((prev) => [...prev, data.data]);
      setCustomerId(data.data.id);
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "" });
      toast.success("Customer added");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not add customer"));
    }
  }

  async function handleCompleteSale() {
    if (!cart.length) {
      toast.warn("Add at least one product to the cart");
      return;
    }
    setCompleting(true);
    try {
      const { data } = await salesApi.create({
        storeId: currentStoreId,
        customerId: customerId || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: 0 })),
        paymentMethod,
      });
      toast.success(`Sale completed - ${data.data.receiptNumber}`);
      setCompletedSale(data.data);
      setCart([]);
      setCustomerId(null);
      setPaymentMethod("CASH");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not complete the sale"));
    } finally {
      setCompleting(false);
    }
  }

  if (isAllStores) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 dark:border-gray-700 shadow-card p-10 text-center text-gray-500 dark:text-gray-400 mx-auto w-full max-w-7xl px-5">
        <Icon className="pi-info-circle text-2xl mb-2 block" />
        Select a specific store from the top bar to start a new sale.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full mx-auto w-full max-w-7xl px-5">
      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit shrink-0">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "manual" ? "bg-white text-gray-900 dark:bg-gray-600 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Manual Sale
        </button>
        <button
          onClick={() => setActiveTab("mikrotik")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "mikrotik" ? "bg-white text-gray-900 dark:bg-gray-600 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          MikroTik Vouchers
        </button>
      </div>

      {activeTab === "mikrotik" ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MikrotikVoucherCart storeId={currentStoreId} currency={currency} />
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
      <div className="xl:col-span-2 flex flex-col min-h-0">
        <div className="flex gap-2 mb-3">
          <span className="relative flex-1">
            <Icon className="pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 size-3.5" />
            <InputText
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by name, SKU, or scan barcode..."
              className="w-full pl-9"
            />
          </span>
          <Dropdown optionValue="value"
            value={categoryId}
            options={[{ label: "All Categories", value: null }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
            onChange={(e) => setCategoryId(e.value)}
            className="w-48"
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start pb-20 xl:pb-0">
          {loadingProducts && <p className="col-span-full text-center text-gray-400 dark:text-gray-500 py-10">Loading products...</p>}
          {!loadingProducts && products.length === 0 && <p className="col-span-full text-center text-gray-400 dark:text-gray-500 py-10">No products found</p>}
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-3 text-left hover:border-violet-300 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate">{product.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{product.category?.name || "Uncategorized"}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold text-violet-600 text-sm">{formatCurrency(product.sellingPrice, currency)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock <= 0 ? "bg-red-50 text-red-500" : product.lowStock ? "bg-amber-50 text-amber-600" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {product.stock} {product.unit}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Dropdown optionValue="value"
              value={customerId}
              options={customers.map((c) => ({ label: c.name, value: c.id }))}
              onChange={(e) => setCustomerId(e.value)}
              placeholder="Walk-in customer"
              showClear
              filter
              className="flex-1"
            />
            <Button icon="pi pi-plus" outlined onClick={() => setShowNewCustomer(true)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {cart.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-10">Cart is empty</p>}
          {cart.map((item) => (
            <div key={item.productId} className="p-3 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatCurrency(item.unitPrice, currency)} / {item.unit}</p>
              </div>
              <InputNumber value={item.quantity} onValueChange={(e) => updateQuantity(item.productId, e.value)} showButtons buttonLayout="horizontal" min={1} max={item.stock} className="w-28" inputClassName="w-10 text-center" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white w-20 text-right">{formatCurrency(item.unitPrice * item.quantity, currency)}</span>
              <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500">
                <Icon className="pi-trash text-sm" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(tax, currency)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white pt-1">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>

          <Dropdown optionValue="value" value={paymentMethod} options={PAYMENT_METHODS} onChange={(e) => setPaymentMethod(e.value)} className="w-full mt-2" />

          <div ref={checkoutRef}>
            <Button
              label="Complete Sale"
              icon="pi pi-check"
              className="w-full mt-2"
              severity="success"
              loading={completing}
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
            />
          </div>
        </div>
      </div>

      {cart.length > 0 && !checkoutVisible && (
        <button
          onClick={() => checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="xl:hidden fixed bottom-20 left-4 right-4 z-30 bg-violet-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium">
            {cart.reduce((n, i) => n + i.quantity, 0)} item{cart.length === 1 ? "" : "s"} in cart
          </span>
          <span className="flex items-center gap-2 font-semibold">
            {formatCurrency(total, currency)}
            <Icon className="pi-arrow-up" />
          </span>
        </button>
      )}
      </div>
      )}

      <Dialog header="Add Customer" visible={showNewCustomer} onHide={() => setShowNewCustomer(false)} style={{ width: "24rem" }}>
        <div className="space-y-3">
          <InputText placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))} className="w-full" />
          <InputText placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))} className="w-full" />
          <InputText placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))} className="w-full" />
          <Button label="Save Customer" className="w-full" onClick={handleCreateCustomer} disabled={!newCustomer.name} />
        </div>
      </Dialog>

      <ReceiptDialog sale={completedSale} visible={!!completedSale} onHide={() => setCompletedSale(null)} />
    </div>
  );
}
