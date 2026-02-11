import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CartDrawer } from "../components/CartDrawer";
import { CartFloatingButton } from "../components/CartFloatingButton";
import { CartProvider, useCart } from "../context/CartContext";
import {
  PublicMenuProvider,
  usePublicMenu,
} from "../context/PublicMenuContext";

const StoreLayout = () => {
  const { storeName, products, categories } = usePublicMenu();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchParams] = useSearchParams();
  // ERRO-021 Fix: Extrair número da mesa da URL
  const tableNumber = searchParams.get("table");

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20">
      {/* ERRO-021 Fix: Banner de mesa no topo */}
      {tableNumber && (
        <div className="bg-gold-500 text-black px-6 py-3 text-center font-bold text-lg border-b-2 border-yellow-400">
          🪑 Mesa {tableNumber}
        </div>
      )}

      {/* Hero Section */}
      <div className="h-48 bg-neutral-900 flex items-end p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        {/* Abstract Background */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />

        <div className="relative z-20 text-white">
          <h1 className="text-3xl font-bold tracking-tight">{storeName}</h1>
          <p className="text-white/60 text-sm mt-1">Aberto • Fecha às 23:00</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-neutral-200 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 p-4">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === "all"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize ${
                activeCategory === cat
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex justify-between items-center active:scale-[0.98] transition-transform relative"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900">{product.name}</h3>
              <p className="text-neutral-500 text-sm line-clamp-2">
                {product.description || "Sem descrição"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-medium text-neutral-900">
                  {new Intl.NumberFormat("pt-PT", {
                    style: "currency",
                    currency: "EUR",
                  }).format(product.price)}
                </span>
                {/* ERRO-012 Fix: Badge de tempo estimado de preparo */}
                {(() => {
                  // Estimativa baseada em categoria (pragmática, sem DB)
                  const category = (product.category || "").toLowerCase();
                  let estimatedTime = "15-20 min";
                  if (
                    category.includes("bebida") ||
                    category.includes("drink") ||
                    category.includes("refrigerante")
                  ) {
                    estimatedTime = "5 min";
                  } else if (
                    category.includes("sobremesa") ||
                    category.includes("dessert")
                  ) {
                    estimatedTime = "10 min";
                  } else if (
                    category.includes("entrada") ||
                    category.includes("starter")
                  ) {
                    estimatedTime = "10-15 min";
                  }
                  return (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      ⏱️ {estimatedTime}
                    </span>
                  );
                })()}
              </div>
            </div>
            {/* Product image or fallback placeholder */}
            {product.photo_url ? (
              <img
                src={product.photo_url}
                alt={product.name}
                className="ml-4 w-20 h-20 rounded-lg object-cover flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="ml-4 w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                🍔
              </div>
            )}
            <AddToCartButton product={product} />
          </motion.div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400">
            Nenhum item nesta categoria.
          </div>
        )}
      </div>

      <CartFloatingButton />
      <CartDrawer />
    </div>
  );
};

// Simple inline component for interaction
const AddToCartButton = ({ product }: { product: any }) => {
  const { addToCart } = useCart();

  return (
    <button
      onClick={() =>
        addToCart(
          {
            id: product.id,
            name: product.name,
            price: product.price,
            currency: "EUR",
          },
          1,
        )
      }
      className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-700 text-white flex items-center justify-center text-lg transition-colors absolute bottom-4 right-4"
    >
      +
    </button>
  );
};

export const PublicStorePage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table");
  const [hasPendingOrder, setHasPendingOrder] = useState(false); // ERRO-022 Fix

  // ERRO-022 Fix: Verificar pedido pendente ao carregar
  useEffect(() => {
    const checkPendingOrder = async () => {
      if (!tableNumber || !slug) return;

      try {
        const { WebOrderingService } = await import(
          "../../core/services/WebOrderingService"
        );
        const config = await WebOrderingService.getWebConfig(slug);
        if (!config) return;

        // Verificar se há pedido pendente para esta mesa
        // TODO: Implementar verificação real no backend
        // Por enquanto, apenas verificar localStorage
        const pendingOrderKey = `pending_order_${slug}_${tableNumber}`;
        const pending = localStorage.getItem(pendingOrderKey);
        if (pending) {
          setHasPendingOrder(true);
        }
      } catch (e) {
        console.error("Error checking pending order:", e);
      }
    };

    checkPendingOrder();
  }, [tableNumber, slug]);

  return (
    <PublicMenuProvider slug={slug || ""}>
      <CartProvider
        slug={slug || ""}
        tableNumber={tableNumber ? parseInt(tableNumber) : undefined}
      >
        {/* ERRO-022 Fix: Banner de pedido pendente */}
        {hasPendingOrder && (
          <div className="bg-blue-500 text-white px-6 py-3 text-center font-semibold border-b-2 border-blue-600">
            Você já tem um pedido pendente.{" "}
            <a href="#" className="underline">
              Ver status
            </a>
          </div>
        )}
        <StoreLayout />
      </CartProvider>
    </PublicMenuProvider>
  );
};
