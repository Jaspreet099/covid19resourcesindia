import React from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import InfoPage from "./pages/InfoPage"
import "./Site.css"

function Site() {
  return (
    <Router>
      <div id="site" className="Site">
        <Header />
        <Switch>
          <Route path="/" component={Home} exact />
          <Route path="/search" component={Home} />
          <Route path="/info/:page" component={InfoPage} />
          {/* <Route path="/contribute" component={Contribute} /> */}
        </Switch>
        <Footer />
      </div>
    </Router>
  )
}

export default Site
