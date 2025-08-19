import { useState, useEffect } from "react";
import { Plus, Boxes, PackageX, Package, Clock8 } from "lucide-react";
import InventoryForm from "./InventoryForm";
import InventoryTable from "./InventoryTable";
import StockModal from "./StockModal";
import { Button } from "@/components/ui/button";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const exp = decoded.exp * 1000;
        const now = Date.now();
        return exp + ALLOWED_SKEW_MS < now;
    } catch (err) {
        console.warn("❌ Failed to decode token:", err);
        return true;
    }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
    const token = localStorage.getItem("authToken");

    if (!token || isTokenExpired(token)) {
        window.location.href = "/login";
        return;
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

    if (!response.ok) {
        const errorText = await response.text(); // fallback if no JSON
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    // ✅ Only parse JSON if there's content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch (err) {
            console.warn("Expected JSON but failed to parse:", err);
            return null;
        }
    }

    return null; // for 204 No Content or non-JSON responses
};

const MainPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const data = await secureFetch("/stock");
            const safeItems = Array.isArray(data) ? data : (data.items ?? []);
            setItems(safeItems);
        } catch (error) {
            console.error("Error loading inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        try {
            if (editingItem) {
                await secureFetch(`/stock/${editingItem.id}`, "PUT", data);
            } else {
                await secureFetch("/stock", "POST", data);
            }
            fetchInventory();
            setShowForm(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error saving item:", error);
        }
    };

    const handleDelete = async (item) => {
        try {
            await secureFetch(`/stock/${item.id}`, "DELETE");
            fetchInventory();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleAddStock = async (amount) => {
        try {
            await secureFetch(`/stock/${selectedItem.id}/restock?amount=${amount}`, "PUT");
            fetchInventory();
        } catch (error) {
            console.error("Error adding stock:", error);
        } finally {
            setSelectedItem(null);
            setShowStockModal(false);
        }
    };

    const openStockModal = (item) => {
        setSelectedItem(item);
        setShowStockModal(true);
    };

    const closeStockModal = () => {
        setSelectedItem(null);
        setShowStockModal(false);
    };

    return (
        <main className="relative p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Boxes className="h-6 w-6 text-cyan-400" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manage Inventory</h1>
                </div>
                {!loading && items.length > 0 && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 text-slate-900 transition-colors hover:text-cyan-500 dark:text-white dark:hover:text-cyan-400"
                    >
                        <Plus size={18} />
                        <span className="text-sm font-medium">Add Item</span>
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                    {
                        title: "Total Items",
                        icon: <Boxes size={26} />,
                        value: items.length,
                        growth: "+0% change today",
                        color: "#3DD9B6",
                        growthColor: "text-emerald-700 dark:text-[#28b99a]",
                    },
                    {
                        title: "Out of Stock",
                        icon: <PackageX size={26} />,
                        value: items.filter((i) => i.quantity === 0).length,
                        growth: "-0% change today",
                        color: "#F87171",
                        growthColor: "text-red-600 dark:text-red-400",
                    },
                    {
                        title: "Low Stock",
                        icon: <Package size={26} />,
                        value: items.filter((i) => i.quantity > 0 && i.quantity < 5).length,
                        growth: "+0% change today",
                        color: "#FB923C",
                        growthColor: "text-orange-600 dark:text-orange-400",
                    },
                    {
                        title: "Recently Restocked",
                        icon: <Clock8 size={26} />,
                        value: items.filter((i) => i.restockedRecently).length || 0,
                        growth: "+0% change today",
                        color: "#60A5FA",
                        growthColor: "text-blue-600 dark:text-blue-400",
                    },
                ].map(({ title, icon, value, growth, color, growthColor }) => (
                    <div
                        key={title}
                        className="card"
                    >
                        <div className="card-header flex items-center gap-x-3">
                            <div
                                className="w-fit rounded-lg p-2"
                                style={{
                                    backgroundColor: `${color}33`,
                                    color: color,
                                }}
                            >
                                {icon}
                            </div>
                            <p className="card-title">{title}</p>
                        </div>
                        <div className="card-body rounded-md bg-slate-100 p-4 transition-colors dark:bg-slate-950">
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
                            <p className={`text-xs font-medium ${growthColor}`}>{growth}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Inventory Table or Loading/Empty State */}
            {loading ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-[160px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
                        />
                    ))}
                </div>
            ) : items.length > 0 ? (
                <InventoryTable
                    items={items}
                    onAddStock={openStockModal}
                    onEditItem={handleEdit}
                    onDeleteRequest={handleDelete}
                />
            ) : (
                <div className="mt-12 flex flex-col items-center justify-center text-center">
                    <img
                        src="https://www.transparenttextures.com/patterns/stardust.png"
                        alt="Empty"
                        className="mb-4 h-32 w-32 opacity-50"
                    />
                    <p className="mb-2 text-slate-500 dark:text-slate-400">No inventory items yet.</p>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 text-slate-900 transition-colors hover:text-cyan-500 dark:text-white dark:hover:text-cyan-400"
                    >
                        <Plus size={18} />
                        <span className="text-sm font-medium">Add Your First Item</span>
                    </button>
                </div>
            )}

            {/* Inventory Form */}
            {showForm && !showStockModal && (
                <InventoryForm
                    item={editingItem}
                    onAdd={handleSave}
                    onClose={() => {
                        setShowForm(false);
                        setEditingItem(null);
                    }}
                    existingItems={items}
                />
            )}

            {/* Stock Modal */}
            {showStockModal && selectedItem && (
                <StockModal
                    item={selectedItem}
                    onClose={closeStockModal}
                    onSubmit={handleAddStock}
                />
            )}
        </main>
    );
};

export default MainPage;
