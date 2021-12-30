import './App.css';
import xs from 'xstream';
import {Stream} from 'xstream' ;
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import sampleCombine from 'xstream/extra/sampleCombine';
import {h, makeComponent, ReactSource} from '@cycle/react';
import {Container, Header, Button, Segment, Dropdown} from 'semantic-ui-react' ;
import TrainCreator from './components/TrainCreator' ;

const lineColorSelectorSym = Symbol() ;
const lineColorAddButtonSym = Symbol() ;

function view(
  state$: Stream<{totalTrains: number}>
  , trainLineVdom$: Stream<any>
) {
  return xs.combine(state$, trainLineVdom$)
    .map(([state, trainLineVdoms]: [{totalTrains: number}, any]) =>
      h(Container, [
        <Segment vertical>
          <Header as="h1">
            Freight Train Fun 01
            <Header.Subheader>Have fun watching your trains follow the
            logistical rules you build for them.</Header.Subheader>
          </Header>
        </Segment>
        , <Segment vertical>
          <Header as="h3">Add some train lines</Header>
          {
            h(Dropdown, {
              sel: lineColorSelectorSym
              , selection: true
              , search: true
              , placeholder: 'New line color'
              , options: [
                {key: 'Red', value: 'Red', text: 'Red'}
                , {key: 'Blue', value: 'Blue', text: 'Blue'}
                , {key: 'Green', value: 'Green', text: 'Green'}
                , {key: 'Purple', value: 'Purple', text: 'Purple'}
                , {key: 'Orange', value: 'Orange', text: 'Orange'}
              ]
            })
          }{
            h(Button, {sel: lineColorAddButtonSym}, '+')
          }
        </Segment>
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

  const trainLineAddButtonClick$ = sources.react
    .select(lineColorAddButtonSym)
    .events('click')
  ;

  const trainLineSelection$ = sources.react
    .select(lineColorSelectorSym)
    .events('change')
    .map((event: any) => event.target.textContent)
    .filter((text: string) => text !== '')
  ;

  const addedTrainLineColors$ = trainLineAddButtonClick$
    .compose(sampleCombine(trainLineSelection$))
    .map(([clickEvent, selectorText]: [any, string]) => selectorText)
    .fold(
      (
        acc: {
          used: {
            [key: string]: boolean}
            , color: string
            , colorWasInUsed: boolean
          }
        , color: string
      ) => ({
        used: Object.assign({}, acc.used, {[color]: true})
        , color
        , colorWasInUsed: typeof acc.used[color] !== 'undefined'
      })
      , {used: {}, color: '', colorWasInUsed: true}
    )
    .filter(({colorWasInUsed}: {colorWasInUsed: boolean}) => !colorWasInUsed)
    .map(({color}: {color: string}) => color)
  ;

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

  const vdom$ = view(state$, trainLineVdom$) ;

  return {
    react: vdom$
  }

}

const App = makeComponent(main) ;

export default App;
