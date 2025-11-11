import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../Produtos/produtoAdm.module.css";

export default function CadastroProduto() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skuPrefill = useMemo(
    () => searchParams.get("sku") || "",
    [searchParams]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(() => ({
    sku: skuPrefill,
    dimensoes: {},
    promocao: false,
  }));
  const [showVariationPrompt, setShowVariationPrompt] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [variationSku, setVariationSku] = useState("");
  const [variationQuantity, setVariationQuantity] = useState("");
  const [variationProcessing, setVariationProcessing] = useState(false);
  const [variationMsg, setVariationMsg] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    setProduct((prev) => ({
      ...prev,
      sku: prev.sku || skuPrefill,
    }));
  }, [skuPrefill]);

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
      ...(p || {}),
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDimChange = (e) => {
    const { name, value } = e.target;
    setProduct((p) => ({
      ...(p || {}),
      dimensoes: { ...(p?.dimensoes || {}), [name]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...(product || {}) };

      const normalizeImages = (v) => {
        if (v == null) return undefined;
        if (Array.isArray(v)) {
          return v
            .map((x) => (x == null ? "" : String(x).trim()))
            .filter((s) => s !== "");
        }
        if (typeof v === "string") {
          const s = v.trim();
          if (s === "") return [];
          if (
            (s.startsWith("[") && s.endsWith("]")) ||
            (s.startsWith('"[') && s.endsWith(']"'))
          ) {
            try {
              const parsed = JSON.parse(s);
              if (Array.isArray(parsed)) return normalizeImages(parsed);
            } catch {
              // ignore parse errors
            }
          }
          if (s.includes(","))
            return s
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
          return [s];
        }
        return [String(v)];
      };

      const imgs = normalizeImages(payload.imagens_secundarias);
      if (!imgs || imgs.length === 0) delete payload.imagens_secundarias;
      else payload.imagens_secundarias = imgs;

      if (payload.dimensoes) {
        payload.dimensoes = {
          altura_cm: Number(payload.dimensoes.altura_cm) || 0,
          largura_cm: Number(payload.dimensoes.largura_cm) || 0,
          comprimento_cm: Number(payload.dimensoes.comprimento_cm) || 0,
        };
      }

      const normalizeNumber = (v) => {
        if (v === null || v === undefined || v === "") return undefined;
        if (typeof v === "number") return v;
        let s = String(v).trim();
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

      if (Object.prototype.hasOwnProperty.call(payload, "quantidade")) {
        const rawQuantidade = payload.quantidade;
        if (
          rawQuantidade === undefined ||
          rawQuantidade === null ||
          (typeof rawQuantidade === "string" && rawQuantidade.trim() === "")
        ) {
          delete payload.quantidade;
        } else {
          const normalizedQuantidade =
            typeof rawQuantidade === "string"
              ? rawQuantidade.trim()
              : String(rawQuantidade).trim();
          if (!normalizedQuantidade) delete payload.quantidade;
          else payload.quantidade = normalizedQuantidade;
        }
      }

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

      const safePayload = sanitize(parsedPayload) || {};

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

      const createPayload = {};
      allowed.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(safePayload, k)) {
          const v = safePayload[k];
          if (v !== undefined) {
            if (
              (k === "dimensoes" || k === "imagens_secundarias") &&
              (v === "" || v == null)
            )
              return;
            createPayload[k] = v;
          }
        }
      });

      if (createPayload.imagens_secundarias) {
        const v = createPayload.imagens_secundarias;
        if (Array.isArray(v)) {
          createPayload.imagens_secundarias = {
            lista: v.map((x) => String(x)),
          };
        } else if (typeof v === "object" && v !== null) {
          if (Array.isArray(v.lista)) {
            createPayload.imagens_secundarias = {
              lista: v.lista.map((x) => String(x)),
            };
          }
        } else {
          createPayload.imagens_secundarias = { lista: [String(v)] };
        }
      }

      let body;
      try {
        body = JSON.stringify(createPayload);
      } catch (err) {
        console.error("cadastroProduto: payload stringify error", err);
        setError("Erro interno: payload inválido");
        setSaving(false);
        return;
      }

      try {
        console.debug("cadastroProduto: createPayload", createPayload);
      } catch {
        // ignore console errors
      }

      const res = await fetch("https://apismilepet.vercel.app/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const respText = await res.text().catch(() => null);
      let data = null;
      try {
        data = respText ? JSON.parse(respText) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error("cadastroProduto: POST error", res.status, respText);
        const message =
          (data && (data.message || data.error)) ||
          respText ||
          `Erro ${res.status}`;
        setError(message);
        return;
      }

      const created =
        (Array.isArray(data) ? data[0] : null) ??
        data?.data ??
        data?.produto ??
        data?.product ??
        data ??
        {};

      const nextProduct = {
        ...(product || {}),
        ...(created || {}),
      };

      const createdId =
        nextProduct.id ??
        nextProduct._id ??
        nextProduct._key ??
        nextProduct.codigo ??
        null;

      setProduct(nextProduct);
      setShowVariationPrompt(!!createdId);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const extractCurrentId = () =>
    product?.id ?? product?._id ?? product?._key ?? product?.codigo ?? null;

  const handleDelete = async () => {
    const currentId = extractCurrentId();
    if (!currentId) {
      alert("Produto ainda não cadastrado no sistema.");
      return;
    }
    if (!confirm("Excluir este produto?")) return;
    try {
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(
          currentId
        )}`,
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

  const handleVariationPromptAnswer = async (answer) => {
    setShowVariationPrompt(false);
    if (!answer) {
      navigate("/adm/produtos");
      return;
    }

    const parentId = extractCurrentId();
    if (!parentId) {
      setVariationMsg("ID do produto não encontrado para variações.");
      return;
    }

    try {
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
      setProduct((p) => ({ ...(p || {}), tem_variacao: true }));
      setVariationQuantity("");
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
          navigate(
            `/adm/produtos/novo?sku=${encodeURIComponent(variationSku)}`
          );
        }
        return;
      }

      const variationId =
        found.id ?? found._id ?? found._key ?? found.codigo ?? null;
      if (!variationId) {
        setVariationMsg("ID da variação não encontrado na resposta da API.");
        return;
      }

      const parentId = extractCurrentId();
      if (!parentId) {
        setVariationMsg("ID do produto pai não disponível.");
        return;
      }

      const existingQuantity =
        typeof found?.quantidade === "string"
          ? found.quantidade.trim()
          : found?.quantidade != null
          ? String(found.quantidade).trim()
          : "";

      const trimmedQuantity =
        typeof variationQuantity === "string"
          ? variationQuantity.trim()
          : String(variationQuantity ?? "").trim();

      if (!trimmedQuantity) {
        if (existingQuantity) {
          setVariationQuantity(existingQuantity);
          setVariationMsg(
            "Quantidade preenchida automaticamente. Confirme ou ajuste e clique novamente."
          );
        } else {
          setVariationMsg("Informe a quantidade para vincular esta variação.");
        }
        return;
      }

      const patchRes = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(
          variationId
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            produto_pai_id: parentId,
            quantidade: trimmedQuantity,
          }),
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
        setVariationQuantity("");
        setVariationMsg("Variação adicionada com sucesso.");
      } else {
        setShowVariationModal(false);
        setVariationQuantity("");
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
    setVariationQuantity("");
    navigate("/adm/produtos");
  };

  return (
    <div className={styles.wrap}>
      <h2>Cadastrar Produto</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form className={styles.form} onSubmit={handleSave}>
        <label>
          Nome
          <input
            name="nome"
            value={product?.nome || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          SKU
          <input
            name="sku"
            value={product?.sku || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Preço
          <input
            name="preco"
            value={product?.preco ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Estoque
          <input
            name="estoque"
            value={product?.estoque ?? product?.stock ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          NCM
          <input
            name="ncm"
            value={product?.ncm || ""}
            onChange={handleChange}
          />
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
              value={product?.categoria || ""}
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
            value={product?.marca || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Quantidade
          <input
            name="quantidade"
            value={product?.quantidade ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Descrição curta
          <textarea
            name="descricao_curta"
            value={product?.descricao_curta || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Descrição completa
          <textarea
            name="descricao_completa"
            value={product?.descricao_completa || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Imagem principal (URL)
          <input
            name="imagem_url"
            value={product?.imagem_url || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Imagens secundárias (vírgula separadas)
          <input
            name="imagens_secundarias"
            value={
              Array.isArray(product?.imagens_secundarias)
                ? product.imagens_secundarias.join(", ")
                : product?.imagens_secundarias || ""
            }
            onChange={handleChange}
          />
        </label>

        <label>
          EAN
          <input
            name="ean"
            value={product?.ean || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Pet
          <input
            name="pet"
            value={product?.pet || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Fornecedor
          <input
            name="fornecedor"
            value={product?.fornecedor || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Custo
          <input
            name="custo"
            value={product?.custo ?? ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Peso (kg)
          <input
            name="peso_kg"
            value={product?.peso_kg ?? ""}
            onChange={handleChange}
          />
        </label>

        <fieldset className={styles.fieldset}>
          <legend>Dimensões (cm)</legend>
          <label>
            Altura
            <input
              name="altura_cm"
              value={product?.dimensoes?.altura_cm ?? ""}
              onChange={handleDimChange}
            />
          </label>
          <label>
            Largura
            <input
              name="largura_cm"
              value={product?.dimensoes?.largura_cm ?? ""}
              onChange={handleDimChange}
            />
          </label>
          <label>
            Comprimento
            <input
              name="comprimento_cm"
              value={product?.dimensoes?.comprimento_cm ?? ""}
              onChange={handleDimChange}
            />
          </label>
        </fieldset>

        <label className={styles.rowCheckbox}>
          <input
            type="checkbox"
            name="promocao"
            checked={!!product?.promocao}
            onChange={handleChange}
          />
          Promoção
        </label>

        <label>
          Desconto promoção
          <input
            name="desconto_promocao"
            value={product?.desconto_promocao ?? ""}
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
            onClick={() => navigate("/adm/produtos")}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={!extractCurrentId()}
          >
            Excluir
          </button>
        </div>
      </form>

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
            <input
              value={variationQuantity}
              onChange={(e) => setVariationQuantity(e.target.value)}
              placeholder="Quantidade da variação"
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
