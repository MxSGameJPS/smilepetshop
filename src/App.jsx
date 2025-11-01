import Produtos from "./components/Produtos/produtos";
import Produto from "./components/Produtos/produto";
import MarcasTodas from "./components/MarcasTodas/marcastodas";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Avaliacao from "./components/Avaliacao/avaliacao";
import Banner from "./components/banner/Banner";
import BannerMeio from "./components/BannerMeio/BannerMeio";
import Cards from "./components/Cards/cards";
import Destaques from "./components/Destaques/Destaques";
import Faixa from "./components/faixa/Faixa";
import Footer from "./components/Footer/footer";
import Header from "./components/Header/header";
import Marcas from "./components/marcas/marcas";
import Contato from "./components/Contato/contato";
import Envio from "./components/Envio/envio";
import Devolucoes from "./components/Devolucoes/devolucoes";
import Faq from "./components/Faq/faq";
import Carrinho from "./components/Carrinho/carrinho";
import Checkout from "./components/Checkout/checkout";
import Pedido from "./components/Pedido/pedido";
import Ofertas from "./components/ofertas/ofertas";

function Home() {
  return (
    <>
      <Banner />
      <Faixa />
      <Cards />
      <Destaques />
      <BannerMeio />
      <Avaliacao />
      <Marcas />
    </>
  );
}

function HeaderConditional() {
  const location = useLocation();
  // hide the global header on the ofertas page
  if (location && location.pathname === "/ofertas") return null;
  return <Header />;
}

function App() {
  return (
    <Router>
      <HeaderConditional />
      <div className="appContent">
        <main className="mainContent">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/envio" element={<Envio />} />
            <Route path="/devolucoes" element={<Devolucoes />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/marcas" element={<MarcasTodas />} />
            <Route path="/ofertas" element={<Ofertas />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/:id" element={<Produto />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido" element={<Pedido />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
