import './App.css';
import xs from 'xstream';
import {h, makeComponent} from '@cycle/react';
import {Container, Header, Button, Segment} from 'semantic-ui-react' ;
import TrainCreator from './components/TrainCreator' ;

function view(
  state$: any
  , redLineCreatorVdom$: any
  , blueLineCreatorVdom$: any
) {
  return xs.combine(
    state$, redLineCreatorVdom$, blueLineCreatorVdom$
  )
    .map(([
      state, redLineCreatorVdom, blueLineCreatorVdom
    ]: [any, any, any]) =>
      h(Container, [
        <Header as="h1">
          Freight Train Fun 01
          <Header.Subheader>Have fun watching your trains follow the logistical rules you build
          for them.</Header.Subheader>
        </Header>
        , redLineCreatorVdom
        , blueLineCreatorVdom
        , <Segment>Total trains: {state.totalTrains}</Segment>
      ])
    )
  ;
}

function model(redLineCreatorValue$: any, blueLineCreatorValue$: any) {
  return xs.combine(redLineCreatorValue$, blueLineCreatorValue$)
    .map(
      ([
        {totalTrains: redTotalTrains}
        , {totalTrains: blueTotalTrains}
      ]: [any, any]) => ({totalTrains: redTotalTrains + blueTotalTrains})
    )
  ;
}

function main(sources: any) {

  const {
    value: redLineCreatorValue$
    , react: redLineCreatorVdom$
  } = TrainCreator({
    react: sources.react
    , props: xs.of({lineColor: 'Red'})
  }) ;
  const {
    value: blueLineCreatorValue$
    , react: blueLineCreatorVdom$
  } = TrainCreator({
    react: sources.react
    , props: xs.of({lineColor: 'Blue'})
  }) ;

  const state$ = model(redLineCreatorValue$, blueLineCreatorValue$) ;

  const vdom$ = view(state$, redLineCreatorVdom$, blueLineCreatorVdom$) ;

  return {
    react: vdom$
  }

}

const App = makeComponent(main) ;

export default App;
