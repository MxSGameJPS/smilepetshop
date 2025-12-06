import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./todasPaginas.module.css";
import {
  FaUserFriends,
  FaShoppingBag,
  FaBoxOpen,
  FaTags,
  FaDownload,
  FaPlus,
  FaPrint,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { BsArrowUpRight, BsArrowDownRight, BsCircleFill } from "react-icons/bs";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TodasPaginas() {
  const [stats, setStats] = useState({
    clientes: 0,
    vendas: 0,
    produtos: 0,
    cupons: 0,
    pedidosConfirmados: { qtd: 0, valor: 0 },
    pedidosPendentes: { qtd: 0, valor: 0 },
    pedidosCancelados: { qtd: 0, valor: 0 },
    chartData: [],
    topProducts: [],
    userDemographics: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [reportLoading, setReportLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("smilepet_admin"));
      const name = u?.usuario?.login || u?.login || u?.nome;
      if (name) setAdminName(name);
    } catch {}

    async function loadData() {
      const [clientData, ordersData, prodCount, couponsData] =
        await Promise.all([
          fetch("https://apismilepet.vercel.app/api/client")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch("https://apismilepet.vercel.app/api/orders")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch("https://apismilepet.vercel.app/api/produtos")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch("https://apismilepet.vercel.app/api/coupons")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);

      const clientsList = Array.isArray(clientData)
        ? clientData
        : clientData.data || clientData.items || [];
      const ordersList = Array.isArray(ordersData)
        ? ordersData
        : ordersData.data || ordersData.items || [];
      const productsList = Array.isArray(prodCount)
        ? prodCount
        : prodCount.data || prodCount.items || prodCount.produtos || [];
      const couponsList = Array.isArray(couponsData)
        ? couponsData
        : couponsData.data || [];

      // --- Demografia (Estados) ---
      const stateMap = new Map();

      clientsList.forEach((c) => {
        let uf = null;
        const addr = c.endereco || c.address;
        if (typeof addr === "object" && addr !== null) {
          uf = addr.estado || addr.state || addr.uf;
        }
        if (!uf) uf = c.estado || c.state || c.uf;

        if (uf) {
          let normalized = uf.toUpperCase().trim();
          if (normalized === "SÃO PAULO") normalized = "SP";
          if (normalized === "RIO DE JANEIRO") normalized = "RJ";
          if (normalized === "MINAS GERAIS") normalized = "MG";
          if (normalized.length > 2) normalized = normalized.substring(0, 2);

          stateMap.set(normalized, (stateMap.get(normalized) || 0) + 1);
        }
      });

      const sortedStates = Array.from(stateMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

      let demographics = sortedStates.slice(0, 5);
      const othersCount = sortedStates
        .slice(5)
        .reduce((acc, curr) => acc + curr.count, 0);
      if (othersCount > 0) {
        demographics.push({ label: "Outros", count: othersCount });
      }

      const colors = [
        "#073b4c",
        "#fc6100",
        "#4cc9f0",
        "#06d6a0",
        "#ffd166",
        "#118ab2",
        "#ef476f",
      ];
      demographics = demographics.map((d, i) => ({
        ...d,
        color: colors[i % colors.length],
      }));

      // --- Pedidos e Chart ---
      // Helper function to calculate total
      const calculateTotal = (order) => {
        let total = 0;
        // Try items
        const items =
          order.items_data || order.Items_data || order.itens || order.items;
        if (Array.isArray(items)) {
          total += items.reduce((acc, item) => {
            const price =
              Number(
                item.precoUnit ||
                  item.price ||
                  item.preco_unitario ||
                  item.valor ||
                  0
              ) || 0;
            const qty =
              Number(
                item.quantidade || item.qty || item.quantity || item.quant || 1
              ) || 1;
            return acc + price * qty;
          }, 0);
        }

        // Add shipping
        if (order.shipping_data) {
          const s = order.shipping_data;
          total += Number(s.cost || s.cust || s.price || 0) || 0;
        }

        const directTotal = Number(
          order.total || order.valorTotal || order.valor || 0
        );
        if (total === 0 && directTotal > 0) return directTotal;

        return total > 0 ? total : directTotal;
      };

      let confirmados = { qtd: 0, valor: 0 };
      let pendentes = { qtd: 0, valor: 0 };
      let cancelados = { qtd: 0, valor: 0 };
      const productMap = new Map();

      const months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const monthlyData = months.map((m) => ({
        month: m,
        confirmados: 0,
        pendentes: 0,
        cancelados: 0,
        confirmadosValor: 0,
      }));

      ordersList.forEach((order) => {
        const val = calculateTotal(order);
        const st = (order.status || "").toLowerCase();

        let typeKey = "pendentes";
        const isConfirmed = [
          "approved",
          "paid",
          "pago",
          "confirmed",
          "delivered",
        ].includes(st);
        const isCancelled = ["cancelled", "rejected", "cancelado"].includes(st);

        if (isConfirmed) {
          typeKey = "confirmados";
          confirmados.qtd++;
          confirmados.valor += val;

          // Agrega produtos (apenas confirmados)
          const items =
            order.items_data ||
            order.Items_data ||
            order.itens ||
            order.items ||
            [];
          if (Array.isArray(items)) {
            items.forEach((it) => {
              const name =
                it.nome || it.produto_nome || it.name || it.title || "Produto";
              const qty =
                Number(
                  it.quantidade || it.qty || it.quantity || it.quant || 0
                ) || 0;
              if (qty > 0) {
                productMap.set(name, (productMap.get(name) || 0) + qty);
              }
            });
          }
        } else if (isCancelled) {
          typeKey = "cancelados";
          cancelados.qtd++;
          cancelados.valor += val;
        } else {
          // Pendente
          pendentes.qtd++;
          pendentes.valor += val;
        }

        const dateStr =
          order.created_at || order.createdAt || order.data || order.date;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const mIndex = d.getMonth();
            if (monthlyData[mIndex]) {
              monthlyData[mIndex][typeKey]++;
              if (typeKey === "confirmados") {
                monthlyData[mIndex].confirmadosValor += val;
              }
            }
          }
        }
      });

      const topProducts = Array.from(productMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3);

      // --- Pedidos Recentes ---
      const sortedOrders = [...ordersList]
        .sort((a, b) => {
          const d1 = new Date(
            a.created_at || a.createdAt || a.data || a.date || 0
          );
          const d2 = new Date(
            b.created_at || b.createdAt || b.data || b.date || 0
          );
          return d2 - d1;
        })
        .slice(0, 5);

      const recentOrders = sortedOrders.map((o) => {
        const st = (o.status || "").toLowerCase();
        let stClass = "pending";
        let stLabel = o.status || "Pendente";

        if (
          ["approved", "paid", "pago", "confirmed", "delivered"].includes(st)
        ) {
          stClass = "paid";
          stLabel = "Pago";
        } else if (["cancelled", "rejected", "cancelado"].includes(st)) {
          stClass = "cancelled";
          stLabel = "Cancelado";
        } else {
          stLabel = "Pendente";
        }

        const dateObj = new Date(
          o.created_at || o.createdAt || o.data || o.date
        );
        const formattedDate = !isNaN(dateObj)
          ? dateObj.toLocaleDateString("pt-BR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";

        const amt = calculateTotal(o);

        return {
          id: `#${o.id || o._id || "?"}`.substring(0, 8),
          date: formattedDate,
          status: stLabel,
          amount: `R$ ${amt.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`,
          stClass: stClass,
        };
      });

      setStats({
        clientes: clientsList.length,
        vendas: ordersList.length,
        produtos: productsList.length,
        cupons: couponsList.length,
        pedidosConfirmados: confirmados,
        pedidosPendentes: pendentes,
        pedidosCancelados: cancelados,
        chartData: monthlyData,
        topProducts: topProducts,
        userDemographics: demographics,
        recentOrders: recentOrders,
      });
      setLoading(false);
    }
    loadData();
  }, []);

  const getPath = (data, key, color) => {
    if (!data || data.length === 0) return null;
    const maxVal =
      Math.max(
        ...data.map((d) =>
          Math.max(d.confirmados || 0, d.pendentes || 0, d.cancelados || 0)
        )
      ) || 10;
    const width = 100;
    const height = 40;
    const stepX = width / (data.length - 1);
    const getY = (val) => height - 5 - (val / maxVal) * 30;

    let d = `M 0 ${getY(data[0][key])}`;
    for (let i = 1; i < data.length; i++) {
      const x = i * stepX;
      const y = getY(data[i][key]);
      const prevX = (i - 1) * stepX;
      const prevY = getY(data[i - 1][key]);
      const cp1x = prevX + stepX / 2;
      const cp1y = prevY;
      const cp2x = x - stepX / 2;
      const cp2y = y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }
    return <path d={d} fill="none" stroke={color} strokeWidth="1" />;
  };

  const getDonutSegments = (data) => {
    if (!data || data.length === 0) return [];
    const total = data.reduce((acc, d) => acc + d.count, 0);
    let accumulatedPercent = 0;

    const segments = data.map((d) => {
      const percent = (d.count / total) * 100;
      const array = `${percent} ${100 - percent}`;
      const offset = 100 - accumulatedPercent + 25;
      accumulatedPercent += percent;
      return {
        ...d,
        percent,
        strokeDasharray: array,
        strokeDashoffset: offset,
      };
    });
    return { segments, total };
  };

  const generatePDF = async (type, title, endpoint) => {
    if (reportLoading) return;
    setReportLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

      let list = [];
      const url =
        type === "cupons"
          ? "https://apismilepet.vercel.app/api/coupons"
          : endpoint;
      const resp = await fetch(url);
      const json = await resp.json();
      const rawList = Array.isArray(json)
        ? json
        : json.data || json.items || json.produtos || [];
      list = rawList;

      let head = [];
      let body = [];
      if (type === "clientes") {
        head = [["Nome", "Email", "CPF/CNPJ", "Telefone"]];
        body = list.map((item) => [
          item.nome || "-",
          item.email || "-",
          item.cpf || item.cnpj || "-",
          item.telefone || "-",
        ]);
      } else if (type === "vendas") {
        head = [["ID", "Data", "Cliente", "Total", "Status"]];
        body = list.map((item) => [
          item.id || item._id || "-",
          item.created_at || item.data
            ? new Date(item.created_at || item.data).toLocaleDateString()
            : "-",
          item.cliente?.nome || item.cliente || "-",
          `R$ ${parseFloat(item.total || item.valor || 0).toFixed(2)}`,
          item.status || "-",
        ]);
      } else if (type === "produtos") {
        head = [["Nome", "Preço", "Categoria", "Estoque"]];
        body = list.map((item) => [
          item.nome || "-",
          `R$ ${parseFloat(item.preco || 0).toFixed(2)}`,
          item.categoria || "-",
          item.quantidade || item.estoque || "0",
        ]);
      } else if (type === "cupons") {
        head = [["Código", "Tipo", "Valor", "Validade", "Status"]];
        body = list.map((item) => [
          item.code || "-",
          item.discount_type === "percentage" ? "Porcentagem" : "Fixo",
          item.discount_type === "percentage"
            ? `${item.discount_value}%`
            : `R$ ${parseFloat(item.discount_value || 0).toFixed(2)}`,
          item.end_date
            ? new Date(item.end_date).toLocaleDateString()
            : "Indeterminado",
          item.active ? "Ativo" : "Inativo",
        ]);
      }
      autoTable(doc, {
        head,
        body,
        startY: 40,
        theme: "grid",
        headStyles: { fillColor: [7, 59, 76] },
      });
      doc.save(
        `relatorio_${type}_${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF.");
    } finally {
      setReportLoading(false);
    }
  };

  const donutData = getDonutSegments(stats.userDemographics);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Bem-vindo de volta, {adminName}
          </h1>
          <p className={styles.welcomeSubtitle}>
            Acompanhe o desempenho da sua loja e relatórios de tráfego.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>
            <FaDownload style={{ marginRight: 8 }} /> Exportar dados
          </button>
          <button className={styles.btnPrimary}>
            <FaPlus style={{ marginRight: 8 }} /> Criar relatório
          </button>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          title="Clientes Totais"
          value={loading ? "..." : stats.clientes}
          icon={<FaUserFriends />}
          linkTo="/adm/clientes"
          onPrint={() =>
            generatePDF(
              "clientes",
              "Relatório de Clientes",
              "https://apismilepet.vercel.app/api/client"
            )
          }
        />
        <StatCard
          title="Vendas Realizadas"
          value={loading ? "..." : stats.vendas}
          icon={<FaShoppingBag />}
          linkTo="/adm/vendas"
          onPrint={() =>
            generatePDF(
              "vendas",
              "Relatório de Vendas",
              "https://apismilepet.vercel.app/api/orders"
            )
          }
        />
        <StatCard
          title="Produtos Ativos"
          value={loading ? "..." : stats.produtos}
          icon={<FaBoxOpen />}
          linkTo="/adm/produtos"
          onPrint={() =>
            generatePDF(
              "produtos",
              "Relatório de Produtos",
              "https://apismilepet.vercel.app/api/produtos"
            )
          }
        />
        <StatCard
          title="Cupons de desconto"
          value={loading ? "..." : stats.cupons}
          icon={<FaTags />}
          linkTo="/adm/cupons"
          onPrint={() =>
            generatePDF("cupons", "Relatório de Cupons de Desconto", "")
          }
        />
      </section>

      <section className={styles.middleSection}>
        <div className={`${styles.card} ${styles.revenueCard}`}>
          <div className={styles.cardHeader}>
            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
              <div>
                <h3 className={styles.cardTitle}>Confirmados</h3>
                <div
                  className={styles.bigNumber}
                  style={{ color: "#166534", fontSize: "1.6rem" }}
                >
                  {loading ? "..." : stats.pedidosConfirmados.qtd}
                  <span
                    style={{
                      fontSize: "0.6em",
                      color: "#888",
                      marginLeft: "5px",
                    }}
                  >
                    (R${" "}
                    {stats.pedidosConfirmados.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                    )
                  </span>
                </div>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Pendentes</h3>
                <div
                  className={styles.bigNumber}
                  style={{ color: "#d97706", fontSize: "1.6rem" }}
                >
                  {loading ? "..." : stats.pedidosPendentes.qtd}
                  <span
                    style={{
                      fontSize: "0.6em",
                      color: "#888",
                      marginLeft: "5px",
                    }}
                  >
                    (R${" "}
                    {stats.pedidosPendentes.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                    )
                  </span>
                </div>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Cancelados</h3>
                <div
                  className={styles.bigNumber}
                  style={{ color: "#991b1b", fontSize: "1.6rem" }}
                >
                  {loading ? "..." : stats.pedidosCancelados.qtd}
                  <span
                    style={{
                      fontSize: "0.6em",
                      color: "#888",
                      marginLeft: "5px",
                    }}
                  >
                    (R${" "}
                    {stats.pedidosCancelados.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                    )
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <BsCircleFill color="#166534" size={10} /> Confirmado
              </span>
              <span className={styles.legendItem}>
                <BsCircleFill color="#d97706" size={10} /> Pendente
              </span>
              <span className={styles.legendItem}>
                <BsCircleFill color="#991b1b" size={10} /> Cancelado
              </span>
            </div>
          </div>
          <div className={styles.fakeChartArea}>
            <svg
              viewBox="0 0 100 40"
              className={styles.chartSvg}
              preserveAspectRatio="none"
            >
              {stats.chartData.length > 0 && (
                <>
                  {getPath(stats.chartData, "confirmados", "#166534")}
                  {getPath(stats.chartData, "pendentes", "#d97706")}
                  {getPath(stats.chartData, "cancelados", "#991b1b")}
                </>
              )}
            </svg>
            <div className={styles.chartLabels}>
              {stats.chartData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeaderSmall}>
              <h3 className={styles.cardTitle}>Vendas Totais (Pago)</h3>
            </div>
            <div className={styles.midNumber}>
              {loading
                ? "..."
                : `R$ ${stats.pedidosConfirmados.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`}
            </div>
            <div className={styles.barChartContainer}>
              {stats.chartData.length > 0 ? (
                stats.chartData.map((d, i) => {
                  const maxVal =
                    Math.max(
                      ...stats.chartData.map((x) => x.confirmadosValor)
                    ) || 1;
                  const h = (d.confirmadosValor / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className={styles.barItem}
                      style={{
                        height: `${Math.max(h, 5)}%`,
                        opacity: i % 2 === 0 ? 1 : 0.6,
                      }}
                      title={`${d.month}: R$ ${d.confirmadosValor.toFixed(2)}`}
                    ></div>
                  );
                })
              ) : (
                <div className={styles.subText}>Carregando...</div>
              )}
            </div>
            <div className={styles.subText}>Volume mensal de vendas pagas</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderSmall}>
              <h3 className={styles.cardTitle}>Produtos Mais Vendidos</h3>
            </div>
            <div style={{ marginTop: "20px" }}>
              {loading ? (
                <p>Carregando...</p>
              ) : stats.topProducts && stats.topProducts.length > 0 ? (
                <ul
                  className={styles.deviceList}
                  style={{
                    gap: "15px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {stats.topProducts.map((p, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "5px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color:
                              idx === 0
                                ? "#d97706"
                                : idx === 1
                                ? "#71717a"
                                : "#a16207",
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <span style={{ fontSize: "0.9rem", color: "#333" }}>
                          {p.name.length > 20
                            ? p.name.substring(0, 20) + "..."
                            : p.name}
                        </span>
                      </div>
                      <span
                        className={styles.badge}
                        style={{
                          backgroundColor: "#f0f9ff",
                          color: "#0369a1",
                          fontWeight: "600",
                        }}
                      >
                        {p.qty} un
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#666", fontSize: "0.9em" }}>
                  Nenhum produto vendido ainda.
                </p>
              )}
            </div>
            <div className={styles.subText} style={{ marginTop: "auto" }}>
              Top 3 produtos
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bottomSection}>
        {/* Users Demographics Chart */}
        <div className={`${styles.card} ${styles.deviceCard}`}>
          <h3 className={styles.cardTitle}>Demografia de Usuários</h3>
          <div className={styles.donutContainer}>
            <div
              className={styles.donutChart}
              style={{
                position: "relative",
                width: "150px",
                height: "150px",
                margin: "0 auto",
              }}
            >
              {/* SVG Donut */}
              <svg
                viewBox="0 0 42 42"
                className="donut"
                width="100%"
                height="100%"
              >
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#eee"
                  strokeWidth="6"
                ></circle>
                {donutData.segments &&
                  donutData.segments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="6"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                    ></circle>
                  ))}
              </svg>

              <div
                className={styles.donutCenter}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <span
                  className={styles.donutValue}
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    display: "block",
                  }}
                >
                  {stats.clientes}
                </span>
                <span
                  className={styles.donutLabel}
                  style={{ fontSize: "0.8rem", color: "#666" }}
                >
                  Usuários
                </span>
              </div>
            </div>
          </div>
          <ul className={styles.deviceList} style={{ marginTop: "20px" }}>
            {stats.userDemographics.map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    className={styles.deviceBullet}
                    style={{ background: item.color }}
                  ></span>
                  <span>{item.label}</span>
                </div>
                <span className={styles.deviceValue}>{item.count}</span>
              </li>
            ))}
            {stats.userDemographics.length === 0 && !loading && (
              <li>Sem dados de endereço</li>
            )}
          </ul>
        </div>

        <div className={`${styles.card} ${styles.tableCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Pedidos Recentes</h3>
            <button
              className={styles.btnText}
              onClick={() => navigate("/adm/vendas")}
            >
              Ver tudo
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Carregando...</td>
                </tr>
              ) : stats.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order, idx) => (
                  <tr key={idx}>
                    <td className={styles.fwBold}>{order.id}</td>
                    <td className={styles.textMuted}>{order.date}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${styles[order.stClass]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className={styles.fwBold}>{order.amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">Nenhum pedido recente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, linkTo, onPrint }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const handlePrint = () => {
    setMenuOpen(false);
    if (onPrint) onPrint();
    else window.print();
  };
  const handleDetails = () => {
    setMenuOpen(false);
    if (linkTo) navigate(linkTo);
  };
  return (
    <div className={styles.statCard} onMouseLeave={() => setMenuOpen(false)}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon}>{icon}</div>
        <button
          className={styles.moreIconButton}
          onClick={() => setMenuOpen(!menuOpen)}
          title="Mais opções"
        >
          <BiDotsHorizontalRounded />
        </button>
      </div>
      <div className={styles.statContent}>
        <div className={styles.statValue}>{value}</div>
      </div>
      <div className={styles.statTitle}>{title}</div>
      {menuOpen && (
        <div className={styles.menuPopover}>
          <button className={styles.menuItem} onClick={handlePrint}>
            <FaPrint /> Imprimir relatório em PDF
          </button>
          <button className={styles.menuItem} onClick={handleDetails}>
            <FaExternalLinkAlt /> Acessar detalhes
          </button>
        </div>
      )}
    </div>
  );
}
