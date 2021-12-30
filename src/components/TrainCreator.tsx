import xs from 'xstream';
import {Stream} from 'xstream' ;
import {h, ReactSource} from '@cycle/react';
import {Segment, Container, Header, Button} from 'semantic-ui-react' ;

function intent(reactSource: ReactSource, incSym: symbol, decSym: symbol) {
  const inc$ = reactSource.select(incSym).events('click') ;
  const dec$ = reactSource.select(decSym).events('click') ;
  return {inc$, dec$} ;
}

function model(
  prop$: Stream<{lineColor: string}>
  , inc$: Stream<any>
  , dec$: Stream<any>
) {

  const count$ = xs.merge(
    inc$.map(() => 1)
    , dec$.map(() => -1)
  )
    .fold(
      (acc: number, curr: number) => (
        (sum =>
          sum < 0
          ? 0
          : sum
        )(acc + curr)
      )
      , 0
    )
  ;

  const state$ = xs.combine(prop$, count$)
    .map(
      ([{lineColor}, trainCount]: [{lineColor: string}, number]) =>
        ({lineColor, trainCount})
    )
    .remember()
  ;

  return {state$, count$} ;

}

function view(
  state$: Stream<{lineColor: string, trainCount: number}>
  , inc: symbol
  , dec: symbol
) {
  return state$.map(
    ({lineColor, trainCount}: {lineColor: string, trainCount: number}) =>
      h(Segment, {vertical: true}, [
        <Header as="h2">{lineColor} Line Trains: {trainCount}</Header>
        , <Button.Group>
          {h(Button, {sel: dec}, 'Fewer')}
          <Button.Or/>
          {h(Button, {sel: inc, positive: true}, 'More')}
        </Button.Group>
        , h(Container, (
          trainCount === 0
          ? '(No trains)'
          : '🚆'.repeat(trainCount)
         ))
      ])
  ) ;
}

export default function TrainCreator(sources: {
  react: ReactSource
  , props: Stream<{lineColor: string}>
}) {

  const prop$ = sources.props ;

  const incSym = Symbol();
  const decSym = Symbol();

  const {inc$, dec$} = intent(sources.react, incSym, decSym) ;

  const {state$, count$} = model(prop$, inc$, dec$) ;

  const vdom$ = view(state$, incSym, decSym) ;

  const value$ = count$
    .map((totalTrains: number) => ({totalTrains}))
  ;

  return {
    react: vdom$
    , value: value$
  } ;

}
