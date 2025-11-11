import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./produtoAdm.module.css";

export default function ProdutoAdm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [showVariationPrompt, setShowVariationPrompt] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [variationSku, setVariationSku] = useState("");
  const [variationProcessing, setVariationProcessing] = useState(false);
  const [variationMsg, setVariationMsg] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(`Erro ${res.status}`);
        setProduct(null);
        return;
      }
      // data may be wrapped
      const p = data?.data ?? data?.produto ?? data ?? null;
      setProduct(p || {});
    } catch (err) {
      setError(String(err));
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // fetch categories for the categoria select
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mounted) {
        setCategoriesLoading(true);
        setCategoriesError(null);
      }
      try {
        const res = await fetch(
          "https://apismilepet.vercel.app/api/categorias/produtos",
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (mounted) {
            setCategoriesError(`Erro ${res.status}`);
            setCategories([]);
          }
        } else {
          let items = null;
          if (Array.isArray(data)) items = data;
          else if (data?.data)
            items = Array.isArray(data.data) ? data.data : [data.data];
          else if (data?.categorias)
            items = Array.isArray(data.categorias)
              ? data.categorias
              : [data.categorias];
          else items = data ? [data] : [];
          if (mounted) setCategories(items || []);
        }
      } catch (err) {
        if (mounted) {
          setCategoriesError(String(err));
          setCategories([]);
        }
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDimChange = (e) => {
    const { name, value } = e.target;
    setProduct((p) => ({
      ...p,
      dimensoes: { ...(p?.dimensoes || {}), [name]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      // prepare payload - convert some numeric-looking fields to strings as API expects
      const payload = { ...product };
      // imagens_secundarias: normalize into an array of non-empty strings
      const normalizeImages = (v) => {
        if (v == null) return undefined;
        // already array -> normalize elements
        if (Array.isArray(v)) {
          return v
            .map((x) => (x == null ? "" : String(x).trim()))
            .filter((s) => s !== "");
        }
        // string -> could be JSON array, comma-separated list, or single URL
        if (typeof v === "string") {
          const s = v.trim();
          if (s === "") return [];
          // try parse JSON array
          if (
            (s.startsWith("[") && s.endsWith("]")) ||
            (s.startsWith('"[') && s.endsWith(']"'))
          ) {
            try {
              const parsed = JSON.parse(s);
              if (Array.isArray(parsed)) return normalizeImages(parsed);
            } catch {
              // fallthrough to split
            }
          }
          // comma separated
          if (s.includes(","))
            return s
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
          // single value
          return [s];
        }
        // other types: coerce to string
        return [String(v)];
      };

      const imgs = normalizeImages(payload.imagens_secundarias);
      if (!imgs || imgs.length === 0) delete payload.imagens_secundarias;
      else payload.imagens_secundarias = imgs;

      // ensure dimensoes numbers
      if (payload.dimensoes) {
        payload.dimensoes = {
          altura_cm: Number(payload.dimensoes.altura_cm) || 0,
          largura_cm: Number(payload.dimensoes.largura_cm) || 0,
          comprimento_cm: Number(payload.dimensoes.comprimento_cm) || 0,
        };
      }

      // normalize numeric-like fields (handle Brazilian formats like 1.234,56)
      const normalizeNumber = (v) => {
        if (v === null || v === undefined || v === "") return undefined;
        if (typeof v === "number") return v;
        // remove spaces
        let s = String(v).trim();
        // handle common formats:
        // - if both '.' and ',' present assume '.' is thousands and ',' is decimal: remove dots, replace comma with dot
        // - if only ',' present assume comma is decimal: replace ',' with '.'
        // - if only '.' present assume dot is decimal and keep it
        s = s.replace(/\s/g, "");
        const hasDot = s.indexOf(".") !== -1;
        const hasComma = s.indexOf(",") !== -1;
        if (hasDot && hasComma) {
          s = s.replace(/\./g, "");
          s = s.replace(/,/g, ".");
        } else if (hasComma && !hasDot) {
          s = s.replace(/,/g, ".");
        }
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };

      [
        "preco",
        "estoque",
        "desconto_promocao",
        "quantidade",
        "custo",
        "custoReal",
        "custo_real",
        "preco_classic",
        "preco_premium",
        "preco_sp",
        "preco_am",
        "peso_kg",
        "categoria_id",
        "produto_pai_id",
      ].forEach((k) => {
        if (payload[k] !== undefined) {
          const nn = normalizeNumber(payload[k]);
          if (nn === undefined) delete payload[k];
          else payload[k] = nn;
        }
      });

      // deep sanitize payload to remove undefined, functions, and convert BigInt
      // try to parse stringified JSON fields (e.g. someone pasted JSON into a text input)
      const tryParseJsonStrings = (val) => {
        if (val == null) return val;
        if (typeof val === "string") {
          const s = val.trim();
          if (
            (s.startsWith("{") && s.endsWith("}")) ||
            (s.startsWith("[") && s.endsWith("]"))
          ) {
            try {
              return JSON.parse(s);
            } catch {
              return val;
            }
          }
          return val;
        }
        if (Array.isArray(val)) return val.map(tryParseJsonStrings);
        if (typeof val === "object") {
          const out = {};
          Object.keys(val).forEach((k) => {
            out[k] = tryParseJsonStrings(val[k]);
          });
          return out;
        }
        return val;
      };
      const parsedPayload = tryParseJsonStrings(payload);
      const sanitize = (value) => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        const t = typeof value;
        if (t === "number" || t === "string" || t === "boolean") {
          if (Number.isNaN(value)) return null;
          return value;
        }
        if (t === "bigint") return String(value);
        if (t === "function") return undefined;
        if (Array.isArray(value)) {
          const arr = value
            .map((v) => sanitize(v))
            .filter((v) => v !== undefined);
          return arr;
        }
        if (t === "object") {
          // Date -> ISO
          if (value instanceof Date) return value.toISOString();
          const out = {};
          Object.keys(value).forEach((k) => {
            const v = sanitize(value[k]);
            if (v !== undefined) out[k] = v;
          });
          return out;
        }
        return undefined;
      };

      const safePayload = sanitize(parsedPayload);

      // Build a conservative update payload: only include known schema fields
      const allowed = [
        "nome",
        "sku",
        "ncm",
        "preco",
        "categoria",
        "pet",
        "descricao_curta",
        "marca",
        "quantidade",
        "descricao_completa",
        "imagem_url",
        "imagens_secundarias",
        "ean",
        "custo",
        "custo_real",
        "custoReal",
        "preco_classic",
        "preco_premium",
        "preco_sp",
        "preco_am",
        "peso_kg",
        "dimensoes",
        "fornecedor",
        "item_ref",
        "pallet",
        "estoque",
        "promocao",
        "desconto_promocao",
        "tem_variacao",
        "produto_pai_id",
        "categoria_id",
      ];

      const updatePayload = {};
      allowed.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(safePayload, k)) {
          const v = safePayload[k];
          // skip undefined
          if (v === undefined) return;
          // avoid sending empty string for object/array fields
          if (
            (k === "dimensoes" || k === "imagens_secundarias") &&
            (v === "" || v == null)
          )
            return;
          updatePayload[k] = v;
        }
      });

      // normalize imagens_secundarias into the backend-accepted shape
      // The API expects an object (ex: { lista: [...] }) for this JSONB column.
      if (updatePayload.imagens_secundarias) {
        const v = updatePayload.imagens_secundarias;
        if (Array.isArray(v)) {
          // convert array -> { lista: [...] }
          updatePayload.imagens_secundarias = v.map((x) => String(x));
          // wrap into object shape the API accepts
          updatePayload.imagens_secundarias = {
            lista: updatePayload.imagens_secundarias,
          };
        } else if (typeof v === "object" && v !== null) {
          // already an object; if it has a lista array, ensure items are strings
          if (Array.isArray(v.lista)) {
            updatePayload.imagens_secundarias = {
              lista: v.lista.map((x) => String(x)),
            };
          } else {
            // leave other object shapes untouched (server may accept them)
            updatePayload.imagens_secundarias = v;
          }
        } else {
          // scalar value -> wrap as single item
          updatePayload.imagens_secundarias = { lista: [String(v)] };
        }
      }

      let body;
      try {
        body = JSON.stringify(updatePayload);
      } catch (err) {
        console.error("Failed to stringify product payload", err, payload);
        setError("Erro interno: payload inválido");
        setSaving(false);
        return;
      }

      // debug: log sanitized payload and json body so we can inspect what is sent
      try {
        console.debug("produtoAdm: safePayload", safePayload);
        console.debug("produtoAdm: body", body);
      } catch {
        // ignore console errors
      }

      // send sanitized body
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      // read raw text and try to parse JSON for better error messages
      const respText = await res.text().catch(() => null);
      let data = null;
      try {
        data = respText ? JSON.parse(respText) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error("produtoAdm: PATCH error", res.status, respText, data);
        const message =
          (data && (data.message || data.error)) ||
          respText ||
          `Erro ${res.status}`;
        setError(message);
        return;
      }
      // success — ask about variations
      setProduct(payload);
      setShowVariationPrompt(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este produto?")) return;
    try {
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        alert(`Erro ao excluir: ${res.status}`);
        return;
      }
      alert("Produto excluído");
      navigate("/adm/produtos");
    } catch (err) {
      alert(String(err));
    }
  };

  // --- Variation helpers and UI ---
  const handleVariationPromptAnswer = async (answer) => {
    setShowVariationPrompt(false);
    if (!answer) {
      // user answered No -> go back to list
      navigate("/adm/produtos");
      return;
    }

    // user answered Yes -> mark product as having variations and open modal
    try {
      const parentId = product.id ?? product._id ?? id;
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(
          parentId
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tem_variacao: true }),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setVariationMsg(d?.message || `Erro ${res.status}`);
        return;
      }
      // update local product state
      setProduct((p) => ({ ...(p || {}), tem_variacao: true }));
      setShowVariationModal(true);
      setVariationMsg(null);
    } catch (err) {
      setVariationMsg(String(err));
    }
  };

  const handleVariationSearch = async () => {
    if (!variationSku) {
      setVariationMsg("Informe o SKU da variação.");
      return;
    }
    setVariationProcessing(true);
    setVariationMsg(null);
    try {
      // try to find product by SKU
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos?sku=${encodeURIComponent(
          variationSku
        )}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => null);
      let found = null;
      if (Array.isArray(data)) found = data[0];
      else if (data?.data)
        found = Array.isArray(data.data) ? data.data[0] : data.data;
      else found = data?.produto ?? data ?? null;

      if (!found) {
        const goCreate = confirm(
          "Produto com esse SKU não encontrado. Deseja criar um novo produto com esse SKU?"
        );
        if (goCreate) {
          // Navigate to product creation page (assumed route)
          navigate(
            `/adm/produtos/novo?sku=${encodeURIComponent(variationSku)}`
          );
          return;
        }
        return;
      }

      const variationId = found.id ?? found._id ?? found._key ?? null;
      if (!variationId) {
        setVariationMsg("ID da variação não encontrado na resposta da API.");
        return;
      }

      const parentId = product.id ?? product._id ?? id;
      const patchRes = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(
          variationId
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ produto_pai_id: parentId }),
        }
      );
      if (!patchRes.ok) {
        setVariationMsg(`Erro ao vincular variação: ${patchRes.status}`);
        return;
      }

      const more = confirm(
        "Variação vinculada. Deseja adicionar mais variações?"
      );
      if (more) {
        setVariationSku("");
        setVariationMsg("Variação adicionada com sucesso.");
      } else {
        setShowVariationModal(false);
        navigate("/adm/produtos");
      }
    } catch (err) {
      setVariationMsg(String(err));
    } finally {
      setVariationProcessing(false);
    }
  };

  const handleVariationCancel = () => {
    setShowVariationModal(false);
    navigate("/adm/produtos");
  };

  if (loading) return <div className={styles.wrap}>Carregando produto…</div>;
  if (error) return <div className={styles.wrap}>Erro: {String(error)}</div>;
  if (!product)
    return <div className={styles.wrap}>Produto não encontrado.</div>;

  return (
    <div className={styles.wrap}>
      <h2>Editar Produto</h2>
      <form className={styles.form} onSubmit={handleSave}>
        <label>
          Nome
          <input
            name="nome"
            value={product.nome || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          SKU
          <input name="sku" value={product.sku || ""} onChange={handleChange} />
        </label>

        <label>
          Preço
          <input
            name="preco"
            value={product.preco ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Estoque
          <input
            name="estoque"
            value={product.estoque ?? product.stock ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          NCM
          <input name="ncm" value={product.ncm || ""} onChange={handleChange} />
        </label>

        <label>
          Categoria
          {categoriesLoading ? (
            <select disabled>
              <option>Carregando categorias…</option>
            </select>
          ) : (
            <select
              name="categoria"
              value={product.categoria || ""}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">— Selecionar categoria —</option>
              {categoriesError && (
                <option value="">Erro ao carregar categorias</option>
              )}
              {categories.map((c, idx) => {
                const val =
                  c.id ?? c._id ?? c.slug ?? c.nome ?? c.name ?? String(c);
                const label = c.nome ?? c.name ?? c.categoria ?? String(c);
                return (
                  <option key={val + "-" + idx} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          )}
        </label>

        <label>
          Marca
          <input
            name="marca"
            value={product.marca || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Quantidade
          <input
            name="quantidade"
            value={product.quantidade ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Descrição curta
          <textarea
            name="descricao_curta"
            value={product.descricao_curta || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Descrição completa
          <textarea
            name="descricao_completa"
            value={product.descricao_completa || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Imagem principal (URL)
          <input
            name="imagem_url"
            value={product.imagem_url || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Imagens secundárias (vírgula separadas)
          <input
            name="imagens_secundarias"
            value={
              Array.isArray(product.imagens_secundarias)
                ? product.imagens_secundarias.join(", ")
                : product.imagens_secundarias || ""
            }
            onChange={handleChange}
          />
        </label>

        <label>
          EAN
          <input name="ean" value={product.ean || ""} onChange={handleChange} />
        </label>

        <label>
          Pet
          <input name="pet" value={product.pet || ""} onChange={handleChange} />
        </label>

        <label>
          Fornecedor
          <input
            name="fornecedor"
            value={product.fornecedor || ""}
            onChange={handleChange}
          />
        </label>

        {/* <label>
          Item Ref
          <input
            name="item_ref"
            value={product.item_ref || ""}
            onChange={handleChange}
          />
        </label> */}

        {/* <label>
          Pallet
          <input
            name="pallet"
            value={product.pallet || ""}
            onChange={handleChange}
          />
        </label> */}

        <label>
          Custo
          <input
            name="custo"
            value={product.custo ?? ""}
            onChange={handleChange}
          />
        </label>

        {/* <label>
          Custo Real
          <input
            name="custoReal"
            value={product.custoReal ?? product.custo_real ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Preço Classic
          <input
            name="preco_classic"
            value={product.preco_classic ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Preço Premium
          <input
            name="preco_premium"
            value={product.preco_premium ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Preço SP
          <input
            name="preco_sp"
            value={product.preco_sp ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Preço AM
          <input
            name="preco_am"
            value={product.preco_am ?? ""}
            onChange={handleChange}
          />
        </label> */}

        <label>
          Peso (kg)
          <input
            name="peso_kg"
            value={product.peso_kg ?? ""}
            onChange={handleChange}
          />
        </label>

        {/* <label>
          Produto Pai ID
          <input
            name="produto_pai_id"
            value={product.produto_pai_id ?? ""}
            onChange={handleChange}
          />
        </label> */}

        {/* <label>
          Categoria ID
          <input
            name="categoria_id"
            value={product.categoria_id ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Criado em
          <input
            name="criado_em"
            value={product.criado_em || ""}
            onChange={handleChange}
            disabled
          />
        </label> */}

        <fieldset className={styles.fieldset}>
          <legend>Dimensões (cm)</legend>
          <label>
            Altura
            <input
              name="altura_cm"
              value={product.dimensoes?.altura_cm ?? ""}
              onChange={handleDimChange}
            />
          </label>
          <label>
            Largura
            <input
              name="largura_cm"
              value={product.dimensoes?.largura_cm ?? ""}
              onChange={handleDimChange}
            />
          </label>
          <label>
            Comprimento
            <input
              name="comprimento_cm"
              value={product.dimensoes?.comprimento_cm ?? ""}
              onChange={handleDimChange}
            />
          </label>
        </fieldset>

        <label className={styles.rowCheckbox}>
          <input
            type="checkbox"
            name="promocao"
            checked={!!product.promocao}
            onChange={handleChange}
          />{" "}
          Promoção
        </label>

        <label>
          Desconto promoção
          <input
            name="desconto_promocao"
            value={product.desconto_promocao ?? ""}
            onChange={handleChange}
          />
        </label>

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleDelete}
          >
            Excluir
          </button>
        </div>
      </form>

      {/* Variation prompt */}
      {showVariationPrompt && (
        <div className={styles.variationPrompt}>
          <div>
            <p>Este produto tem variação?</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => handleVariationPromptAnswer(true)}
                className={styles.btnPrimary}
              >
                Sim
              </button>
              <button
                onClick={() => handleVariationPromptAnswer(false)}
                className={styles.btnSecondary}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variation modal */}
      {showVariationModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Vincular variação por SKU</h3>
            <p>
              Informe o SKU da variação que será vinculada a este produto pai.
            </p>
            <input
              value={variationSku}
              onChange={(e) => setVariationSku(e.target.value)}
              placeholder="SKU da variação"
            />
            {variationMsg && <div className={styles.error}>{variationMsg}</div>}
            <div className={styles.modalActions}>
              <button
                onClick={handleVariationSearch}
                disabled={variationProcessing}
                className={styles.btnPrimary}
              >
                {variationProcessing ? "Processando..." : "Buscar e Vincular"}
              </button>
              <button
                onClick={handleVariationCancel}
                className={styles.btnSecondary}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
