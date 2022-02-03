import { Subject, Observable, of, OperatorFunction } from 'rxjs';
import { map, combineLatestWith } from 'rxjs/operators';
import Graph from 'graphology';
import {bfsFromNode} from 'graphology-traversal/bfs';

/* const stream = new Subject<number>();

stream.subscribe((x) => console.log("stream value: ", x));

stream.next(5);
stream.next(1); */

/* const bar = new Subject<number>();

const tick = bar.pipe(map((x) => x + 1));

const letter = tick.pipe(map((x => x * 2)));

bar.subscribe((x) => console.log("bar: ", x));
tick.subscribe((x) => console.log("tick: ", x));
letter.subscribe((x) => console.log("letter: ", x));

bar.next(27); */

/* type Segment = {
  top: number,
  height: number,
  bottom: number,
};

const bar: Subject<Segment> = new Subject<Segment>();
// vSpace(5)
const tick: Observable<Segment> = bar.pipe(map(({ top: barTop, height: barHeight, bottom: barBottom, }) => {
  const top = barBottom + 5;
  const height = 8;
  const bottom = top + height;
  return { top, height, bottom, };
}));
// vSpace(1)
const letter: Observable<Segment> = tick.pipe(map(({ top: tickTop, height: tickHeight, bottom: tickBottom, }) => {
  const top = tickBottom + 1;
  const height = 10;
  const bottom = top + height;
  return { top, height, bottom, };
}));


bar.subscribe((x) => console.log("bar: ", x));
tick.subscribe((x) => console.log("tick: ", x));
letter.subscribe((x) => console.log("letter: ", x));

bar.next({top: 0, height: 100, bottom: 100}); */

type Segment = {
  top: number,
  height: number,
  bottom: number,
};

const barPresets: Observable<Partial<Segment>> = of({top: undefined, height: 100, bottom: undefined})
const barInput: Subject<Partial<Segment>> = new Subject<Partial<Segment>>();

const tickPresets: Observable<Partial<Segment>> = of({top: undefined, height: 8, bottom: undefined})
const tickInput: Subject<Partial<Segment>> = new Subject<Partial<Segment>>();

const letterPresets: Observable<Partial<Segment>> = of({top: undefined, height: 10, bottom: undefined})
const letterInput: Subject<Partial<Segment>> = new Subject<Partial<Segment>>();

// TODO: maybe want to check for undefined as well.
const applyPresets: OperatorFunction<[Partial<Segment>, Partial<Segment>], Partial<Segment>> = map(([{ top: topInput, height: heightInput, bottom: bottomInput}, { top: topPreset, height: heightPreset, bottom: bottomPreset, }]) => {
  const maybeTop = topPreset ?? topInput;
  const maybeHeight = heightPreset ?? heightInput;
  const maybeBottom = bottomPreset ?? bottomInput;

  /* select how to propagate information */
  /* TODO: there's gotta be some way to do this directly with rxjs right? */
  let top, height, bottom;
  if (maybeTop === undefined && maybeHeight !== undefined && maybeBottom !== undefined) {
    top = maybeBottom - maybeHeight;
    height = maybeHeight;
    bottom = maybeBottom;
  } else if (maybeTop !== undefined && maybeHeight === undefined && maybeBottom !== undefined) {
    top = maybeTop;
    height = maybeBottom - maybeTop;
    bottom = maybeBottom;
  } else if (maybeTop !== undefined && maybeHeight !== undefined && maybeBottom === undefined) {
    top = maybeTop;
    height = maybeHeight;
    bottom = maybeTop + maybeHeight;
  } else if (maybeTop !== undefined && maybeHeight !== undefined && maybeBottom !== undefined) {
    if (maybeTop + maybeHeight !== maybeBottom) {
      throw `Incompatible constraints:
  top (${maybeTop}) + height (${maybeHeight}) != bottom (${maybeBottom})

  input:   { top: ${topInput}, height: ${heightInput}, bottom: ${bottomInput}}
  presets: { top: ${topPreset}, height: ${heightPreset}, bottom: ${bottomPreset}}
`;
    } else {
      top = maybeTop;
      height = maybeHeight;
      bottom = maybeBottom;
    }
  } else {
//     const nullFields = [
//       { name: "top", value: maybeTop, },
//       { name: "height", value: maybeHeight, },
//       { name: "bottom", value: maybeBottom, },
//     ].filter((x) => x.value === null);

//     throw `Underconstrained system:
//   At most 1 field may be null, but ${nullFields.length} are null.
//   The following fields are null: ${nullFields.map((x) => x.name).join(', ')}

//   input:   { top: ${topInput}, height: ${heightInput}, bottom: ${bottomInput}}
//   presets: { top: ${topPreset}, height: ${heightPreset}, bottom: ${bottomPreset}}
// `;
    top = maybeTop;
    height = maybeHeight;
    bottom = maybeBottom;
  }

  return {
    top,
    height,
    bottom,
  }
});

const bar = barInput.pipe(
  combineLatestWith(barPresets),
  applyPresets,
)

const vSpace = (spacing: number) => map(([s2, s1]) => {
  const top = s1.bottom + spacing;
  const height = s2.height;
  const bottom = top + height;
  return {
    top,
    height,
    bottom,
  }
})

const tick = tickInput.pipe(
  combineLatestWith(tickPresets),
  applyPresets,
  combineLatestWith(bar),
  vSpace(5),
)

const letter = letterInput.pipe(
  combineLatestWith(letterPresets),
  applyPresets,
  combineLatestWith(tick),
  vSpace(1),
)

bar.subscribe((x) => console.log("bar: ", x));
tick.subscribe((x) => console.log("tick: ", x));
letter.subscribe((x) => console.log("letter: ", x));

barInput.next({top: 0, height: undefined, bottom: undefined});
tickInput.next({top: undefined, height: undefined, bottom: undefined});
letterInput.next({top: undefined, height: undefined, bottom: undefined});

/* graphology stuff */

const graph = new Graph({ multi: true });
console.log('multi', graph.multi);

// Adding some nodes
graph.addNode('bar', { top: /* try toggling this! */ true, height: true, bottom: /* and this! */ false });
graph.addNode('tick', { top: false, height: true, bottom: false });
graph.addNode('letter', { top: false, height: true, bottom: false });

// Adding an edge
graph.addEdge('bar', 'tick', { constraintType: 'vSpace' });
graph.addEdge('tick', 'letter', { constraintType: 'vSpace' });

// Displaying useful information about your graph
console.log('Number of nodes', graph.order);
console.log('Number of edges', graph.size);

console.log();

console.log('nodes');

// Iterating over nodes
graph.forEachNode(node => {
  console.log(node);
  console.log(`{ top: ${graph.getNodeAttribute(node, 'top')}, height: ${graph.getNodeAttribute(node, 'height')}, bottom: ${graph.getNodeAttribute(node, 'bottom')} }`)
  console.log(graph.inNeighbors(node), graph.outNeighbors(node));
  console.log();
});

console.log('edges');

// iterating over edges
graph.forEachEdge(edge => console.log(graph.source(edge), graph.getEdgeAttribute(edge, 'constraintType'), graph.target(edge)));

console.log();

// bfs
// start at a node with no in-edges
// first check all of the incoming nodes for constraints
// next check whether two of the three are fields are defined. if they are, then the third field
//  is defined. record it as a self-edge
// if there are fewer than two fields defined, the system is underconstrained. create default values
//   and emit a warning
// if there are exactly three fields defined, add a self-edge for asserting the system is properly
//   constrained
// each edge is an operator. each node is a bbox

console.log("begin BFS");
bfsFromNode(graph, 'bar', function (node, attr, depth) {
  console.log(node, attr, depth);
  console.log("inbound edges");
  graph.forEachInboundEdge(node, edge => console.log(graph.source(edge), graph.getEdgeAttribute(edge, 'constraintType'), graph.target(edge)));
  // propagate vSpace (and in future other) constraint DOF
  graph.forEachInboundEdge(node, edge => {
    const constraintType = graph.getEdgeAttribute(edge, 'constraintType');
    graph.updateNodeAttributes(node, attr => {
      if (constraintType === 'vSpace') {
        // TODO: if top is already true, need to add an assertion that the two constraints are equal
        return {
          ...attr,
          top: true,
        }
      } else {
        return attr;
      }
    })
  });

  // set up inferences and assertions
  attr = graph.getNodeAttributes(node);
  if (attr.top && attr.height && attr.bottom) {
    graph.addEdge(node, node, { constraintType: 'assert'});
  } else if (attr.height && attr.bottom) {
    graph.addEdge(node, node, { constraintType: 'infer-top'});
    graph.setNodeAttribute(node, 'top', true);
  } else if (attr.top && attr.bottom) {
    graph.addEdge(node, node, { constraintType: 'infer-height'});
    graph.setNodeAttribute(node, 'height', true);
  } else if (attr.top && attr.height) {
    graph.addEdge(node, node, { constraintType: 'infer-bottom'});
    graph.setNodeAttribute(node, 'bottom', true);
  } else if (!attr.top && !attr.height && !attr.bottom) {
    graph.addEdge(node, node, { constraintType: 'default-top'});
    graph.addEdge(node, node, { constraintType: 'default-height'});
    graph.addEdge(node, node, { constraintType: 'infer-bottom'});
    graph.setNodeAttribute(node, 'top', true);
    graph.setNodeAttribute(node, 'height', true);
    graph.setNodeAttribute(node, 'bottom', true);
  } else if (!attr.top && !attr.height) {
    graph.addEdge(node, node, { constraintType: 'infer-top'});
    graph.addEdge(node, node, { constraintType: 'default-height'});
    graph.setNodeAttribute(node, 'top', true);
    graph.setNodeAttribute(node, 'height', true);
  } else if (!attr.height && !attr.bottom) {
    graph.addEdge(node, node, { constraintType: 'default-height'});
    graph.addEdge(node, node, { constraintType: 'infer-bottom'});
    graph.setNodeAttribute(node, 'height', true);
    graph.setNodeAttribute(node, 'bottom', true);
  } else if (!attr.top && !attr.bottom) {
    graph.addEdge(node, node, { constraintType: 'default-top'});
    graph.addEdge(node, node, { constraintType: 'infer-bottom'});
    graph.setNodeAttribute(node, 'top', true);
    graph.setNodeAttribute(node, 'bottom', true);
  }
});

graph.forEachNode(node => {
  console.log(node);
  console.log(`{ top: ${graph.getNodeAttribute(node, 'top')}, height: ${graph.getNodeAttribute(node, 'height')}, bottom: ${graph.getNodeAttribute(node, 'bottom')} }`)
  console.log("in:", graph.inNeighbors(node), "out:", graph.outNeighbors(node));
  console.log();
});

graph.forEachEdge(edge => console.log(graph.source(edge), graph.getEdgeAttribute(edge, 'constraintType'), graph.target(edge)));

// make constraint graph
// analyze graph to figure out where to apply default values
// analyze graph to figure out where graph might be overconstrained (can't know 100% until runtime,
//   but can do some amount of static analysis)
// use graph to construct rxjs dataflow DAG(?)
// -- compilation should be faster than the implementation above, which has a case statement every
//      time propagation happens

// bar: h: 100
// tick: h: 8
// letter: h: 10

// bar->tick: vSpace(5)
// tick->letter: vSpace(1)


// dataflow graph: bar->tick->letter
// (but also with the heights specified)
// (but also with default values assigned for bar)

// start with hand-crafted dataflow graph
// then construct it from directed constraints
// then construct it from undirected constraints
