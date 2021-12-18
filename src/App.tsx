import './App.css';
import xs from 'xstream';
import {h, makeComponent} from '@cycle/react';
import {Container, Header, Button} from 'semantic-ui-react' ;

function main(sources: any) {
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

  const vdom$ = count$.map((i: number) =>
    h(Container, [
      <Header as="h1">
        Freight Train Fun 01
        <Header.Subheader>Have fun watching your trains follow the logistical rules you build
        for them.</Header.Subheader>
      </Header>,
      , <Header as="h2">Trains: {i}</Header>
      , <Button.Group>
        {h(Button, {sel: dec}, 'Fewer')}
        <Button.Or/>
        {h(Button, {sel: inc, positive: true}, 'More')}
      </Button.Group>
      , h('div', '🚃'.repeat(i))
    ]),
  );

  return {
    react: vdom$,
  };
}

const App = makeComponent(main);

export default App;
