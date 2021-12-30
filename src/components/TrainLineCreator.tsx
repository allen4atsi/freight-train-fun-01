import xs from 'xstream';
import {Stream} from 'xstream' ;
import sampleCombine from 'xstream/extra/sampleCombine';
import {h, ReactSource} from '@cycle/react';
import {Segment, Container, Header, Button, Dropdown} from 'semantic-ui-react' ;

function intent(
  reactSource: ReactSource
  , lineColorSelectorSym: symbol
  , lineColorAddButtonSym: symbol
) {
  const trainLineAddButtonClick$ = reactSource
    .select(lineColorAddButtonSym)
    .events('click')
  ;
  const trainLineSelection$ = reactSource
    .select(lineColorSelectorSym)
    .events('change')
    .map((event: any) => event.target.textContent)
    .filter((text: string) => text !== '')
  ;
  return {trainLineAddButtonClick$, trainLineSelection$} ;
}

function model(
  trainLineAddButtonClick$: Stream<any>
  , trainLineSelection$: Stream<any>
) {
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
  return { addedTrainLineColors$ } ;
}

function view(
  lineColorSelectorSym: symbol
  , lineColorAddButtonSym: symbol
) {
  return xs.of(
    <Segment vertical>
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
  ) ;
}

export default function TrainLineCreator(sources: {react: ReactSource}) {

  const lineColorSelectorSym = Symbol() ;
  const lineColorAddButtonSym = Symbol() ;

  const {trainLineAddButtonClick$, trainLineSelection$} = intent(
    sources.react
    , lineColorSelectorSym, lineColorAddButtonSym
  ) ;

  const {addedTrainLineColors$} = model(
    trainLineAddButtonClick$
    , trainLineSelection$
  ) ;

  const vdom$ = view(lineColorSelectorSym, lineColorAddButtonSym) ;

  return {
    react: vdom$
    , addedTrainLineColors: addedTrainLineColors$
  } ;

}
