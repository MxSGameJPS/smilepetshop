import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginAdm from "./Login/loginAdm";
// import HeaderAdm from "./HeaderADM/headerAdm"; // Removido em favor do Dashboard
import Dashboard from "./Dashboard/dashboard";
import PaginaClientes from "./PaginaClientes/paginaCliente";
import PaginaProdutos from "./PaginaProdutos/paginaProduto";
import PaginaVendas from "./PaginaVendas/paginaVendas";
import VendaDetalhes from "./PaginaVendas/VendaDetalhes/vendaDetalhes";
import AdmHome from "./AdmHome/admHome";
import RelatoriosAdm from "./RelatoriosAdm/relatoriosAdm";
import RelatorioVendas from "./RelatoriosAdm/relatorioVendas";
import RelatorioProdutos from "./RelatoriosAdm/relatorioProdutos";
import ProdutoAdm from "./PaginaProdutos/Produtos/produtoAdm";
import CadastroProduto from "./PaginaProdutos/Cadastro de Produto/cadastroProduto";
import Cupons from "./Cupons/cupons";
import TodasPaginas from "./Dashboard/todaAsPaginas/todasPaginas";
import PaginaCategorias from "./PaginaCategorias/paginaCategorias";

function readAdminFromStorage() {
  try {
    const raw = localStorage.getItem("smilepet_admin");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function AdmPage() {
  const [admin, setAdmin] = useState(() => readAdminFromStorage());

  useEffect(() => {
    function onChange() {
      setAdmin(readAdminFromStorage());
    }

    // listen to custom event dispatched on logout/login
    window.addEventListener("smilepet_admin_changed", onChange);
    // also listen to storage events (other tabs)
    window.addEventListener("storage", onChange);

    return () => {
      window.removeEventListener("smilepet_admin_changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!admin) {
    // show login page
    return <LoginAdm />;
  }

  return (
    <Dashboard>
      <Routes>
        <Route path="/" element={<Navigate to="home" replace />} />
        <Route path="home" element={<TodasPaginas />} />
        <Route path="clientes" element={<PaginaClientes />} />
        <Route path="produtos" element={<PaginaProdutos />} />
        <Route path="produtos/novo" element={<CadastroProduto />} />
        <Route path="produtos/:id" element={<ProdutoAdm />} />
        <Route path="produtos/:id/editar" element={<ProdutoAdm />} />
        <Route path="categorias" element={<PaginaCategorias />} />
        <Route path="vendas" element={<PaginaVendas />} />
        <Route path="vendas/:id" element={<VendaDetalhes />} />
        <Route path="relatorios" element={<RelatoriosAdm />} />
        <Route path="relatorios/vendas" element={<RelatorioVendas />} />
        <Route path="relatorios/produtos" element={<RelatorioProdutos />} />
        <Route path="cupons" element={<Cupons />} />
      </Routes>
    </Dashboard>
  );
}
