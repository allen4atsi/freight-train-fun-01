import xs from 'xstream';
import {h, makeComponent} from '@cycle/react';
import {Container, Header, Button} from 'semantic-ui-react' ;

function intent(reactSource: any, incSym: symbol, decSym: symbol) {
  const inc$ = reactSource.select(incSym).events('click') ;
  const dec$ = reactSource.select(decSym).events('click') ;
  return {inc$, dec$} ;
}

function model(prop$: any, inc$: any, dec$: any) {

  const count$ = xs.merge(
    inc$.map(() => 1)
    , dec$.map(() => -1)
  )
    .fold(
      (acc: number, curr: any) => (
        (sum =>
          sum < 0
          ? 0
          : sum
        )(acc + curr)
      )
      , 0
    )
  ;

  const state$ = prop$
    .map(
      ({lineColor}: {lineColor: string}) => count$
        .map((trainCount: number) => ({lineColor, trainCount}))
        // .startWith({lineColor})
    )
    .flatten()
    .remember()
  ;

  return {state$, count$} ;

}

function view(state$: any, inc: symbol, dec: symbol) {
  return state$.map(
    ({lineColor, trainCount}: {lineColor: string, trainCount: number}) =>
      [
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
      ]
  ) ;
}

export default function TrainCounter(sources: any) {

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
