import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen, Star } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useFetch, useDebounced } from "../hooks";
import { CourseRow } from "../components/CourseCard";
import { Spinner, ErrorBox, Empty } from "../components/ui";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

/** Filters live in the URL, so every filtered view can be linked, refreshed and used with the back button. */
export default function Courses() {
  const { t, content } = useApp();
  const CATEGORIES = content.categories.map((c) => c.name);
  const [params, setParams] = useSearchParams();
  const categories = params.getAll("category");
  const levels = params.getAll("level");
  const price = params.get("price") || "all";
  const rating = params.get("rating") || "";
  const sort = params.get("sort") || "popular";
  const urlSearch = params.get("search") || "";
  const [search, setSearch] = useState(urlSearch);
  const debounced = useDebounced(search, 350);

  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);
  useEffect(() => {
    if (debounced === urlSearch) return;
    const p = new URLSearchParams(params);
    debounced ? p.set("search", debounced) : p.delete("search");
    setParams(p, { replace: true });
  }, [debounced]); // eslint-disable-line

  const { data, loading, error, reload } = useFetch(
    () => api("/courses", { query: { search: urlSearch, category: categories, level: levels, price: price === "all" ? "" : price, rating, sort } }),
    [params.toString()]
  );

  const toggle = (key, value) => {
    const p = new URLSearchParams(params);
    const current = p.getAll(key);
    p.delete(key);
    (current.includes(value) ? current.filter((x) => x !== value) : [...current, value]).forEach((v) => p.append(key, v));
    setParams(p);
  };
  const setOne = (key, value) => { const p = new URLSearchParams(params); value ? p.set(key, value) : p.delete(key); setParams(p); };

  return (
    <div className="container page">
      <div className="page-title"><div><h1>{t("All Courses")}</h1><p className="muted">{loading ? "" : `${data?.total ?? 0} ${t("Courses Found")}`}</p></div></div>
      <div className="catalog">
        <aside className="filters card">
          <h3><SlidersHorizontal size={17} /> {t("Filters")}</h3>
          <div className="filter-group"><h4>{t("Category")}</h4>
            <label className="check"><input type="radio" name="cat" checked={categories.length === 0} onChange={() => { const p = new URLSearchParams(params); p.delete("category"); setParams(p); }} /> {t("All")}</label>
            {CATEGORIES.map((c) => <label key={c} className="check"><input type="checkbox" checked={categories.includes(c)} onChange={() => toggle("category", c)} /> {t(c)}</label>)}
          </div>
          <div className="filter-group"><h4>{t("Level")}</h4>
            {LEVELS.map((l) => <label key={l} className="check"><input type="checkbox" checked={levels.includes(l)} onChange={() => toggle("level", l)} /> {t(l)}</label>)}
          </div>
          <div className="filter-group"><h4>{t("Price")}</h4>
            {[["all", "All"], ["free", "Free"], ["paid", "Paid"]].map(([v, l]) => <label key={v} className="check"><input type="radio" name="price" checked={price === v} onChange={() => setOne("price", v === "all" ? "" : v)} /> {t(l)}</label>)}
          </div>
          <div className="filter-group"><h4>{t("Rating")}</h4>
            {[["4.5", "4.5 & up"], ["4", "4.0 & up"], ["", "Any rating"]].map(([v, l]) => <label key={l} className="check"><input type="radio" name="rating" checked={rating === v} onChange={() => setOne("rating", v)} /> {v && <Star size={13} fill="currentColor" className="gold" />} {t(l)}</label>)}
          </div>
          {(categories.length > 0 || levels.length > 0 || price !== "all" || rating) && <button className="btn outline sm block" onClick={() => setParams(urlSearch ? { search: urlSearch } : {})}>{t("Clear filters")}</button>}
        </aside>

        <div className="catalog-main">
          <div className="toolbar">
            <label className="search-field"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search for courses...")} aria-label={t("Search for courses...")} /></label>
            <label className="sort">{t("Sort by")}:
              <select className="select" value={sort} onChange={(e) => setOne("sort", e.target.value === "popular" ? "" : e.target.value)}>
                <option value="popular">{t("Most Popular")}</option><option value="rating">{t("Highest Rated")}</option><option value="newest">{t("Newest")}</option>
                <option value="price-asc">{t("Price: Low to High")}</option><option value="price-desc">{t("Price: High to Low")}</option>
              </select>
            </label>
          </div>
          {loading ? <Spinner cards /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.courses.length === 0
            ? <Empty icon={BookOpen} title={t("No courses found")} text={t("Try a different keyword or clear some filters.")} />
            : <div className="course-list">{data.courses.map((c) => <CourseRow key={c.id} course={c} />)}</div>}
        </div>
      </div>
    </div>
  );
}
