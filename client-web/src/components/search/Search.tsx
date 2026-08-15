import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { type InventoryDto, type GroupedProduct } from '../../pages/HomePage'; 
import styles from './Search.module.css';

interface SearchProps {
  inventory: InventoryDto[];
  onSelectProduct: (product: GroupedProduct) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
}

// ─── PHYSICS CONFIG (Matches global system) ───
const SPRING = { type: "spring" as const, stiffness: 400, damping: 32 };
const EASE = [0.16, 1, 0.3, 1] as const;

// ─── STAGGERED LIST ANIMATIONS ───
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)", 
    transition: { type: "spring", stiffness: 350, damping: 25 } 
  }
};

// ─── IMAGE URL RESOLVER ───
const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`; 
};

export const Search = ({ inventory, onSelectProduct, isOpen, setIsOpen, query, setQuery }: SearchProps) => {
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
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const uniqueCategories = Array.from(new Set(inventory.map(i => i.category)));
  const uniqueBrands = Array.from(new Set(
    inventory.filter(i => !activeCategory || i.category === activeCategory).map(i => i.brand)
  ));

  // ─── SMART SEARCH & SORT ALGORITHM ───
  const results = useMemo(() => {
    let filtered = inventory;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      const searchTerms = lowerQuery.split(/\s+/).filter(Boolean);

      // 1. Score every item in the inventory
      let scoredItems = filtered.map(item => {
        const combinedString = `${item.brand} ${item.modelName} ${item.category}`.toLowerCase();
        
        // Is the exact phrase inside the string? (Super high relevance)
        const exactMatch = combinedString.includes(lowerQuery);

        // How many individual words matched?
        const combinedTokens = combinedString.split(/\s+/);
        let matchCount = 0;
        searchTerms.forEach(term => {
          if (combinedTokens.some(ct => ct.includes(term))) {
            matchCount++;
          }
        });

        return { item, exactMatch, matchCount };
      });

      // 2. Filter out items that don't meet the forgiveness threshold
      scoredItems = scoredItems.filter(data => {
        if (data.exactMatch) return true;
        
        const requiredMatches = searchTerms.length <= 2 
          ? searchTerms.length 
          : Math.ceil(searchTerms.length * 0.6);
          
        return data.matchCount >= requiredMatches;
      });

      // 3. Sort by relevance (Exact phrases first, then highest word match count)
      scoredItems.sort((a, b) => {
        if (a.exactMatch && !b.exactMatch) return -1;
        if (!a.exactMatch && b.exactMatch) return 1;
        return b.matchCount - a.matchCount;
      });

      // 4. Extract the sorted items back into the standard array
      filtered = scoredItems.map(data => data.item);
    }

    // Apply Dropdown Filters
    if (activeCategory) filtered = filtered.filter(i => i.category === activeCategory);
    if (activeBrand) filtered = filtered.filter(i => i.brand === activeBrand);
    if (activeCondition) filtered = filtered.filter(i => i.condition === activeCondition);
    
    // Apply Price Filters
    const min = parseFloat(minPrice);
    if (!isNaN(min)) filtered = filtered.filter(i => i.price >= min);
    
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) filtered = filtered.filter(i => i.price <= max);

    // Grouping Logic (Combine conditions/storages into a single visual card)
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

    // Because JS Maps maintain insertion order, our relevance sorting survives the grouping!
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
      <div className={styles.triggerWrapper} onClick={() => setIsOpen(true)}>
        <div className={styles.triggerInput}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span className={styles.triggerPlaceholder}>Search devices, brands, accessories...</span>
          <div className={styles.kbdShortcut}>⌘ K</div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.backdropBlur}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              className={styles.liquidPalette}
              style={{ transformOrigin: "top center" }}
              initial={{ opacity: 0, scale: 0.95, y: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, y: -10, filter: "blur(10px)" }}
              transition={SPRING}
            >
              <div className={styles.paletteHeader}>
                <svg className={styles.activeSearchIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg className={styles.closeIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className={styles.filtersContainer}>
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
                    <option value="">All Conditions</option>
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
                  <motion.div 
                    className={styles.resultsGrid}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {results.map(item => (
                      <motion.div 
                        key={item.variantKey} 
                        variants={itemVariants}
                        className={styles.resultCard}
                        onMouseDown={() => {
                          onSelectProduct(item); 
                          setIsOpen(false);
                        }}
                      >
                        <div className={styles.imageBox}>
                           <img src={resolveImageUrl(item.imageUrl)} alt={item.name} />
                        </div>
                        <div className={styles.resultDetails}>
                          <div className={styles.resultTopRow}>
                            <span className={styles.resultTitle}>{item.name}</span>
                            <span className={styles.badge} data-condition={item.primaryRetailState}>
                              {item.primaryRetailState === 'BrandNew' ? 'MINT' : item.primaryRetailState === 'Refurbished' ? 'VERIFIED' : 'USED'}
                            </span>
                          </div>
                          
                          <div className={styles.resultBottomRow}>
                            <span className={styles.resultSpecs}>{item.category} • {item.storage} • {item.color}</span>
                          </div>

                          <div className={styles.resultBottomRow}>
                            <span className={styles.resultPrice}>{formatCurrency(item.minPrice)}</span>
                            <span className={styles.resultStock}>{item.stockCount} available</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                   <div className={styles.emptyState}>
                     <p className={styles.emptyText}>No matching devices found in inventory.</p>
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