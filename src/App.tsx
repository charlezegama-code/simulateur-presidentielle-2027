import { Route, Switch } from 'wouter'
import { Layout } from './components/Layout'
import { H1 } from './components/ui'
import { CandidatePage } from './pages/CandidatePage'
import { Candidates } from './pages/Candidates'
import { Compare } from './pages/Compare'
import { Home } from './pages/Home'
import { Methodology } from './pages/Methodology'
import { Neutrality } from './pages/Neutrality'
import { Questionnaire } from './pages/Questionnaire'
import { Results } from './pages/Results'
import { ProfileProvider } from './state/profile'

export default function App() {
  return (
    <ProfileProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/questionnaire" component={Questionnaire} />
          <Route path="/resultats" component={Results} />
          <Route path="/comparer" component={Compare} />
          <Route path="/candidats" component={Candidates} />
          <Route path="/candidat/:id">{(p) => <CandidatePage id={p.id} />}</Route>
          <Route path="/aide" component={Methodology} />
          <Route path="/neutralite" component={Neutrality} />
          <Route>
            <div className="px-5 pt-6">
              <H1>Page introuvable</H1>
            </div>
          </Route>
        </Switch>
      </Layout>
    </ProfileProvider>
  )
}
