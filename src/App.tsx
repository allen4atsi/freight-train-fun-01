import './App.css';
import xs from 'xstream';
import {Stream} from 'xstream' ;
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import {h, makeComponent, ReactSource} from '@cycle/react';
import {Container, Header, Button, Segment, Dropdown} from 'semantic-ui-react' ;
import TrainCreator from './components/TrainCreator' ;
import TrainLineCreator from './components/TrainLineCreator' ;

function view(
  state$: Stream<{totalTrains: number}>
  , addTrainLinesVdom$: Stream<any>
  , trainLineVdom$: Stream<any>
) {
  return xs.combine(state$, addTrainLinesVdom$, trainLineVdom$)
    .map((
      [state, addTrainLinesVdom, trainLineVdoms]: [
        {totalTrains: number}
        , any
        , any
      ]
    ) =>
      h(Container, [
        <Segment vertical>
          <Header as="h1">
            Freight Train Fun 01
            <Header.Subheader>Have fun watching your trains follow the
            logistical rules you build for them.</Header.Subheader>
          </Header>
        </Segment>
        , addTrainLinesVdom
        , ...trainLineVdoms
        , <Segment>Total trains: {state.totalTrains}</Segment>
      ])
    )
  ;
}

function model(trainLineValues$: Stream<{totalTrains: number}[]>) {
  return trainLineValues$
    .map(
      (trainValues: {totalTrains: number}[]) => ({
        totalTrains: trainValues
          .map(({totalTrains}: {totalTrains: number}) => totalTrains)
          .reduce((a: number,c: number) => a+c, 0)
      })
    )
  ;
}

function main(sources: any) {

  const {
    react: addTrainLinesVdom$
    , addedTrainLineColors: addedTrainLineColors$
  } = TrainLineCreator({react: sources.react}) ;

  const trainLines$ = addedTrainLineColors$
    .fold(
      (acc: any, lineColor: string) =>
        (
          ({value, react}: {value: any, react: any}) => ({
            value$s: acc.value$s.concat(value)
            , vdom$s: acc.vdom$s.concat(react)
          })
        )(
          TrainCreator({
            react: sources.react
            , props: xs.of({lineColor})
          })
        )
      , {value$s: [] ,vdom$s: []}
    )
  ;

  const trainLineValues$ = trainLines$
    .map(
      ({value$s}: {value$s: Stream<{totalTrains: number}>[]}) =>
        xs.combine(...value$s)
    )
    .compose(flattenConcurrently)
  ;

  const trainLineVdom$ = trainLines$
    .map(({vdom$s}: {vdom$s: Stream<any>[]}) => xs.combine(...vdom$s))
    .compose(flattenConcurrently)
  ;

  const state$ = model(trainLineValues$) ;

  const vdom$ = view(state$, addTrainLinesVdom$, trainLineVdom$) ;

  return {
    react: vdom$
  }

}

const App = makeComponent(main) ;

export default App;
