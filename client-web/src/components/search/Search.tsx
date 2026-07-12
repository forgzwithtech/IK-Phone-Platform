import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type InventoryDto, type GroupedProduct } from '../../pages/HomePage'; 
import styles from './Search.module.css';

interface SearchProps {
  inventory: InventoryDto[];
  onSelectProduct: (product: GroupedProduct) => void;
}

// ─── IMAGE URL RESOLVER ───
const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`; 
};

export const Search = ({ inventory, onSelectProduct }: SearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeBrand, setActiveBrand] = useState<string>('');
  const [activeCondition, setActiveCondition] = useState<string>('');
  
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const uniqueCategories = Array.from(new Set(inventory.map(i => i.category)));
  const uniqueBrands = Array.from(new Set(
    inventory.filter(i => !activeCategory || i.category === activeCategory).map(i => i.brand)
  ));

  const results = useMemo(() => {
    let filtered = inventory;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(i => 
        i.modelName.toLowerCase().includes(lowerQuery) ||
        i.brand.toLowerCase().includes(lowerQuery) ||
        i.category.toLowerCase().includes(lowerQuery)
      );
    }

    if (activeCategory) filtered = filtered.filter(i => i.category === activeCategory);
    if (activeBrand) filtered = filtered.filter(i => i.brand === activeBrand);
    if (activeCondition) filtered = filtered.filter(i => i.condition === activeCondition);
    
    const min = parseFloat(minPrice);
    if (!isNaN(min)) filtered = filtered.filter(i => i.price >= min);
    
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) filtered = filtered.filter(i => i.price <= max);

    const groupedMap = new Map<string, GroupedProduct>();
    filtered.forEach(item => {
      const variantKey = `${item.brand}-${item.modelName}-${item.storage}-${item.color}-${item.condition}`;
      if (!groupedMap.has(variantKey)) {
        groupedMap.set(variantKey, {
          variantKey,
          name: `${item.brand} ${item.modelName}`,
          brand: item.brand,
          category: item.category,
          storage: item.storage,
          color: item.color,
          imageUrl: item.imageUrl,
          minPrice: item.price,
          stockCount: 1,
          primaryRetailState: item.condition,
          availableConditions: []
        });
      } else {
        const existing = groupedMap.get(variantKey)!;
        existing.stockCount += 1;
        if (item.price < existing.minPrice) existing.minPrice = item.price;
      }
    });

    return Array.from(groupedMap.values()).slice(0, 8);
  }, [query, inventory, activeCategory, activeBrand, activeCondition, minPrice, maxPrice]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
  };

  const ChevronIcon = () => (
    <svg className={styles.chevronIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );

  return (
    <>
      <motion.div 
        className={styles.triggerWrapper}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
      >
        <div className={styles.triggerInput}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span className={styles.triggerPlaceholder}>Search devices, accessories...</span>
          <div className={styles.kbdShortcut}>⌘ K</div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.backdropBlur}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              className={styles.liquidPalette}
              style={{ transformOrigin: "top center" }}
              initial={{ opacity: 0, scaleY: 0, scaleX: 0.3, y: -60, filter: "blur(20px)", borderRadius: "100px" }}
              animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0, filter: "blur(0px)", borderRadius: "16px" }}
              exit={{ opacity: 0, scaleY: 0, scaleX: 0.3, y: -60, filter: "blur(20px)", borderRadius: "100px" }}
              transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.6 }}
            >
              <div className={styles.paletteHeader}>
                <svg className={styles.activeSearchIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  autoFocus
                  className={styles.paletteInput} 
                  placeholder="What are you looking for?" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                
                <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                  <span className={styles.escText}>ESC</span>
                  <svg className={styles.closeIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className={styles.filtersContainer}>
                {/* Filters omitted for brevity, keeping it identical to what you pasted */}
                <div className={styles.selectWrapper}>
                  <select className={styles.filterSelect} value={activeCategory} onChange={e => {setActiveCategory(e.target.value); setActiveBrand('');}}>
                    <option value="">All Categories</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronIcon />
                </div>

                <div className={styles.selectWrapper}>
                  <select className={styles.filterSelect} value={activeBrand} onChange={e => setActiveBrand(e.target.value)} disabled={!uniqueBrands.length}>
                    <option value="">All Brands</option>
                    {uniqueBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                  <ChevronIcon />
                </div>

                <div className={styles.selectWrapper}>
                  <select className={styles.filterSelect} value={activeCondition} onChange={e => setActiveCondition(e.target.value)}>
                    <option value="">Condition</option>
                    <option value="BrandNew">Brand New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="PreOwned">Pre-Owned</option>
                  </select>
                  <ChevronIcon />
                </div>

                <div className={styles.filterDivider} />

                <div className={styles.priceFilterGroup}>
                  <span className={styles.currencySymbol}>₦</span>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice} 
                    onChange={e => setMinPrice(e.target.value)} 
                    className={styles.priceInput}
                  />
                  <span className={styles.priceSeparator}>-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(e.target.value)} 
                    className={styles.priceInput}
                  />
                </div>

              </div>

              <div className={styles.resultsArea}>
                {results.length > 0 ? (
                  <div className={styles.resultsGrid}>
                    {results.map(item => (
                      <div 
                        key={item.variantKey} 
                        className={styles.resultCard}
                        onMouseDown={() => {
                          onSelectProduct(item); 
                          setIsOpen(false);
                        }}
                      >
                        <div className={styles.imageBox}>
                           {/* FIX: RESOLVER APPLIED HERE */}
                           <img src={resolveImageUrl(item.imageUrl)} alt={item.name} />
                        </div>
                        <div className={styles.resultDetails}>
                          <div className={styles.resultTopRow}>
                            <span className={styles.resultTitle}>{item.name}</span>
                            <span className={styles.badge} data-condition={item.primaryRetailState}>
                              {item.primaryRetailState === 'BrandNew' ? 'NEW' : item.primaryRetailState === 'Refurbished' ? 'REFURB' : 'USED'}
                            </span>
                          </div>
                          <span className={styles.resultSpecs}>{item.category} • {item.storage} • {item.color}</span>
                          <div className={styles.resultBottomRow}>
                            <span className={styles.resultPrice}>{formatCurrency(item.minPrice)}</span>
                            <span className={styles.resultStock}>{item.stockCount} available</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className={styles.emptyState}>
                     <p className={styles.emptyText}>No matches found</p>
                     <button className={styles.clearBtn} onClick={() => { 
                       setQuery(''); setActiveCategory(''); setActiveBrand(''); setActiveCondition(''); setMinPrice(''); setMaxPrice(''); 
                     }}>Clear all filters</button>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};