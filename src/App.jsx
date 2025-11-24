import Produtos from "./components/Produtos/produtos.jsx";
import SobreNos from "./components/SobreNos/sobreNos";
import Produto from "./components/Produtos/produto.jsx";
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
import Marcas from "./components/marcas/marcas";
import Contato from "./components/Contato/contato";
import Envio from "./components/Envio/envio";
import Devolucoes from "./components/Devolucoes/devolucoes";
import Faq from "./components/Faq/faq";
import Carrinho from "./components/Carrinho/carrinho";
import Checkout from "./components/Checkout/checkout";
import ColetaDeEmail from "./components/Checkout/coletaDeEmail/coletaDeEmail";
import Pedido from "./components/Pedido/pedido";
import Ofertas from "./components/ofertas/ofertas";
import Atacado from "./components/Atacado/atacado";
import LoginAtacado from "./components/Atacado/loginAtacado/loginAtacado";
import CadastroAtacado from "./components/Atacado/cadastroAtacado/cadastroAtacado";
import FaixaSmileFriday from "./components/faixaSmileFriday/faixaSmileFriday";
import HomeTemporaria from "./components/homeTemporaria/homeTemporaria.jsx";
import WhatsAppFloating from "./components/WhatsAppFloating/WhatsAppFloating";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import Usuario from "./components/Usuario/usuario";
import LoginUsuario from "./components/Usuario/login/loginUsuario";
import CadastroUsuario from "./components/Usuario/cadastro/cadastroUsuario";
import Perfil from "./components/Usuario/perfil/perfil";
import MeusPedidos from "./components/Usuario/pedidos/pedidos";
import Header from "./components/Header/header";
import CarrinhoModal from "./components/carrinhoModal/carrinhoModal";
import BlingCallback from "./components/Bling/callback";
import AdmPage from "./components/Administracao/admPage";
import FaixaCorrida from "./components/faixacorrida/faixaCorrida";

function Home() {
  return (
    <div className="homeWrapper">
      <FaixaCorrida />
      <Banner />
      <Faixa />
      <FaixaSmileFriday />
      <Cards />
      <Destaques />
      <BannerMeio />
      <Avaliacao />
      <Marcas />
      <WhatsAppFloating />
      <ScrollToTop />
    </div>
  );
}

function HeaderConditional() {
  const location = useLocation();
  // hide the global header on the ofertas page
  // hide the global header on the ofertas page and on adm area
  if (
    location &&
    (location.pathname === "/ofertas" ||
      location.pathname.startsWith("/adm") ||
      location.pathname === "/")
  )
    return null;
  return <Header />;
}

function FooterConditional() {
  const location = useLocation();
  if (location && location.pathname === "/") return null;
  return <Footer />;
}

function CarrinhoModalConditional() {
  const location = useLocation();
  if (location && location.pathname === "/") return null;
  return <CarrinhoModal />;
}

function App() {
  return (
    <Router>
      <HeaderConditional />
      <div className="appContent">
        <main className="mainContent">
          <Routes>
            <Route path="/" element={<HomeTemporaria />} />
            <Route path="/home" element={<Home />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/envio" element={<Envio />} />
            <Route path="/devolucoes" element={<Devolucoes />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/marcas" element={<MarcasTodas />} />
            <Route path="/ofertas" element={<Ofertas />} />
            <Route path="/embreve" element={<HomeTemporaria />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/:id" element={<Produto />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/coletadeemail" element={<ColetaDeEmail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido" element={<Pedido />} />
            <Route path="/atacado" element={<Atacado />} />
            <Route path="/loginatacado" element={<LoginAtacado />} />
            <Route path="/cadastroatacado" element={<CadastroAtacado />} />
            <Route path="/usuario" element={<Usuario />} />
            <Route path="/login" element={<LoginUsuario />} />
            <Route path="/cadastro" element={<CadastroUsuario />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/bling/callback" element={<BlingCallback />} />
            <Route path="/adm/*" element={<AdmPage />} />
            <Route path="/sobre-nos" element={<SobreNos />} />
          </Routes>
        </main>
      </div>
      <FooterConditional />
      <CarrinhoModalConditional />
    </Router>
  );
}

export default App;
