import xs from 'xstream';
import {h, makeComponent} from '@cycle/react';
import {Container, Header, Button} from 'semantic-ui-react' ;

export default function TrainCounter(sources: any) {

  const prop$ = sources.props ;

  const inc = Symbol();
  const inc$ = sources.react.select(inc).events('click');

  const dec = Symbol();
  const dec$ = sources.react.select(dec).events('click');

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

  const vdom$ = state$.map(({lineColor, trainCount}: {lineColor: string, trainCount: number}) =>
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
  );

  const value$ = count$
    .map((totalTrains: number) => ({totalTrains}))
  ;

  return {
    react: vdom$
    , value: value$
  };
}
