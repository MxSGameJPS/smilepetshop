
import './App.css'
import Banner from './components/banner/Banner'
import BannerMeio from './components/BannerMeio/BannerMeio'
import Cards from './components/Cards/cards'
import Destaques from './components/Destaques/Destaques'
import Faixa from './components/faixa/Faixa'
import Header from './components/Header/header'

function App() {

  return (
    <>
      <Header />
      <Banner />
      <Faixa />
      <Cards />
      <Destaques />
      <BannerMeio />
    </>
  )
}

export default App
