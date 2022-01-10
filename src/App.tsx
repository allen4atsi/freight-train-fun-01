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
  , timer1$: Stream<any>
  , timer2$: Stream<any>
) {
  return xs.combine(state$, addTrainLinesVdom$, trainLineVdom$, timer1$, timer2$)
    .map((
      [state, addTrainLinesVdom, trainLineVdoms, timer1, timer2]: [
        {totalTrains: number}
        , any
        , any
        , number
        , number
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
        , <Segment>
          <svg viewBox="0 0 10000 10000" preserveAspectRatio="xMidYMid slice">
            <rect
              x="0" y="0"
              width="10000" height="10000"
              style={{fill: "#000000FF"}}
            />
            <rect
              x={timer1} y="1000"
              width="1000" height="1000"
              style={{fill: "#00770077"}}
            />
            <rect
              x={timer2} y="1500"
              width="1000" height="1000"
              style={{fill: "#77000077"}}
            />
          </svg>
        </Segment>
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

  const vdom$ = view(state$, addTrainLinesVdom$, trainLineVdom$, sources.timer1, sources.timer2) ;

  return {
    react: vdom$
  }

}

const App = makeComponent(main, {
  timer1: () => xs
    .periodic(50)
    .fold(
      ({i, up}, c) => {
        if (i === 0 && !up) return {i: 0, up: true} ;
        else if (i === 1000 && up) return {i: 1000, up: false} ;
        else return {i: up ? i + 10 : i - 10, up}
      }
      , {i: 0, up: true}
    )
    .map(({i}) => i)
  , timer2: () => xs
    .periodic(50)
    .fold(
      ({i, up}, c) => {
        if (i === 0 && !up) return {i: 0, up: true} ;
        else if (i === 1000 && up) return {i: 1000, up: false} ;
        else return {i: up ? i + 10 : i - 10, up}
      }
      , {i: 500, up: true}
    )
    .map(({i}) => i)
}) ;

export default App;
