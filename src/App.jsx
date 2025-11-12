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
import Usuario from "./components/Usuario/usuario";
import LoginUsuario from "./components/Usuario/login/loginUsuario";
import CadastroUsuario from "./components/Usuario/cadastro/cadastroUsuario";
import Perfil from "./components/Usuario/perfil/perfil";
import MeusPedidos from "./components/Usuario/pedidos/pedidos";
import Header from "./components/Header/header";
import CarrinhoModal from "./components/carrinhoModal/carrinhoModal";
import BlingCallback from "./components/Bling/callback";
import AdmPage from "./components/Administracao/admPage";

function Home() {
  return (
    <>
      <FaixaSmileFriday />
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
  // hide the global header on the ofertas page and on adm area
  if (
    location &&
    (location.pathname === "/ofertas" || location.pathname.startsWith("/adm"))
  )
    return null;
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
          </Routes>
        </main>
      </div>
      <Footer />
      <CarrinhoModal />
    </Router>
  );
}

export default App;
